import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { useRouter } from "next/router";
import DarkContainer from "../components/DarkContainer";

// Definir la propiedad global en window para el callback de Turnstile
declare global {
  interface Window {
    turnstileCallback?: (token: string) => void;
    turnstile?: any;
  }
}

export default function ChangePassword() {
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [captchaToken, setCaptchaToken] = useState("");
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
    // Verificar si el script ya está en el documento
    if (!document.getElementById("turnstile-script")) {
      const script = document.createElement("script");
      script.src = "https://challenges.cloudflare.com/turnstile/v0/api.js";
      script.async = true;
      script.defer = true;
      script.id = "turnstile-script";

      script.onload = () => {
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
      if (window.turnstile && !document.querySelector(".cf-turnstile")) {
        setTimeout(() => {
          window.turnstile.render("#captcha-container", {
            sitekey: "0x4AAAAAAA9J_DKlwm-1EcKR",
            callback: window.turnstileCallback,
            theme: "dark",
          });
        }, 500);
      }
    }
  }, []);

  // Función para validar la contraseña
  function validatePassword(password: string): boolean {
    const minLength = password.length >= 10;
    const hasLowerCase = /[a-z]/.test(password);
    const hasUpperCase = /[A-Z]/.test(password);
    const hasDigit = /\d/.test(password);
    const hasSymbol = /[^a-zA-Z\d]/.test(password);

    return minLength && hasLowerCase && hasUpperCase && hasDigit && hasSymbol;
  }

  async function handleChangePassword() {
    setMessage(null);
    setIsLoading(true);

    if (!validatePassword(password)) {
      setMessage({
        text: "❌ La contraseña debe tener al menos 10 caracteres, incluyendo mayúsculas, minúsculas, números y símbolos.",
        type: "error",
      });
      setIsLoading(false);
      return;
    }

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

      <DarkContainer>
        <div className="p-6">
          {/* Título */}
          <h2 className="text-3xl font-bold text-white text-center mb-6">Cambiar Contraseña</h2>
  
          {/* 🔹 Mensaje de Éxito/Error */}
          {message && (
            <p className={`p-3 rounded text-white text-center ${message.type === "success" ? "bg-green-500" : "bg-red-500"}`}>
              {message.text}
            </p>
          )}
  
          {/* 📌 Campo de contraseña */}
          <label className="text-white">Nueva Contraseña</label>
          <input
            className="input-field"
            type="password"
            placeholder="Ingrese nueva contraseña"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
  
          {/* 📌 Contenedor del CAPTCHA */}
          <div id="captcha-container" className="mt-4"></div>
  
          {/* 📌 Botón Guardar */}
          <button className="btn-primary w-full mt-6" onClick={handleChangePassword} disabled={isLoading}>
            {isLoading ? "Guardando..." : "Guardar Contraseña"}
          </button>
        </div>
      </DarkContainer>

  );
  
}
