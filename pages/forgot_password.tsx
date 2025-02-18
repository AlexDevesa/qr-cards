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
        <div className="p-6">
          {/* Título */}
          <h2 className="text-3xl font-bold text-white text-center mb-6">Recuperar Contraseña</h2>
  
          {/* 🔹 Mensaje de Éxito/Error */}
          {message && (
            <p className={`p-3 rounded text-white text-center ${message.type === "success" ? "bg-green-500" : "bg-red-500"}`}>
              {message.text}
            </p>
          )}
  
          {/* 📌 Campo de Email */}
          <label className="text-white">Correo Electrónico</label>
          <input
            type="email"
            className="input-field"
            placeholder="Introduce tu email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
  
          {/* 📌 Contenedor del CAPTCHA */}
          <div id="captcha-container" className="mt-4"></div>
  
          {/* 📌 Botón Enviar Instrucciones */}
          <button className="btn-primary w-full mt-6" onClick={handlePasswordReset} disabled={isLoading}>
            {isLoading ? "Enviando..." : "Enviar Instrucciones"}
          </button>
  
          {/* 📌 Botón Volver al Login */}
          <button className="btn-back w-full mt-4" onClick={() => router.push("/login")}>
            Volver al Login
          </button>
        </div>
      </DarkContainer>
  );
  
}
