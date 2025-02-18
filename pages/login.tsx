import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { useRouter } from "next/router";
import DarkContainer from "../components/DarkContainer";
import Script from "next/script";

// Definir la propiedad global en el objeto window para evitar errores de TypeScript
declare global {
  interface Window {
    turnstileCallback?: (token: string) => void;
  }
}

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [captchaToken, setCaptchaToken] = useState(""); // Estado para el token de Turnstile
  const router = useRouter();

  useEffect(() => {
    // Definir el callback de Turnstile en window
    window.turnstileCallback = function (token: string) {
      setCaptchaToken(token);
    };

    return () => {
      delete window.turnstileCallback; // Limpiar la referencia cuando el componente se desmonta
    };
  }, []);

  async function handleLogin() {
    setErrorMessage("");
    setIsLoading(true);

    if (!captchaToken) {
      setErrorMessage("Debes completar la verificación CAPTCHA.");
      setIsLoading(false);
      return;
    }

    const { data: authUser, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
      options: {
        captchaToken, // Enviar el token del CAPTCHA a Supabase
      },
    });

    if (authError || !authUser.user) {
      setErrorMessage("Correo o contraseña incorrectos.");
      setIsLoading(false);
      return;
    }

    const { data: usuarioData, error: usuarioError } = await supabase
      .from("usuarios")
      .select("*")
      .eq("email", email)
      .maybeSingle();

    if (usuarioError || !usuarioData) {
      setErrorMessage("No tienes un perfil registrado en la base de datos.");
      await supabase.auth.signOut();
      setIsLoading(false);
      return;
    }

    setIsLoading(false);
    router.push(usuarioData.rol === "root" || usuarioData.rol === "admin" ? "/dashboard" : "/user");
  }

  return (
    <DarkContainer>
      {/* Cargar el script de Turnstile */}
      <Script src="https://challenges.cloudflare.com/turnstile/v0/api.js" async defer />

      <h2 className="text-2xl font-bold text-center">Iniciar Sesión</h2>

      <input
        type="email"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="mt-4"
      />

      <div className="relative w-full mt-4">
        <input
          type={showPassword ? "text" : "password"}
          placeholder="Contraseña"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleLogin()}
          className="pr-10"
        />
        <button
          className="absolute right-2 top-2 text-gray-400 hover:text-gray-200"
          onClick={() => setShowPassword(!showPassword)}
          type="button"
        >
          {showPassword ? "🙈" : "👁️"}
        </button>
      </div>

      {/* Captcha de Cloudflare Turnstile */}
      <div
        className="cf-turnstile mt-4"
        data-sitekey="0x4AAAAAAA9J_DKlwm-1EcKR"
        data-callback="turnstileCallback"
        data-theme="dark"
      ></div>

      {errorMessage && <p className="text-error">{errorMessage}</p>}

      <p className="text-sm text-blue-400 cursor-pointer mt-2 text-center" onClick={() => router.push("/forgot_password")}>
        ¿Olvidaste la contraseña?
      </p>

      <button className="w-full mt-4" onClick={handleLogin} disabled={isLoading}>
        {isLoading ? "Cargando..." : "Entrar"}
      </button>
    </DarkContainer>
  );
}
