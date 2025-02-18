import { useState } from "react";
import { supabase } from "../lib/supabase";
import { useRouter } from "next/router";
import ProtectedRoute from "../components/ProtectedRoute";
import Logout from "../components/Logout";

export default function AddComercial() {
  const router = useRouter();
  const [nombre, setNombre] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  async function handleCrearComercial() {
    setMessage(null);
    setIsLoading(true);

    let usuarioId: string | null = null;

    try {
      // 🔹 Obtener el ID de la empresa del usuario autenticado
      const { data: authUser, error: authError } = await supabase.auth.getUser();
      if (authError || !authUser.user) throw new Error("No se pudo obtener el usuario autenticado.");

      const { data: usuarioData, error: usuarioError } = await supabase
        .from("usuarios")
        .select("empresa_id")
        .eq("email", authUser.user.email)
        .single();

      if (usuarioError || !usuarioData) throw new Error("No se encontró la empresa del usuario.");

      const empresaId = usuarioData.empresa_id;

      // 🔹 Crear usuario en Supabase Auth
      const { data: authComercial, error: authComercialError } = await supabase.auth.signUp({
        email,
        password,
      });

      if (authComercialError) throw new Error(`Error en Auth: ${authComercialError.message}`);

      usuarioId = authComercial.user?.id ?? null;
      if (!usuarioId) throw new Error("No se obtuvo el ID del usuario creado.");

      // 🔹 Insertar en la tabla `usuarios`
      const { error: usuarioInsertError } = await supabase.from("usuarios").insert([
        { id: usuarioId, email, nombre, empresa_id: empresaId, rol: "comercial", activo: true },
      ]);

      if (usuarioInsertError) throw new Error(`Error al crear usuario en la DB: ${usuarioInsertError.message}`);

      // 🔹 Crear perfil asociado
      const { error: perfilError } = await supabase.from("perfiles").insert([
        { comercial_id: usuarioId, nombre, email },
      ]);

      if (perfilError) throw new Error(`Error al crear perfil: ${perfilError.message}`);

      setMessage({ text: "✅ Comercial y perfil creados correctamente.", type: "success" });

      setTimeout(() => router.push("/dashboard"), 3000);
    } catch (error: any) {
      //console.error(error.message);
      setMessage({ text: `❌ ${error.message}`, type: "error" });

      // 🔥 **Rollback Manual**
      if (usuarioId) {
        //console.log("⏳ Eliminando usuario en Auth...");
        await supabase.auth.admin.deleteUser(usuarioId);
        //console.log("✅ Usuario eliminado.");
      }
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <ProtectedRoute>
      <div className="p-6 min-h-screen bg-gray-900 text-gray-200 flex flex-col items-center">
        
        {/* Contenedor principal */}
        <div className="bg-gray-800 p-6 shadow-md rounded-lg w-full max-w-lg">
          
          {/* Título y Logout */}
          <div className="flex flex-col md:flex-row justify-between items-center mb-6">
            <h1 className="text-3xl font-bold text-white mb-4 md:mb-0">Añadir Comercial</h1>
            <Logout />
          </div>
  
          {/* Mensaje de éxito/error */}
          {message && (
            <p
              className={`p-3 rounded-md text-white text-center ${
                message.type === "success" ? "bg-green-500" : "bg-red-500"
              }`}
            >
              {message.text}
            </p>
          )}
  
          {/* Formulario de creación */}
          <div className="mt-4 bg-gray-700 p-6 shadow rounded-md">
            <h2 className="text-xl font-bold text-white mb-4 text-center">Datos del Comercial</h2>
            <div className="grid grid-cols-1 gap-4">
              <input
                className="bg-gray-800 text-white p-2 rounded-md border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Nombre"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
              />
              <input
                className="bg-gray-800 text-white p-2 rounded-md border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <input
                className="bg-gray-800 text-white p-2 rounded-md border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                type="password"
                placeholder="Contraseña"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>
  
          {/* Botones */}
          <div className="flex flex-col md:flex-row gap-4 mt-6 justify-center">
            <button
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md shadow w-full md:w-auto"
              onClick={handleCrearComercial}
              disabled={isLoading}
            >
              {isLoading ? "Creando..." : "Crear Comercial"}
            </button>
  
            <button
              className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-md shadow w-full md:w-auto"
              onClick={() => router.push("/dashboard")}
            >
              Atrás
            </button>
          </div>
  
        </div>
      </div>
    </ProtectedRoute>
  );
  
}  
