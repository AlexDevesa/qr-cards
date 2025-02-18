import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import { useRouter } from "next/router";
import ProtectedRoute from "../components/ProtectedRoute";
import Logout from "../components/Logout";
import DarkContainer from "../components/DarkContainer";

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
      <DarkContainer>
        <div className="p-6">
          {/* Título y Logout */}
          <div className="flex flex-col md:flex-row justify-between items-center mb-6">
            <h1 className="text-3xl font-bold text-white text-center md:text-left">Registrar Nueva Tarjeta</h1>
            <Logout />
          </div>
  
          {/* 🔹 Mensaje de Éxito/Error */}
          {message && (
            <p className={`p-3 rounded text-white ${message.type === "success" ? "bg-green-500" : "bg-red-500"}`}>
              {message.text}
            </p>
          )}
  
          {/* 📌 Selección de Empresa */}
          <label className="text-white">Seleccione una empresa</label>
          <select className="input-field" onChange={(e) => setEmpresaId(e.target.value)} value={empresaId}>
            <option value="">Seleccione una empresa</option>
            {empresas.map((empresa) => (
              <option key={empresa.id} value={empresa.id}>
                {empresa.nombre}
              </option>
            ))}
          </select>
  
          {/* 📌 Código de Tarjeta */}
          <label className="text-white">Código único de la tarjeta</label>
          <input className="input-field" placeholder="Ingrese el código" onChange={(e) => setCodigo(e.target.value)} />
  
          {/* 📌 Botones de acción */}
          <div className="flex flex-col md:flex-row gap-4 mt-6">
            <button className="btn-primary w-full md:w-auto" onClick={handleCrearTarjeta} disabled={isLoading}>
              {isLoading ? "Creando..." : "Crear Tarjeta"}
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
