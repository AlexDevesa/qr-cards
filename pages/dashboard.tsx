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
  const [descargasMap, setDescargasMap] = useState<{ [key: string]: { visitas: number; downloads: number } }>({});


  useEffect(() => {
    async function fetchUsuario() {
      const { data: authData, error: authError } = await supabase.auth.getUser();
      if (authError || !authData.user) {
        setErrorMessage("Debes iniciar sesión.");
        router.push("/login");
        return;
      }

      const { data: usuarioData, error: usuarioError } = await supabase
        .from("usuarios")
        .select("id, rol, empresa_id")
        .eq("email", authData.user.email)
        .single();

      if (usuarioError || !usuarioData) {
        setErrorMessage("No tienes un perfil registrado en la base de datos.");
        await supabase.auth.signOut();
        router.push("/login");
        return;
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

      const { data: tarjetasData } = await supabase
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


  // Función para obtener visitas y descargas
const fetchDescargas = async () => {
  try {
    const { data, error } = await supabase.from("descargas").select("tarjeta_id, tipo");
    if (error) throw error;

    // Generar un objeto con el total de visitas y descargas por tarjeta
    const descargasCount: { [key: string]: { visitas: number; downloads: number } } = {};

    data.forEach((d) => {
      const tarjetaId = d.tarjeta_id;
      if (!descargasCount[tarjetaId]) {
        descargasCount[tarjetaId] = { visitas: 0, downloads: 0 };
      }
      if (d.tipo === "view") descargasCount[tarjetaId].visitas++;
      if (d.tipo === "download") descargasCount[tarjetaId].downloads++;
    });

    setDescargasMap(descargasCount);
  } catch (err) {
    console.error("Error obteniendo visitas y descargas:", err);
  }
};

// Llamamos a la función cuando el componente se monta
useEffect(() => {
  fetchDescargas();
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
        .select("activa, comercial_id") 
        .eq("id", id)
        .single();
  
      if (error || !data) {
        //console.error("Error obteniendo el estado de la tarjeta:", error);
        return;
      }
  
      const nuevoEstado = !data.activa;
      const updateData: { activa: boolean; comercial_id?: null } = { activa: nuevoEstado };
      
      if (!nuevoEstado) {
        updateData.comercial_id = null;
      }
  
      // Actualizar estado en la base de datos
      const { error: updateError } = await supabase
        .from("tarjetas")
        .update( updateData ) 
        .eq("id", id);
  
      if (updateError) {
        //console.error("Error actualizando el estado de la tarjeta:", updateError);
        return;
      }
  
      //console.log(`Tarjeta ${id} actualizada a estado: ${nuevoEstado ? "Activa" : "Inactiva"}`);
  
      // Actualizar lista de tarjetas en la UI
      setTarjetas((prev) =>
        prev.map((t) =>
          t.id === id ? { ...t, activa: nuevoEstado, comercial_id: nuevoEstado ? t.comercial_id : null } : t
        )
      );
  
    } catch (err) {
     // console.error("Error en toggleTarjeta:", err);
    }
  }
  
  
  
  

  return (
    <ProtectedRoute>
      <div className="p-4 md:p-6 min-h-screen bg-gray-900 text-gray-200">
        <div className="bg-gray-800 p-4 md:p-6 shadow-md rounded-lg">
          {/* Título y Logout */}
          <div className="flex flex-col md:flex-row justify-between items-center">
            <h1 className="text-2xl md:text-3xl font-bold text-white text-center md:text-left">
              Panel de Administración
            </h1>
            <Logout />
          </div>
  
          {/* Mensaje de error */}
          {errorMessage && <p className="text-red-400 mt-4 text-center">{errorMessage}</p>}
  
          {empresa ? (
            <div className="mt-6">
              <h2 className="text-xl md:text-2xl font-bold text-white text-center md:text-left">
                Empresa: {empresa.nombre}
              </h2>
  
              {/* Botones de administración */}
              <div className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <button className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded w-full" onClick={() => router.push("/add_comercial")}>
                  Añadir Comercial
                </button>
                <button className="bg-yellow-600 hover:bg-yellow-700 text-white px-4 py-2 rounded w-full" onClick={() => router.push("/asignar_tarjetas")}>
                  Asignar Tarjetas
                </button>
                <button className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded w-full" onClick={() => router.push("/configuracion_empresa")}>
                  Configuración de Empresa
                </button>
                <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded w-full" onClick={() => router.push("/perfil")}>
                  Ver Perfil
                </button>
              </div>
  
              {/* Administradores */}
              <div className="mt-6 bg-gray-700 p-4 rounded-md">
                <h2 className="text-lg font-bold text-white">Administradores</h2>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm md:text-base">
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
                </div>
              </div>
  
              {/* Comerciales */}
              <div className="mt-6 bg-gray-700 p-4 rounded-md">
                <h2 className="text-lg font-bold text-white">Comerciales</h2>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm md:text-base">
                    <thead>
                      <tr className="bg-gray-600 text-gray-200">
                        <th className="border px-4 py-2">Nombre</th>
                        <th className="border px-4 py-2">Email</th>
                        <th className="border px-4 py-2">Estado</th>
                        <th className="border px-4 py-2">Acción</th>
                      </tr>
                    </thead>
                    <tbody>
                      {comerciales.map((c) => (
                        <tr key={c.id} className="text-center bg-gray-800 hover:bg-gray-700">
                          <td className="border px-4 py-2">{c.nombre}</td>
                          <td className="border px-4 py-2">{c.email}</td>
                          <td className="border px-4 py-2">
                            <span className={`px-2 py-1 rounded text-white ${c.activo ? "bg-green-500" : "bg-red-500"}`}>
                              {c.activo ? "Activo" : "Inactivo"}
                            </span>
                          </td>
                          <td className="border px-4 py-2">
                            <button
                              onClick={() => toggleComercial(c.id)}
                              className={`px-3 py-1 rounded text-white ${c.activo ? "bg-red-500 hover:bg-red-700" : "bg-green-500 hover:bg-green-700"}`}
                            >
                              {c.activo ? "Desactivar" : "Activar"}
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
  
              {/* Tarjetas */}
              <div className="mt-6 bg-gray-700 p-4 rounded-md">
                <h2 className="text-lg font-bold text-white">Tarjetas</h2>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm md:text-base">
                    <thead>
                      <tr className="bg-gray-600 text-gray-200">
                        <th className="border px-4 py-2">Código</th>
                        <th className="border px-4 py-2">URL</th>
                        <th className="border px-4 py-2">Comercial</th>
                        <th className="border px-4 py-2">Estado</th>
                        <th className="border px-4 py-2">Visitas</th>
                        <th className="border px-4 py-2">Descargas</th>
                        <th className="border px-4 py-2">Acción</th>
                      </tr>
                    </thead>
                    <tbody>
                    {tarjetas.map((t) => {
                      const visitas = descargasMap[t.id]?.visitas || 0;
                      const downloads = descargasMap[t.id]?.downloads || 0;

                      return (
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
                            <span className={`px-2 py-1 rounded text-white ${t.activa ? "bg-green-500" : "bg-red-500"}`}>
                              {t.activa ? "Activa" : "Inactiva"}
                            </span>
                          </td>
                          <td className="border px-4 py-2">{visitas}</td>
                          <td className="border px-4 py-2">{downloads}</td>
                          <td className="border px-4 py-2">
                            <button
                              onClick={() => toggleTarjeta(t.id)}
                              className={`px-3 py-1 rounded text-white ${t.activa ? "bg-red-500 hover:bg-red-700" : "bg-green-500 hover:bg-green-700"}`}
                            >
                              {t.activa ? "Desactivar" : "Activar"}
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                  </table>
                </div>
              </div>
  
            </div>
          ) : (
            <p className="text-gray-400 mt-4 text-center">No tienes una empresa asignada.</p>
          )}
        </div>
      </div>
    </ProtectedRoute>
  );
  
}
