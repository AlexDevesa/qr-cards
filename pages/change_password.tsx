import { useState } from "react";
import { supabase } from "../lib/supabase";
import { useRouter } from "next/router";

export default function ChangePassword() {
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  async function handleChangePassword() {
    setMessage(null);
    setIsLoading(true);

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

      <button
        className="bg-blue-500 text-white px-4 py-2 mt-2 rounded"
        onClick={handleChangePassword}
        disabled={isLoading}
      >
        {isLoading ? "Guardando..." : "Guardar Contraseña"}
      </button>
    </div>
  );
}
