import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { useRouter } from "next/router";
import DarkContainer from "../components/DarkContainer";
import Script from "next/script";

// Definir la propiedad global en window para el callback de Turnstile
declare global {
  interface Window {
    turnstileCallback?: (token: string) => void;
  }
}

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [captchaToken, setCaptchaToken] = useState(""); // Estado para el token de Turnstile
  const router = useRouter();

  useEffect(() => {
    // Definir el callback de Turnstile
    window.turnstileCallback = function (token: string) {
      setCaptchaToken(token);
    };

    return () => {
      delete window.turnstileCallback; // Limpiar referencia al desmontar
    };
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
      redirectTo: "http://localhost:3000/change_password",
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
      {/* Cargar el script de Turnstile */}
      <Script src="https://challenges.cloudflare.com/turnstile/v0/api.js" async defer />

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

      {/* Captcha de Cloudflare Turnstile */}
      <div
        className="cf-turnstile mt-4"
        data-sitekey="0x4AAAAAAA9J_DKlwm-1EcKR"
        data-callback="turnstileCallback"
        data-theme="dark"
      ></div>

      <button className="w-full mt-4" onClick={handlePasswordReset} disabled={isLoading}>
        {isLoading ? "Enviando..." : "Enviar Instrucciones"}
      </button>

      <button className="w-full mt-2 bg-gray-600 hover:bg-gray-700" onClick={() => router.push("/login")}>
        Volver al Login
      </button>
    </DarkContainer>
  );
}
