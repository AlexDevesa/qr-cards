import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { useRouter } from "next/router";
import ProtectedRoute from "../components/ProtectedRoute";
import Logout from "../components/Logout";
import { obtenerURLSubida } from "../lib/upload";
import DarkContainer from "../components/DarkContainer"; 


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
        setLogoUrl(empresaData.logo_url ? `https://adevesa-qr.s3.amazonaws.com/${empresaData.logo_url}` : null);
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
        <div className="p-6">
          <Logout />
          <h1 className="text-2xl font-bold mb-6">Configuración de Empresa</h1>
  
          {message && (
            <p className={`mt-4 p-2 rounded ${message.type === "success" ? "bg-green-500 text-white" : "bg-red-500 text-white"}`}>
              {message.text}
            </p>
          )}
  
          {/* 📌 Campos de empresa */}
          <div className="grid grid-cols-1 gap-4">
            <label>Nombre de la Empresa</label>
            <input className="input-field" value={nombre} onChange={(e) => setNombre(e.target.value)} />
  
            <label>Dirección</label>
            <input className="input-field" value={direccion} onChange={(e) => setDireccion(e.target.value)} />
  
            <label>Población</label>
            <input className="input-field" value={poblacion} onChange={(e) => setPoblacion(e.target.value)} />
  
            <label>Código Postal</label>
            <input className="input-field" value={codigoPostal} onChange={(e) => setCodigoPostal(e.target.value)} />
  
            <label>CIF</label>
            <input className="input-field" value={cif} onChange={(e) => setCIF(e.target.value)} />
  
            <label>Teléfono</label>
            <input className="input-field" value={telefono} onChange={(e) => setTelefono(e.target.value)} />
  
            <label>Web</label>
            <input className="input-field" value={web} onChange={(e) => setWeb(e.target.value)} />
          </div>
  
          {/* 📌 Logo de la empresa */}
          <h2 className="text-lg font-bold mt-6">Logo de la Empresa</h2>
          {logoUrl && (
            <img src={logoUrl} alt="Logo de la empresa" className="w-32 h-32 object-cover border border-gray-600 rounded my-4" />
          )}
          <input type="file" accept="image/*" onChange={(e) => setLogoFile(e.target.files?.[0] || null)} />
          <button className="btn-secondary mt-2" onClick={handleUploadLogo}>
            Subir Logo
          </button>
  
          {/* 📌 Botones de acción */}
          <div className="flex space-x-4 mt-6">
            <button className="btn-primary" onClick={handleSave}>
              Guardar Cambios
            </button>
            <button className="btn-back" onClick={() => router.push("/dashboard")}>
              Volver
            </button>
          </div>
        </div>
      </DarkContainer>
    </ProtectedRoute>
  );
  
}
