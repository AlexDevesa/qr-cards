import { useState } from "react";
import { supabase } from "../lib/supabase";
import { useRouter } from "next/router";
import ProtectedRoute from "../components/ProtectedRoute";
import Logout from "../components/Logout";
import DarkContainer from "../components/DarkContainer";

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
      <DarkContainer>
        <div className="p-6">
          {/* Título y Logout */}
          <div className="flex flex-col md:flex-row justify-between items-center mb-6">
            <h1 className="text-3xl font-bold text-white text-center md:text-left">Registrar Nueva Empresa</h1>
            <Logout />
          </div>
  
          {/* 🔹 Mensaje de Éxito/Error */}
          {message && (
            <p className={`p-3 rounded text-white ${message.type === "success" ? "bg-green-500" : "bg-red-500"}`}>
              {message.text}
            </p>
          )}
  
          {/* 📌 Formulario de Registro */}
          <div className="grid grid-cols-1 gap-4">
            <input className="input-field" placeholder="Nombre de la Empresa" onChange={(e) => setNombreEmpresa(e.target.value)} />
            <input className="input-field" placeholder="Nombre del Administrador" onChange={(e) => setNombreAdmin(e.target.value)} />
            <input className="input-field" placeholder="Email del Administrador" onChange={(e) => setEmailAdmin(e.target.value)} />
            <input className="input-field" type="password" placeholder="Contraseña del Administrador" onChange={(e) => setPasswordAdmin(e.target.value)} />
          </div>
  
          {/* 📌 Botones de acción */}
          <div className="flex flex-col md:flex-row gap-4 mt-6">
            <button className="btn-primary w-full md:w-auto" onClick={handleCrearEmpresa} disabled={isLoading}>
              {isLoading ? "Creando..." : "Crear Empresa"}
            </button>
            <button className="btn-back w-full md:w-auto" onClick={() => router.push("/admin")}>
              Atrás
            </button>
          </div>
        </div>
      </DarkContainer>
    </ProtectedRoute>
  );
  
}
