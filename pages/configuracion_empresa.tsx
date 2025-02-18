import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { useRouter } from "next/router";
import ProtectedRoute from "../components/ProtectedRoute";
import Logout from "../components/Logout";
import { obtenerURLSubida } from "../lib/upload";
import DarkContainer from "../components/DarkContainer"; 
import { obtenerURLsLecturaMultiples } from "../lib/getUrls";

export default function ConfiguracionEmpresa() {
  const router = useRouter();
  const [empresa, setEmpresa] = useState<any>(null);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [nombre, setNombre] = useState("");
  const [direccion, setDireccion] = useState("");
  const [poblacion, setPoblacion] = useState("");
  const [codigoPostal, setCodigoPostal] = useState("");
  const [cif, setCIF] = useState("");
  const [telefono, setTelefono] = useState("");
  const [web, setWeb] = useState("");
  const [colorPrimario, setColorPrimario] = useState("");
  const [colorSecundario, setColorSecundario] = useState("");
  const [message, setMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);

  useEffect(() => {
    async function fetchEmpresa() {
      const { data: authData, error: authError } = await supabase.auth.getUser();
      if (authError || !authData.user) return router.push("/login");

      const { data: usuarioData, error: usuarioError } = await supabase
        .from("usuarios")
        .select("empresa_id")
        .eq("email", authData.user.email)
        .single();

      if (usuarioError || !usuarioData?.empresa_id) {
        setMessage({ text: "No se encontró la empresa.", type: "error" });
        return;
      }

      const empresaId = usuarioData.empresa_id;

      const { data: empresaData, error: empresaError } = await supabase
        .from("empresas")
        .select("*")
        .eq("id", empresaId)
        .single();

      if (!empresaError && empresaData) {
        setEmpresa(empresaData);
        setNombre(empresaData.nombre);
        setDireccion(empresaData.direccion || "");
        setPoblacion(empresaData.poblacion || "");
        setCodigoPostal(empresaData.codigo_postal || "");
        setCIF(empresaData.cif || "");
        setTelefono(empresaData.telefono || "");
        setWeb(empresaData.web || "");
        setColorPrimario(empresaData.color_primario || "#000000");
        setColorSecundario(empresaData.color_secundario || "#FFFFFF");
        if (empresaData.logo_url) {
          try {
            const urlsFirmadas = await obtenerURLsLecturaMultiples([empresaData.logo_url]);
            if (urlsFirmadas.length > 0) {
              setLogoUrl(urlsFirmadas[0].get_url);
            } else {
              console.error("No se obtuvo URL firmada para el logo.");
            }
          } catch (err) {
            console.error("Error al obtener URL firmada:", err);
          }
        }
      } else {
        setMessage({ text: "Error al cargar la empresa.", type: "error" });
      }
    }
    fetchEmpresa();
  }, []);

  async function handleUploadLogo() {
    if (!logoFile || !empresa) {
      setMessage({ text: "Selecciona un logo antes de subir.", type: "error" });
      return;
    }

    try {
      setMessage({ text: "Subiendo logo...", type: "success" });

      const { upload_url, file_key } = await obtenerURLSubida(logoFile.name, logoFile.type, "logos");

      const uploadResponse = await fetch(upload_url, {
        method: "PUT",
        body: logoFile,
        headers: { "Content-Type": logoFile.type },
      });

      if (!uploadResponse.ok) throw new Error("Error subiendo el logo a S3.");

      const { error } = await supabase
        .from("empresas")
        .update({ logo_url: file_key })
        .eq("id", empresa.id);

      if (error) throw new Error("Error al guardar la URL del logo en la base de datos.");

      setLogoUrl(`https://adevesa-qr.s3.amazonaws.com/${file_key}`);
      setMessage({ text: "✅ Logo subido correctamente.", type: "success" });
    } catch (error) {
      setMessage({ text: error instanceof Error ? error.message : "Error desconocido", type: "error" });
    }
  }
  

  async function handleSave() {
    if (!empresa) return;

    const { error } = await supabase
      .from("empresas")
      .update({
        nombre,
        direccion,
        poblacion,
        codigo_postal: codigoPostal,
        cif,
        telefono,
        web,
        color_primario: colorPrimario,
        color_secundario: colorSecundario,
      })
      .eq("id", empresa.id);

    if (error) {
      setMessage({ text: "Error al actualizar empresa.", type: "error" });
    } else {
      setMessage({ text: "✅ Configuración guardada.", type: "success" });
    }
  }

  return (
    <ProtectedRoute>
      <DarkContainer>
        {/* Título y Logout */}
        <div className="flex flex-col md:flex-row justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-white text-center md:text-left">Configuración de Empresa</h1>
          <Logout />
        </div>
  
        {/* Mensaje de éxito/error */}
        {message && (
          <p className={`p-3 rounded-md text-white text-center ${message.type === "success" ? "bg-green-500" : "bg-red-500"}`}>
            {message.text}
          </p>
        )}
  
        {/* 📌 Campos de empresa */}
        <div className="bg-gray-700 shadow p-6 rounded-md w-full max-w-lg mx-auto">
          <h2 className="text-xl font-bold text-white mb-4 text-center">Datos de la Empresa</h2>
          <div className="grid grid-cols-1 gap-4">
            <label className="text-white">Nombre de la Empresa</label>
            <input className="input-field" value={nombre} onChange={(e) => setNombre(e.target.value)} />
  
            <label className="text-white">Dirección</label>
            <input className="input-field" value={direccion} onChange={(e) => setDireccion(e.target.value)} />
  
            <label className="text-white">Población</label>
            <input className="input-field" value={poblacion} onChange={(e) => setPoblacion(e.target.value)} />
  
            <label className="text-white">Código Postal</label>
            <input className="input-field" value={codigoPostal} onChange={(e) => setCodigoPostal(e.target.value)} />
  
            <label className="text-white">CIF</label>
            <input className="input-field" value={cif} onChange={(e) => setCIF(e.target.value)} />
  
            <label className="text-white">Teléfono</label>
            <input className="input-field" value={telefono} onChange={(e) => setTelefono(e.target.value)} />
  
            <label className="text-white">Web</label>
            <input className="input-field" value={web} onChange={(e) => setWeb(e.target.value)} />
  
            {/* Selector de colores */}
            <div className="flex flex-col md:flex-row justify-between gap-4">
              <div className="w-full">
                <label className="text-white">Color Primario</label>
                <input
                  type="color"
                  value={colorPrimario || "#000000"}
                  onChange={(e) => setColorPrimario(e.target.value)}
                  className="w-full h-10 rounded-md border border-gray-600 bg-gray-900"
                />
                <p className="text-gray-400 text-center mt-1">{colorPrimario}</p>
              </div>
  
              <div className="w-full">
                <label className="text-white">Color Secundario</label>
                <input
                  type="color"
                  value={colorSecundario || "#ffffff"}
                  onChange={(e) => setColorSecundario(e.target.value)}
                  className="w-full h-10 rounded-md border border-gray-600 bg-gray-900"
                />
                <p className="text-gray-400 text-center mt-1">{colorSecundario}</p>
              </div>
            </div>
          </div>
        </div>
  
        {/* 📌 Logo de la empresa */}
        <div className="bg-gray-700 shadow p-6 rounded-md w-full max-w-lg mx-auto mt-6">
          <h2 className="text-xl font-bold text-white text-center">Logo de la Empresa</h2>
          {logoUrl && (
            <div className="flex justify-center mt-4">
              <img src={logoUrl} alt="Logo de la empresa" className="w-32 h-32 object-cover border border-gray-600 rounded" />
            </div>
          )}
          <input
            type="file"
            accept="image/*"
            className="mt-4 text-white"
            onChange={(e) => setLogoFile(e.target.files?.[0] || null)}
          />
          <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md mt-4 w-full" onClick={handleUploadLogo}>
            Subir Logo
          </button>
        </div>
  
        {/* 📌 Botones de acción */}
        <div className="flex flex-col md:flex-row justify-center gap-4 mt-6">
          <button className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md w-full max-w-xs" onClick={handleSave}>
            Guardar Cambios
          </button>
          <button className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-md w-full max-w-xs" onClick={() => router.push("/dashboard")}>
            Volver
          </button>
        </div>
      </DarkContainer>
    </ProtectedRoute>
  );
  
  
}
