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
  const [descargas, setDescargas] = useState<any[]>([]);
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

      // 🔹 Obtener Tarjetas
      const { data: tarjetasData } = await supabase
        .from("tarjetas")
        .select(
          "id, codigo, url_custom, url_id, empresa_id, comercial_id, activa, empresas(nombre), usuarios(nombre, email)"
        );
      setTarjetas(tarjetasData || []);

      
      // Obtener Descargas (visitas y descargas)
      const { data: descargasData } = await supabase.from("descargas").select("id, tarjeta_id, tipo");
      setDescargas(descargasData || []);
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
      <div className="p-6 min-h-screen bg-gray-900 text-gray-200">
        
        {/* Título y Botones */}
        <div className="bg-gray-800 p-6 shadow-md rounded-lg">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <h1 className="text-3xl font-bold text-white mb-4 md:mb-0">Panel de Root</h1>
            <div className="flex flex-wrap gap-2">
              <button className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded" onClick={() => router.push("/crear-empresa")}>
                Registrar Empresa
              </button>
              <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded" onClick={() => router.push("/crear-tarjeta")}>
                Registrar Tarjeta
              </button>
            </div>
            <Logout />
          </div>
        </div>
  
        {/* Empresas */}
        <div className="mt-6 bg-gray-700 shadow p-4 rounded-md">
          <h2 className="text-xl font-bold text-white">Empresas</h2>
          {empresas.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full table-auto border-collapse my-4 text-gray-300">
                <thead>
                  <tr className="bg-gray-600 text-gray-200">
                    <th className="border px-4 py-2">Nombre</th>
                    <th className="border px-4 py-2">ID</th>
                  </tr>
                </thead>
                <tbody>
                  {empresas.map((e) => (
                    <tr key={e.id} className="text-center bg-gray-800 hover:bg-gray-700">
                      <td className="border px-4 py-2">{e.nombre}</td>
                      <td className="border px-4 py-2">{e.id}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-gray-400">No hay empresas registradas.</p>
          )}
        </div>
  
        {/* Usuarios */}
        <div className="mt-6 bg-gray-700 shadow p-4 rounded-md">
          <h2 className="text-xl font-bold text-white">Usuarios</h2>
          {usuarios.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full table-auto border-collapse my-4 text-gray-300">
                <thead>
                  <tr className="bg-gray-600 text-gray-200">
                    <th className="border px-4 py-2">Nombre</th>
                    <th className="border px-4 py-2">Email</th>
                    <th className="border px-4 py-2">Rol</th>
                    <th className="border px-4 py-2">Empresa</th>
                    <th className="border px-4 py-2">Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {usuarios.map((u) => (
                    <tr key={u.id} className="text-center bg-gray-800 hover:bg-gray-700">
                      <td className="border px-4 py-2">{u.nombre}</td>
                      <td className="border px-4 py-2">{u.email}</td>
                      <td className="border px-4 py-2">{u.rol.toUpperCase()}</td>
                      <td className="border px-4 py-2">{u.empresas?.nombre || "Sin asignar"}</td>
                      <td className="border px-4 py-2">
                        <span className={`inline-block px-3 py-1 rounded-full text-white ${u.activo ? "bg-green-500" : "bg-red-500"}`}>
                          {u.activo ? "Activo" : "Inactivo"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-gray-400">No hay usuarios registrados.</p>
          )}
        </div>
  
        {/* Tarjetas */}
        <div className="mt-6 bg-gray-700 shadow p-4 rounded-md">
          <h2 className="text-xl font-bold text-white">Tarjetas</h2>
          {tarjetas.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full table-auto border-collapse my-4 text-gray-300">
                <thead>
                  <tr className="bg-gray-600 text-gray-200 text-sm md:text-base">
                    <th className="border px-2 md:px-4 py-2">Código</th>
                    {/* 🔹 nuevo encabezado */}
                    <th className="border px-2 md:px-4 py-2">URL / Slug</th>
                    <th className="border px-2 md:px-4 py-2">Empresa</th>
                    <th className="border px-2 md:px-4 py-2">Comercial</th>
                    <th className="border px-2 md:px-4 py-2">Estado</th>
                    <th className="border px-2 md:px-4 py-2">Visitas</th>
                    <th className="border px-2 md:px-4 py-2">Descargas</th>
                  </tr>
                </thead>

                <tbody>
                  {tarjetas.map((t) => {
                    // 🔹 usamos url_custom si existe; si no, el url_id
                    const slug = t.url_custom || t.url_id;
                    const slugCell = slug ? (
                      <a
                        href={`https://qr.techversio.com/u/${slug}`}
                        className="text-blue-400 underline"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        {slug}
                      </a>
                    ) : (
                      "—"
                    );

                    return (
                      <tr
                        key={t.id}
                        className="text-center bg-gray-800 hover:bg-gray-700 text-sm md:text-base"
                      >
                        <td className="border px-2 md:px-4 py-2">{t.codigo}</td>
                        <td className="border px-2 md:px-4 py-2">{slugCell}</td>
                        <td className="border px-2 md:px-4 py-2">
                          {t.empresas?.nombre || "N/A"}
                        </td>
                        <td className="border px-2 md:px-4 py-2">
                          {t.usuarios?.nombre || "No asignado"}
                        </td>
                        <td className="border px-2 md:px-4 py-2">
                          <span
                            className={`inline-block px-3 py-1 rounded-full text-white ${
                              t.activa ? "bg-green-500" : "bg-red-500"
                            }`}
                          >
                            {t.activa ? "Activa" : "Inactiva"}
                          </span>
                        </td>
                        <td className="border px-2 md:px-4 py-2">
                          {descargas.filter(
                            (d) => d.tarjeta_id === t.id && d.tipo === "view"
                          ).length}
                        </td>
                        <td className="border px-2 md:px-4 py-2">
                          {descargas.filter(
                            (d) => d.tarjeta_id === t.id && d.tipo === "download"
                          ).length}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-gray-400">No hay tarjetas registradas.</p>
          )}
        </div>
  
      </div>
    </ProtectedRoute>
  );
}  