import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { useRouter } from "next/router";
import DarkContainer from "../components/DarkContainer";

declare global {
  interface Window {
    turnstileCallback?: (token: string) => void;
    turnstile?: any;
  }
}

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [captchaToken, setCaptchaToken] = useState(""); // Estado para el token de Turnstile
  const router = useRouter();

  useEffect(() => {
    window.turnstileCallback = (token: string) => {
      setCaptchaToken(token);
    };

    return () => {
      delete window.turnstileCallback;
    };
  }, []);

  useEffect(() => {
    // Verificar si el script ya existe en el documento
    if (!document.getElementById("turnstile-script")) {
      const script = document.createElement("script");
      script.src = "https://challenges.cloudflare.com/turnstile/v0/api.js";
      script.async = true;
      script.defer = true;
      script.id = "turnstile-script";

      script.onload = () => {
        // Renderizar Turnstile SOLO si no está presente en el DOM
        if (window.turnstile && !document.querySelector(".cf-turnstile")) {
          window.turnstile.render("#captcha-container", {
            sitekey: "0x4AAAAAAA9J_DKlwm-1EcKR",
            callback: window.turnstileCallback,
            theme: "dark",
          });
        }
      };

      document.body.appendChild(script);
    } else {
      // Si el script ya está cargado, asegurarse de que el CAPTCHA solo se renderiza una vez
      if (window.turnstile && !document.querySelector(".cf-turnstile")) {
        setTimeout(() => {
          window.turnstile.render("#captcha-container", {
            sitekey: "0x4AAAAAAA9J_DKlwm-1EcKR",
            callback: window.turnstileCallback,
            theme: "dark",
          });
        }, 500); // Retraso para evitar dobles renders
      }
    }
  }, []);

  async function handlePasswordReset() {
    setMessage(null);
    setIsLoading(true);

    if (!captchaToken) {
      setMessage({ text: "❌ Debes completar la verificación CAPTCHA.", type: "error" });
      setIsLoading(false);
      return;
    }

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: "http://qr.techversio.com/change_password",
    });

    if (error) {
      setMessage({ text: `❌ Error: ${error.message}`, type: "error" });
    } else {
      setMessage({ text: "✅ Revisa tu correo para cambiar la contraseña.", type: "success" });
      setTimeout(() => router.push("/login"), 5000);
    }

    setIsLoading(false);
  }

  return (
    <DarkContainer>
      <h2 className="text-2xl font-bold text-center">Recuperar Contraseña</h2>

      {message && (
        <p
          className={`mt-4 p-2 rounded text-center ${
            message.type === "success" ? "bg-green-500 text-white" : "bg-red-500 text-white"
          }`}
        >
          {message.text}
        </p>
      )}

      <input
        type="email"
        placeholder="Introduce tu email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="mt-4"
      />

      {/* Contenedor del CAPTCHA */}
      <div id="captcha-container" className="mt-4"></div>

      <button className="w-full mt-4" onClick={handlePasswordReset} disabled={isLoading}>
        {isLoading ? "Enviando..." : "Enviar Instrucciones"}
      </button>

      <button className="w-full mt-2 bg-gray-600 hover:bg-gray-700" onClick={() => router.push("/login")}>
        Volver al Login
      </button>
    </DarkContainer>
  );
}
