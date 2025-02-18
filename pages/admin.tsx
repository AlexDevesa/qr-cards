import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { useRouter } from "next/router";
import ProtectedRoute from "../components/ProtectedRoute";
import Logout from "../components/Logout";

export default function AdminPanel() {
  
  const router = useRouter();
  const [empresas, setEmpresas] = useState<any[]>([]);
  const [usuarios, setUsuarios] = useState<any[]>([]);
  const [tarjetas, setTarjetas] = useState<any[]>([]);
  const [isRoot, setIsRoot] = useState(false);

  useEffect(() => {
    async function fetchData() {
      // 🔹 Verificar si el usuario autenticado es root
      const { data: authData, error: authError } = await supabase.auth.getUser();
      if (authError || !authData?.user) {
        router.push("/login");
        return;
      }

      const { data: usuarioData, error: usuarioError } = await supabase
        .from("usuarios")
        .select("rol")
        .eq("email", authData.user.email)
        .single();

      if (usuarioError || !usuarioData) {
        router.push("/login");
        return;
      }

      if (usuarioData.rol !== "root") {
        router.push("/dashboard");
        return;
      }

      setIsRoot(true);

      // 🔹 Obtener TODAS las empresas
      const { data: empresasData, error: empresasError } = await supabase.from("empresas").select("*");
      if (empresasError) console.error("Error obteniendo empresas:", empresasError.message);
      setEmpresas(empresasData || []);

      // 🔹 Obtener TODOS los usuarios sin restricciones
      const { data: usuariosData, error: usuariosError } = await supabase
        .from("usuarios")
        .select("id, nombre, email, rol, empresa_id, activo, empresas(nombre)");

      if (usuariosError) console.error("Error obteniendo usuarios:", usuariosError.message);
      setUsuarios(usuariosData || []);

      // 🔹 Obtener TODAS las tarjetas sin importar la empresa
      const { data: tarjetasData, error: tarjetasError } = await supabase
        .from("tarjetas")
        .select("id, url_custom, empresa_id, comercial_id, empresas(nombre), usuarios(nombre, email)");

      if (tarjetasError) console.error("Error obteniendo tarjetas:", tarjetasError.message);
      setTarjetas(tarjetasData || []);
    }

    fetchData();
  }, [router]);

  if (!isRoot) {
    return (
      <ProtectedRoute>
        <div className="p-6">
          <p>Cargando...</p>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <div className="p-6">
        <Logout />
        <h1 className="text-2xl font-bold">Panel de Root</h1>

        {/* 🔹 Opciones */}
        <div className="mt-6">
          <h2 className="text-xl font-bold">Opciones</h2>
          <button className="bg-green-500 text-white px-4 py-2 mt-2 rounded" onClick={() => router.push("/crear-empresa")}>
            Registrar Nueva Empresa
          </button>
          <button className="bg-blue-500 text-white px-4 py-2 mt-2 rounded ml-2" onClick={() => router.push("/crear-tarjeta")}>
            Registrar Nueva Tarjeta
          </button>
        </div>

        {/* 🔹 Empresas */}
        <h2 className="text-xl mt-6 font-bold">Empresas</h2>
        {empresas.length > 0 ? (
          <ul className="list-disc pl-6">
            {empresas.map((e) => (
              <li key={e.id}>{e.nombre} (ID: {e.id})</li>
            ))}
          </ul>
        ) : (
          <p>No hay empresas registradas.</p>
        )}

        {/* 🔹 Usuarios */}
        <h2 className="text-xl mt-6 font-bold">Usuarios (Admins y Comerciales)</h2>
        {usuarios.length > 0 ? (
          <ul className="list-disc pl-6">
            {usuarios.map((u) => (
              <li key={u.id}>
                <strong>{u.nombre}</strong> ({u.email}) - {u.rol.toUpperCase()} - Empresa: {u.empresas?.nombre || "Sin asignar"} - 
                {u.activo ? <span className="text-green-500"> Activo</span> : <span className="text-red-500"> Inactivo</span>}
              </li>
            ))}
          </ul>
        ) : (
          <p>No hay usuarios registrados.</p>
        )}

        {/* 🔹 Tarjetas */}
        <h2 className="text-xl mt-6 font-bold">Tarjetas</h2>
        {tarjetas.length > 0 ? (
          <ul className="list-disc pl-6">
            {tarjetas.map((t) => (
              <li key={t.id}>
                <strong>URL:</strong> <a href={`https://qr.techversio.com/u/${t.url_custom}`} target="_blank" rel="noopener noreferrer" className="text-blue-500 underline">{t.url_custom}</a>  
                <br />
                <strong>Empresa:</strong> {t.empresas?.nombre || "Sin asignar"}  
                <br />
                <strong>Comercial:</strong> {t.usuarios?.nombre || "No asignado"} ({t.usuarios?.email || "N/A"})
              </li>
            ))}
          </ul>
        ) : (
          <p>No hay tarjetas registradas.</p>
        )}
      </div>
    </ProtectedRoute>
  );
}
