import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { useRouter } from "next/router";
import DarkContainer from "../components/DarkContainer";
import Captcha from "../lib/captcha";


export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [captchaToken, setCaptchaToken] = useState(""); // Estado para el token de Turnstile
  const router = useRouter();


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
          
          <Captcha onVerify={setCaptchaToken} />
  
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
