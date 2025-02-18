import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import { useRouter } from "next/router";
import ProtectedRoute from "../components/ProtectedRoute";
import Logout from "../components/Logout";

export default function CrearTarjeta() {
  const router = useRouter();
  const [empresas, setEmpresas] = useState<any[]>([]);
  const [empresaId, setEmpresaId] = useState("");
  const [codigo, setCodigo] = useState("");
  const [message, setMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    async function fetchEmpresas() {
      const { data, error } = await supabase.from("empresas").select("id, nombre");
      if (error) {
        setMessage({ text: "Error al cargar empresas.", type: "error" });
      } else {
        setEmpresas(data);
      }
    }
    fetchEmpresas();
  }, []);

  async function handleCrearTarjeta() {
    setMessage(null);
    setIsLoading(true);

    if (!empresaId || !codigo) {
      setMessage({ text: "Todos los campos son obligatorios.", type: "error" });
      setIsLoading(false);
      return;
    }

    try {
      // 🔹 Verificar si el código ya existe
      const { data: existingTarjeta, error: checkError } = await supabase
        .from("tarjetas")
        .select("id")
        .eq("codigo", codigo)
        .single();

      if (existingTarjeta) throw new Error("❌ Ya existe una tarjeta con ese código.");
      if (checkError && checkError.code !== "PGRST116") throw checkError; // Ignorar si no existe

      // 🔹 Insertar la nueva tarjeta
      const { data: tarjetaData, error: tarjetaError } = await supabase
        .from("tarjetas")
        .insert([{ empresa_id: empresaId, codigo }])
        .select("id")
        .single();

      if (tarjetaError) throw new Error(`Error al crear la tarjeta: ${tarjetaError.message}`);

      console.log("✅ Tarjeta creada con ID:", tarjetaData.id);
      setMessage({ text: "✅ Tarjeta creada correctamente.", type: "success" });

      // Redirigir después de 3 segundos
      setTimeout(() => {
        router.push("/admin");
      }, 3000);
    } catch (error: any) {
      console.error(error.message);
      setMessage({ text: `❌ ${error.message}`, type: "error" });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <ProtectedRoute>
      <div className="p-6">
        <Logout />
        <h1 className="text-2xl font-bold">Registrar Nueva Tarjeta</h1>

        {/* 🔹 Mensaje de Éxito/Error */}
        {message && (
          <p className={`mt-4 p-2 rounded ${message.type === "success" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
            {message.text}
          </p>
        )}

        {/* 🔹 Selección de Empresa */}
        <select className="border p-2 w-full my-2" onChange={(e) => setEmpresaId(e.target.value)} value={empresaId}>
          <option value="">Seleccione una empresa</option>
          {empresas.map((empresa) => (
            <option key={empresa.id} value={empresa.id}>
              {empresa.nombre}
            </option>
          ))}
        </select>

        {/* 🔹 Código de Tarjeta */}
        <input className="border p-2 w-full my-2" placeholder="Código único de la tarjeta" onChange={(e) => setCodigo(e.target.value)} />

        <div className="flex space-x-4">
          <button className="bg-blue-500 text-white px-4 py-2 rounded" onClick={handleCrearTarjeta} disabled={isLoading}>
            {isLoading ? "Creando..." : "Crear Tarjeta"}
          </button>
          <button className="bg-gray-500 text-white px-4 py-2 rounded" onClick={() => router.push("/admin")}>
            Atrás
          </button>
        </div>
      </div>
    </ProtectedRoute>
  );
}
