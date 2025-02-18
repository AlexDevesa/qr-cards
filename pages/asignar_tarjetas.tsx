import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { useRouter } from "next/router";
import ProtectedRoute from "../components/ProtectedRoute";
import Logout from "../components/Logout";
import DarkContainer from "../components/DarkContainer"; // Importamos el contenedor oscuro

export default function AsignarTarjetas() {
  const router = useRouter();
  const [tarjetasSinAsignar, setTarjetasSinAsignar] = useState<any[]>([]);
  const [tarjetasAsignadas, setTarjetasAsignadas] = useState<any[]>([]);
  const [usuarios, setUsuarios] = useState<any[]>([]);
  const [selectedTarjetaAsignar, setSelectedTarjetaAsignar] = useState("");
  const [selectedUsuario, setSelectedUsuario] = useState("");
  const [selectedTarjetaDesasignar, setSelectedTarjetaDesasignar] = useState("");
  const [message, setMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);

  useEffect(() => {
    async function fetchData() {
      const { data: authData, error: authError } = await supabase.auth.getUser();
      if (authError || !authData.user) return router.push("/login");

      const { data: usuarioData, error: usuarioError } = await supabase
        .from("usuarios")
        .select("empresa_id")
        .eq("email", authData.user.email)
        .single();

      if (usuarioError || !usuarioData?.empresa_id) {
        setMessage({ text: "No tienes una empresa asignada.", type: "error" });
        return;
      }

      const empresaId = usuarioData.empresa_id;

      // Obtener tarjetas sin asignar
      const { data: tarjetasSinAsignarData } = await supabase
        .from("tarjetas")
        .select("id, codigo, url_custom")
        .eq("empresa_id", empresaId)
        .is("comercial_id", null);

      setTarjetasSinAsignar(tarjetasSinAsignarData || []);

      // Obtener tarjetas asignadas con datos del usuario
      const { data: tarjetasAsignadasData } = await supabase
        .from("tarjetas")
        .select("id, codigo, url_custom, comercial_id, usuarios(nombre, rol)")
        .eq("empresa_id", empresaId)
        .not("comercial_id", "is", null);

      setTarjetasAsignadas(tarjetasAsignadasData || []);

      // Obtener usuarios (admins y comerciales)
      const { data: usuariosData } = await supabase
        .from("usuarios")
        .select("id, nombre, email, rol")
        .eq("empresa_id", empresaId)
        .eq("activo", true);

      setUsuarios(usuariosData || []);
    }

    fetchData();
  }, []);

  async function handleAsignarTarjeta() {
    if (!selectedTarjetaAsignar || !selectedUsuario) {
      setMessage({ text: "Debe seleccionar una tarjeta y un usuario.", type: "error" });
      return;
    }

    const { error } = await supabase
      .from("tarjetas")
      .update({ comercial_id: selectedUsuario })
      .eq("id", selectedTarjetaAsignar);

    if (error) {
      setMessage({ text: "Error al asignar la tarjeta.", type: "error" });
    } else {
      setMessage({ text: "✅ Tarjeta asignada correctamente.", type: "success" });

      setTarjetasSinAsignar((prev) => prev.filter((t) => t.id !== selectedTarjetaAsignar));
      setTarjetasAsignadas((prev) => [...prev, { id: selectedTarjetaAsignar, comercial_id: selectedUsuario }]);
      setSelectedTarjetaAsignar("");
    }
  }

  async function handleDesasignarTarjeta() {
    if (!selectedTarjetaDesasignar) {
      setMessage({ text: "Debe seleccionar una tarjeta a desasignar.", type: "error" });
      return;
    }

    const { error } = await supabase
      .from("tarjetas")
      .update({ comercial_id: null })
      .eq("id", selectedTarjetaDesasignar);

    if (error) {
      setMessage({ text: "Error al desasignar la tarjeta.", type: "error" });
    } else {
      setMessage({ text: "✅ Tarjeta desasignada correctamente.", type: "success" });

      setTarjetasAsignadas((prev) => prev.filter((t) => t.id !== selectedTarjetaDesasignar));
      setTarjetasSinAsignar((prev) => [...prev, { id: selectedTarjetaDesasignar }]);
      setSelectedTarjetaDesasignar("");
    }
  }

  return (
    <ProtectedRoute>
      <DarkContainer>
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold text-white">Asignar y Desasignar Tarjetas</h1>
          <Logout />
        </div>

        {message && (
          <p className={`mt-4 p-2 rounded ${message.type === "success" ? "bg-green-500 text-white" : "bg-red-500 text-white"}`}>
            {message.text}
          </p>
        )}

        {/* ASIGNAR TARJETA */}
        <div className="mt-6 bg-gray-700 shadow p-4 rounded-md">
          <h2 className="text-xl font-bold text-white">Asignar Tarjeta a Usuario</h2>
          <select className="border bg-gray-900 text-gray-200 p-2 w-full my-2" value={selectedTarjetaAsignar} onChange={(e) => setSelectedTarjetaAsignar(e.target.value)}>
            <option value="">-- Seleccionar Tarjeta --</option>
            {tarjetasSinAsignar.map((t) => (
              <option key={t.id} value={t.id}>
                {t.codigo} - {t.url_custom}
              </option>
            ))}
          </select>

          <select className="border bg-gray-900 text-gray-200 p-2 w-full my-2" value={selectedUsuario} onChange={(e) => setSelectedUsuario(e.target.value)}>
            <option value="">-- Seleccionar Usuario --</option>
            {usuarios.map((u) => (
              <option key={u.id} value={u.id}>
                {u.nombre} ({u.email}) - {u.rol.toUpperCase()}
              </option>
            ))}
          </select>

          <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded mt-2" onClick={handleAsignarTarjeta}>
            Asignar Tarjeta
          </button>
        </div>

        {/* DESASIGNAR TARJETA */}
        <div className="mt-6 bg-gray-700 shadow p-4 rounded-md">
          <h2 className="text-xl font-bold text-white">Desasignar Tarjeta</h2>
          <select className="border bg-gray-900 text-gray-200 p-2 w-full my-2" value={selectedTarjetaDesasignar} onChange={(e) => setSelectedTarjetaDesasignar(e.target.value)}>
            <option value="">-- Seleccionar Tarjeta --</option>
            {tarjetasAsignadas.map((t) => (
              <option key={t.id} value={t.id}>
                {t.codigo} - {t.url_custom} ({t.usuarios ? `${t.usuarios.nombre} - ${t.usuarios.rol.toUpperCase()}` : "Desconocido"})
              </option>
            ))}
          </select>

          <button className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded mt-2" onClick={handleDesasignarTarjeta}>
            Desasignar Tarjeta
          </button>
        </div>

        <button className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded mt-4" onClick={() => router.push("/dashboard")}>
          Atrás
        </button>
      </DarkContainer>
    </ProtectedRoute>
  );
}
