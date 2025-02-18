import { useState } from "react";
import { supabase } from "../lib/supabase";
import { useRouter } from "next/router";
import ProtectedRoute from "../components/ProtectedRoute";
import Logout from "../components/Logout";

export default function CrearEmpresa() {
  const router = useRouter();
  const [nombreEmpresa, setNombreEmpresa] = useState("");
  const [nombreAdmin, setNombreAdmin] = useState("");
  const [emailAdmin, setEmailAdmin] = useState("");
  const [passwordAdmin, setPasswordAdmin] = useState("");
  const [message, setMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  async function handleCrearEmpresa() {
    setMessage(null);
    setIsLoading(true);

    let empresaId: string | null = null;
    let usuarioId: string | null = null; 

    if (!nombreEmpresa || !nombreAdmin || !emailAdmin || !passwordAdmin) {
      setMessage({ text: "Todos los campos son obligatorios.", type: "error" });
      setIsLoading(false);
      return;
    }

    try {
      // 🔹 1. Crear empresa en la base de datos
      const { data: empresaData, error: empresaError } = await supabase
        .from("empresas")
        .insert([{ nombre: nombreEmpresa }])
        .select("id")
        .single();

      if (empresaError) throw new Error(`Error al crear la empresa: ${empresaError.message}`);

      empresaId = empresaData.id;

      // 🔹 2. Crear el administrador en Supabase Auth
      const { data: authUser, error: authError } = await supabase.auth.signUp({
        email: emailAdmin,
        password: passwordAdmin,
      });

      if (authError) throw new Error(`Error al registrar el usuario en Auth: ${authError.message}`);

      usuarioId = authUser.user?.id ?? null;
      if (!usuarioId) throw new Error("No se obtuvo el ID del usuario creado.");

      // 🔹 3. Insertar usuario en la tabla `usuarios`
      const { error: usuarioError } = await supabase
        .from("usuarios")
        .insert([
          {
            id: usuarioId, // 🔹 Se asegura de que el ID sea el de Auth
            email: emailAdmin,
            nombre: nombreAdmin,
            empresa_id: empresaId,
            rol: "admin",
            activo: true,
          },
        ]);

      if (usuarioError) throw new Error(`Error al registrar el administrador en la DB: ${usuarioError.message}`);

      // 🔹 4. Crear perfil asociado
      const { error: perfilError } = await supabase.from("perfiles").insert([
        { comercial_id: usuarioId, nombre: nombreAdmin, email: emailAdmin },
      ]);

      if (perfilError) throw new Error(`Error al crear el perfil del admin: ${perfilError.message}`);

      setMessage({ text: "✅ Empresa, administrador y perfil creados correctamente.", type: "success" });

      // 🔹 Redirigir a admin después de unos segundos
      setTimeout(() => {
        router.push("/admin");
      }, 3000);
    } catch (error: any) {
      console.error(error.message);
      setMessage({ text: `❌ ${error.message}`, type: "error" });

      // 🔥 🔄 **Rollback Manual (Reversión)**
      if (usuarioId) {
        console.log("⏳ Eliminando usuario de Supabase Auth...");
        await supabase.auth.admin.deleteUser(usuarioId);
      }

      if (empresaId) {
        console.log("⏳ Eliminando empresa...");
        await supabase.from("empresas").delete().eq("id", empresaId);
      }
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <ProtectedRoute>
      <div className="p-6">
        <Logout />
        <h1 className="text-2xl font-bold">Registrar Nueva Empresa</h1>

        {/* 🔹 Mensaje de Éxito/Error */}
        {message && (
          <p className={`mt-4 p-2 rounded ${message.type === "success" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
            {message.text}
          </p>
        )}

        <input className="border p-2 w-full my-2" placeholder="Nombre de la Empresa" onChange={(e) => setNombreEmpresa(e.target.value)} />
        <input className="border p-2 w-full my-2" placeholder="Nombre del Administrador" onChange={(e) => setNombreAdmin(e.target.value)} />
        <input className="border p-2 w-full my-2" placeholder="Email del Administrador" onChange={(e) => setEmailAdmin(e.target.value)} />
        <input className="border p-2 w-full my-2" type="password" placeholder="Contraseña del Administrador" onChange={(e) => setPasswordAdmin(e.target.value)} />

        <div className="flex space-x-4">
          <button className="bg-green-500 text-white px-4 py-2 rounded" onClick={handleCrearEmpresa} disabled={isLoading}>
            {isLoading ? "Creando..." : "Crear Empresa"}
          </button>
          <button className="bg-gray-500 text-white px-4 py-2 rounded" onClick={() => router.push("/admin")}>
            Atrás
          </button>
        </div>
      </div>
    </ProtectedRoute>
  );
}
