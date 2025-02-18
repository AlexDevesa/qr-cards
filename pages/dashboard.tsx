import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { useRouter } from "next/router";
import ProtectedRoute from "../components/ProtectedRoute";
import Logout from "../components/Logout";

export default function Dashboard() {
  const router = useRouter();
  const [usuario, setUsuario] = useState<any>(null);
  const [empresa, setEmpresa] = useState<any>(null);
  const [comerciales, setComerciales] = useState<any[]>([]);
  const [tarjetas, setTarjetas] = useState<any[]>([]);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    async function fetchUsuario() {
      const { data: authData, error: authError } = await supabase.auth.getUser();
      if (authError || !authData.user) {
        setErrorMessage("Debes iniciar sesión.");
        return router.push("/login");
      }

      const { data: usuarioData, error: usuarioError } = await supabase
        .from("usuarios")
        .select("id, rol, empresa_id")
        .eq("email", authData.user.email)
        .single();

      if (usuarioError || !usuarioData) {
        setErrorMessage("No tienes un perfil registrado en la base de datos.");
        await supabase.auth.signOut();
        return router.push("/login");
      }

      setUsuario(authData.user);

      if (!usuarioData.empresa_id) {
        setErrorMessage("No tienes una empresa asignada.");
        return;
      }

      const empresaId = usuarioData.empresa_id;

      const { data: empresaData, error: empresaError } = await supabase
        .from("empresas")
        .select("*")
        .eq("id", empresaId)
        .single();

      if (empresaError || !empresaData) {
        setErrorMessage("Error al cargar los datos de la empresa.");
        return;
      }

      setEmpresa(empresaData);

      const { data: comercialesData } = await supabase
        .from("usuarios")
        .select("id, nombre, email")
        .eq("empresa_id", empresaId)
        .eq("rol", "comercial");

      setComerciales(comercialesData || []);

      const { data: tarjetasData } = await supabase
        .from("tarjetas")
        .select("codigo, url_custom, comercial_id, activa, usuarios (nombre)")
        .eq("empresa_id", empresaId);

      setTarjetas(tarjetasData || []);
    }

    fetchUsuario();
  }, []);

  return (
    <ProtectedRoute>
      <div className="p-6 min-h-screen bg-gray-900 text-gray-200">
        <div className="bg-gray-800 p-6 shadow-md rounded-lg">
          <div className="flex justify-between items-center">
            <h1 className="text-3xl font-bold text-white">Panel de Administración</h1>
            <Logout />
          </div>

          {errorMessage && <p className="text-red-400 mt-4">{errorMessage}</p>}

          {empresa ? (
            <div className="mt-6">
              <h2 className="text-2xl font-bold text-white">Empresa: {empresa.nombre}</h2>

              {/* Comerciales */}
              <div className="mt-6 bg-gray-700 shadow p-4 rounded-md">
                <h2 className="text-xl font-bold text-white">Comerciales</h2>
                {comerciales.length > 0 ? (
                  <table className="table-auto border-collapse w-full my-4 shadow-md text-gray-300">
                    <thead>
                      <tr className="bg-gray-600 text-gray-200">
                        <th className="border px-4 py-2">Nombre</th>
                        <th className="border px-4 py-2">Email</th>
                      </tr>
                    </thead>
                    <tbody>
                      {comerciales.map((c) => (
                        <tr key={c.id} className="text-center bg-gray-800 hover:bg-gray-700">
                          <td className="border px-4 py-2">{c.nombre}</td>
                          <td className="border px-4 py-2">{c.email}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <p className="text-gray-400">No hay comerciales registrados.</p>
                )}
              </div>

              {/* Tarjetas */}
              <div className="mt-6 bg-gray-700 shadow p-4 rounded-md">
                <h2 className="text-xl font-bold text-white">Tarjetas</h2>
                {tarjetas.length > 0 ? (
                  <table className="table-auto border-collapse w-full my-4 shadow-md text-gray-300">
                    <thead>
                      <tr className="bg-gray-600 text-gray-200">
                        <th className="border px-4 py-2">Código</th>
                        <th className="border px-4 py-2">URL Custom</th>
                        <th className="border px-4 py-2">Comercial</th>
                        <th className="border px-4 py-2">Estado</th>
                      </tr>
                    </thead>
                    <tbody>
                      {tarjetas.map((t) => (
                        <tr key={t.codigo} className="text-center bg-gray-800 hover:bg-gray-700">
                          <td className="border px-4 py-2">{t.codigo}</td>
                          <td className="border px-4 py-2">
                            <a href={`https://qr.techversio.com/u/${t.url_custom}`} target="_blank" rel="noopener noreferrer" className="text-blue-400 underline">
                              {t.url_custom}
                            </a>
                          </td>
                          <td className="border px-4 py-2">
                            {t.usuarios ? t.usuarios.nombre : <span className="text-gray-400">Sin asignar</span>}
                          </td>
                          <td className="border px-4 py-2">
                            {t.activa ? <span className="text-green-400">Activa</span> : <span className="text-red-400">Inactiva</span>}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <p className="text-gray-400">No hay tarjetas registradas.</p>
                )}
              </div>

              {/* Botones */}
              <div className="mt-6 flex space-x-4">
                <button className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded" onClick={() => router.push("/add_comercial")}>
                  Añadir Comercial
                </button>
                <button className="bg-yellow-600 hover:bg-yellow-700 text-white px-4 py-2 rounded" onClick={() => router.push("/asignar_tarjetas")}>
                  Asignar Comerciales
                </button>
                <button className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded" onClick={() => router.push("/configuracion_empresa")}>
                  Configuración de Empresa
                </button>
                <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded" onClick={() => router.push("/perfil")}>
                  Ver Perfil
                </button>
              </div>
            </div>
          ) : (
            <p className="text-gray-400 mt-4">No tienes una empresa asignada.</p>
          )}
        </div>
      </div>
    </ProtectedRoute>
  );
}
