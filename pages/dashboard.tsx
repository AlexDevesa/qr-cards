import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { useRouter } from "next/router";
import ProtectedRoute from "../components/ProtectedRoute";
import Logout from "../components/Logout";

export default function Dashboard() {
  const router = useRouter();
  const [usuario, setUsuario] = useState<any>(null);
  const [empresa, setEmpresa] = useState<any>(null);
  const [admins, setAdmins] = useState<any[]>([]);
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
        .select("id, nombre, email, activo")
        .eq("empresa_id", empresaId)
        .eq("rol", "comercial");

      setComerciales(comercialesData || []);

      const { data: tarjetasData, error: tarjetasError } = await supabase
        .from("tarjetas")
        .select("id, codigo, url_id, comercial_id, activa, usuarios (nombre)")
        .eq("empresa_id", empresaId);

      setTarjetas(tarjetasData || []);

      
      const { data: adminsData } = await supabase
      .from("usuarios")
      .select("id, nombre, email")
      .eq("empresa_id", empresaId)
      .eq("rol", "admin");
      setAdmins(adminsData || []);
    }

  
    fetchUsuario();
  }, []);

  async function toggleComercial(id: string) {
    try {
      console.log(`Toggling comercial ID: ${id}`);
  
      // Obtener estado actual del comercial
      const { data, error } = await supabase
        .from("usuarios")
        .select("activo") 
        .eq("id", id)
        .single();
  
      if (error) {
        console.error("Error obteniendo el estado del comercial:", error);
        return;
      }
  
      if (!data) {
        console.warn("El comercial no existe en la base de datos.");
        return;
      }
  
      const nuevoEstado = !data.activo;
  
      // Actualizar estado en la base de datos
      const { error: updateError } = await supabase
        .from("usuarios")
        .update({ activo: nuevoEstado }) 
        .eq("id", id);
  
      if (updateError) {
        console.error("Error actualizando el estado del comercial:", updateError);
        return;
      }
  
      console.log(`Comercial ${id} actualizado a estado: ${nuevoEstado ? "Activo" : "Inactivo"}`);
  
      // Si el comercial se desactiva, desvincular sus tarjetas
      if (!nuevoEstado) {
        const { error: tarjetasError } = await supabase
          .from("tarjetas")
          .update({ comercial_id: null })
          .eq("comercial_id", id);
  
        if (tarjetasError) {
          console.error("Error desvinculando las tarjetas del comercial:", tarjetasError);
        } else {
          console.log(`Tarjetas desvinculadas del comercial ${id}`);
        }
      }
  
      // Actualizar la lista de comerciales en la UI
      setComerciales((prev) =>
        prev.map((u) => (u.id === id ? { ...u, activo: nuevoEstado } : u))
      );
  
    } catch (err) {
      console.error("Error en toggleComercial:", err);
    }
  }
  
  async function toggleTarjeta(id: string) {
    try {
      //console.log(`Toggling tarjeta ID: ${id}`);
  
      // Obtener estado actual de la tarjeta
      const { data, error } = await supabase
        .from("tarjetas")
        .select("activa") 
        .eq("id", id)
        .single();
  
      if (error || !data) {
        //console.error("Error obteniendo el estado de la tarjeta:", error);
        return;
      }
  
      const nuevoEstado = !data.activa;
  
      // Actualizar estado en la base de datos
      const { error: updateError } = await supabase
        .from("tarjetas")
        .update({ activa: nuevoEstado }) 
        .eq("id", id);
  
      if (updateError) {
        //console.error("Error actualizando el estado de la tarjeta:", updateError);
        return;
      }
  
      //console.log(`Tarjeta ${id} actualizada a estado: ${nuevoEstado ? "Activa" : "Inactiva"}`);
  
      // Actualizar lista de tarjetas en la UI
      setTarjetas((prev) =>
        prev.map((t) => (t.id === id ? { ...t, activa: nuevoEstado } : t))
      );
  
    } catch (err) {
     // console.error("Error en toggleTarjeta:", err);
    }
  }
  
  
  
  

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

              {/* Administradores */}
              <div className="mt-6 bg-gray-700 shadow p-4 rounded-md">
                <h2 className="text-xl font-bold text-white">Administradores</h2>
                {admins.length > 0 ? (
                  <table className="table-auto border-collapse w-full my-4 shadow-md text-gray-300">
                    <thead>
                      <tr className="bg-gray-600 text-gray-200">
                        <th className="border px-4 py-2">Nombre</th>
                        <th className="border px-4 py-2">Email</th>
                      </tr>
                    </thead>
                    <tbody>
                      {admins.map((a) => (
                        <tr key={a.id} className="text-center bg-gray-800 hover:bg-gray-700">
                          <td className="border px-4 py-2">{a.nombre}</td>
                          <td className="border px-4 py-2">{a.email}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <p className="text-gray-400">No hay administradores registrados.</p>
                )}
              </div>

              {/* Comerciales */}
              <div className="mt-6 bg-gray-700 shadow p-4 rounded-md">
                <h2 className="text-xl font-bold text-white">Comerciales</h2>
                {comerciales.length > 0 ? (
                  <table className="table-auto border-collapse w-full my-4 shadow-md text-gray-300">
                    <thead>
                      <tr className="bg-gray-600 text-gray-200">
                        <th className="border px-4 py-2">Nombre</th>
                        <th className="border px-4 py-2">Email</th>
                        <th className="border px-4 py-2">Status</th>  {/* Nueva columna de estado */}
                        <th className="border px-4 py-2">Acción</th>  {/* Nueva columna de acción */}
                      </tr>
                    </thead>
                    <tbody>
                      {comerciales.map((c) => (
                        <tr key={c.id} className="text-center bg-gray-800 hover:bg-gray-700">
                          <td className="border px-4 py-2">{c.nombre}</td>
                          <td className="border px-4 py-2">{c.email}</td>
                          <td className="border px-4 py-2">
                            <span
                              className={`inline-block px-3 py-1 rounded-full text-white ${
                                c.activo ? "bg-green-500" : "bg-red-500"
                              }`}
                            >
                              {c.activo ? "Activo" : "Inactivo"}
                            </span>
                          </td>
                          <td className="border px-4 py-2">
                            <button
                              onClick={() => toggleComercial(c.id)}
                              className={`px-3 py-1 rounded text-white ${
                                c.activo ? "bg-red-500 hover:bg-red-700" : "bg-green-500 hover:bg-green-700"
                              }`}
                            >
                              {c.activo ? "Desactivar" : "Activar"}
                            </button>
                          </td>
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
                {tarjetas && tarjetas.length > 0 ? (
                  <table className="table-auto border-collapse w-full my-4 shadow-md text-gray-300">
                    <thead>
                      <tr className="bg-gray-600 text-gray-200">
                        <th className="border px-4 py-2">Código</th>
                        <th className="border px-4 py-2">URL</th>
                        <th className="border px-4 py-2">Comercial</th>
                        <th className="border px-4 py-2">Estado</th>
                        <th className="border px-4 py-2">Acción</th>
                      </tr>
                    </thead>
                    <tbody>
                    {tarjetas.map((t) => (
                      <tr key={t.id} className="text-center bg-gray-800 hover:bg-gray-700">
                        <td className="border px-4 py-2">{t.codigo}</td>
                        <td className="border px-4 py-2">
                          <a
                            href={`https://qr.techversio.com/u/${t.url_id}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-400 underline"
                          >
                            Link
                          </a>
                        </td>
                        <td className="border px-4 py-2">{t.usuarios?.nombre || "No asignado"}</td>
                        <td className="border px-4 py-2">
                          <span className={`inline-block px-3 py-1 rounded-full text-white ${t.activa ? "bg-green-500" : "bg-red-500"}`}>
                            {t.activa ? "Activa" : "Inactiva"}
                          </span>
                        </td>
                        <td className="border px-4 py-2">
                          <button
                            onClick={() => toggleTarjeta(t.id)}
                            className={`px-3 py-1 rounded text-white ${t.activa ? "bg-red-500 hover:bg-red-700" : "bg-green-500 hover:bg-green-700"}`}
                          >
                            {t.activa ? "Desactivar" : "Activar"}
                          </button>
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
                  Asignar Tarjetas
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
