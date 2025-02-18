import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { useRouter } from "next/router";
import Script from "next/script";

// Definir la propiedad global en window para el callback de Turnstile
declare global {
  interface Window {
    turnstileCallback?: (token: string) => void;
  }
}

export default function ChangePassword() {
  const [password, setPassword] = useState("");
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

  async function handleChangePassword() {
    setMessage(null);
    setIsLoading(true);

    if (!captchaToken) {
      setMessage({ text: "❌ Debes completar la verificación CAPTCHA.", type: "error" });
      setIsLoading(false);
      return;
    }

    const { error } = await supabase.auth.updateUser({ password });

    if (error) {
      setMessage({ text: `❌ Error: ${error.message}`, type: "error" });
    } else {
      setMessage({ text: "✅ Contraseña cambiada correctamente. Redirigiendo...", type: "success" });
      setTimeout(() => router.push("/login"), 3000);
    }

    setIsLoading(false);
  }

  return (
    <div className="flex flex-col items-center justify-center h-screen">
      {/* Cargar el script de Turnstile */}
      <Script src="https://challenges.cloudflare.com/turnstile/v0/api.js" async defer />

      <h2 className="text-2xl font-bold">Cambiar Contraseña</h2>

      {message && (
        <p className={`mt-4 p-2 rounded ${message.type === "success" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
          {message.text}
        </p>
      )}

      <input
        className="border p-2 w-80 my-2"
        type="password"
        placeholder="Nueva contraseña"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />

      {/* Captcha de Cloudflare Turnstile */}
      <div
        className="cf-turnstile mt-4"
        data-sitekey="0x4AAAAAAA9J_DKlwm-1EcKR"
        data-callback="turnstileCallback"
        data-theme="dark"
      ></div>

      <button
        className="bg-blue-500 text-white px-4 py-2 mt-4 rounded"
        onClick={handleChangePassword}
        disabled={isLoading}
      >
        {isLoading ? "Guardando..." : "Guardar Contraseña"}
      </button>
    </div>
  );
}
