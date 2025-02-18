import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { useRouter } from "next/router";
import ProtectedRoute from "../components/ProtectedRoute";
import Logout from "../components/Logout";
import { obtenerURLSubida } from "../lib/upload";
import { obtenerURLsLecturaMultiples } from "../lib/getUrls"; // <-- Importamos la API de lectura múltiple
import { resizeImage } from "../lib/resizeImage";
import { FaDownload, FaTrash } from "react-icons/fa";
import DarkContainer from "../components/DarkContainer";


export default function Perfil() {
  const router = useRouter();
  const [perfil, setPerfil] = useState<any>(null);

  // Campos básicos
  const [nombre, setNombre] = useState("");
  const [puesto, setPuesto] = useState("");
  const [email, setEmail] = useState("");
  const [telefono, setTelefono] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [linkedin, setLinkedin] = useState("");
  const [instagram, setInstagram] = useState("");
  const [youtube, setYoutube] = useState("");
  const [twitter, setTwitter] = useState("");
  const [facebook, setFacebook] = useState("");
  const [website, setWebsite] = useState("");
  const [videoFiles, setVideoFiles] = useState<File[]>([]); // Para seleccionar múltiples videos
  const [videoUrls, setVideoUrls] = useState<string[]>([]); // Para guardar URLs firmadas
  const [presignedMap, setPresignedMap] = useState<{ [key: string]: string }>({}); // Map de URLs firmadas


  // Foto de perfil
  const [fotoFile, setFotoFile] = useState<File | null>(null);
  // URL firmada para mostrar la foto de perfil
  const [fotoFirmada, setFotoFirmada] = useState<string | null>(null);

  // Galería
  const [galeriaFiles, setGaleriaFiles] = useState<File[]>([]);
  const [galeria, setGaleria] = useState<string[]>([]);
  // Almacena las URLs firmadas de la galería
  const [galeriaFirmada, setGaleriaFirmada] = useState<Array<{ file_key: string; get_url: string }>>([]);

  // Video
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [videoFirmada, setVideoFirmada] = useState<string | null>(null);

  // PDFs
  const [pdfFiles, setPdfFiles] = useState<File[]>([]);
  const [pdfs, setPdfs] = useState<string[]>([]);
  const [pdfsFirmadas, setPdfsFirmadas] = useState<Array<{ file_key: string; get_url: string }>>([]);

  // Mensajes (estado)
  const [message, setMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);

  // Al montar: cargar perfil y campos
  useEffect(() => {
    async function fetchPerfil() {
      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userError || !userData.user) {
        router.push("/login");
        return;
      }

      const { data: perfilData, error: perfilError } = await supabase
        .from("perfiles")
        .select("*")
        .eq("comercial_id", userData.user.id)
        .single();

      if (perfilError || !perfilData) {
        setMessage({ text: "No tienes un perfil registrado.", type: "error" });
        return;
      }

      // Cargar campos en estado
      setPerfil(perfilData);
      setNombre(perfilData.nombre);
      setPuesto(perfilData.puesto);
      setEmail(perfilData.email);
      setTelefono(perfilData.telefono);
      setWhatsapp(perfilData.whatsapp);
      setLinkedin(perfilData.linkedin);
      setInstagram(perfilData.instagram || "");
      setYoutube(perfilData.youtube || "");
      setTwitter(perfilData.twitter || "");
      setFacebook(perfilData.facebook || "");
      setWebsite(perfilData.website || "");
      setGaleria(perfilData.galeria || []);
      setVideoUrl(perfilData.video_url || null);
      setPdfs(perfilData.pdfs || []);
    }

    fetchPerfil();
  }, [router]);

  // Al tener el perfil, podemos pedir las URLs firmadas
  // Efecto 1: Foto de perfil
  useEffect(() => {
    async function fetchFotoFirmada() {
      if (!perfil?.foto_url) {
        setFotoFirmada(null);
        return;
      }
      // Pedimos la URL firmada para la foto
      const result = await obtenerURLsLecturaMultiples([perfil.foto_url]);
      setFotoFirmada(result[0].get_url); // Usamos la primera
    }
    if (perfil?.foto_url) fetchFotoFirmada();
  }, [perfil?.foto_url]);

  // Efecto 2: Galería
  useEffect(() => {
    async function fetchGaleriaFirmada() {
      if (galeria.length === 0) {
        setGaleriaFirmada([]);
        return;
      }
      const result = await obtenerURLsLecturaMultiples(galeria);
      setGaleriaFirmada(result);
    }
    fetchGaleriaFirmada();
  }, [galeria]);

  // Efecto 3: Video
  useEffect(() => {
    async function fetchVideoFirmado() {
      if (!perfil?.video_url || !Array.isArray(perfil.video_url) || perfil.video_url.length === 0) {
        setVideoFirmada(null);
        return;
      }
  
      try {
        // Pedimos las URLs firmadas de todos los videos
        const result = await obtenerURLsLecturaMultiples(perfil.video_url);
  
        if (Array.isArray(result) && result.length > 0) {
          // Guardamos la primera URL de video (puedes cambiar la lógica si necesitas más)
          setVideoFirmada(result[0].get_url);
        } else {
          console.error("No se obtuvo una URL firmada para los videos.");
          setVideoFirmada(null);
        }
      } catch (error) {
        console.error("Error al obtener la URL firmada del video:", error);
        setVideoFirmada(null);
      }
    }
  
    fetchVideoFirmado();
  }, [perfil?.video_url]);
  
  

  // Efecto 4: PDFs
  useEffect(() => {
    async function fetchPDFsFirmados() {
      if (pdfs.length === 0) {
        setPdfsFirmadas([]);
        return;
      }
      const result = await obtenerURLsLecturaMultiples(pdfs);
      setPdfsFirmadas(result);
    }
    fetchPDFsFirmados();
  }, [pdfs]);


  function handleDownloadMedia(url: string, fileKey: string) {
    const a = document.createElement("a");
    a.href = url;
    a.download = fileKey.split("/").pop() || "video";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }
  
  // Subir un archivo -> PUT presigned
  async function handleUpload(file: File, folder: string, field: string) {
    try {
      setMessage(null);
      
      let finalFile = file;
  
      // 🔹 Solo comprimimos si es la foto de perfil
      if (field === "foto_url") {
        finalFile = await resizeImage(file, 0.5);
      }
  
      //console.log(`⬆️ Subiendo archivo: ${finalFile.name}, Tamaño: ${(finalFile.size / 1024).toFixed(2)} KB`);
  
      // 🔹 Obtener la URL firmada para subir el archivo
      const { upload_url, file_key } = await obtenerURLSubida(finalFile.name, finalFile.type, folder);
  
      // 🔹 Subir el archivo a S3
      const uploadResponse = await fetch(upload_url, {
        method: "PUT",
        body: finalFile,
        headers: { "Content-Type": finalFile.type },
      });
  
      if (!uploadResponse.ok) throw new Error("Error subiendo archivo a S3");
  
      // 🔹 Guardar la ruta en la base de datos
      const { error } = await supabase
        .from("perfiles")
        .update({ [field]: file_key })
        .eq("id", perfil.id);
  
      if (error) throw new Error("Error al guardar en la base de datos");
  
      setMessage({ text: "✅ Archivo subido correctamente.", type: "success" });
      await refreshPerfil(); // Recargar estado
    } catch (error) {
      setMessage({ text: error instanceof Error ? error.message : "Error desconocido", type: "error" });
    }
  }

  async function handleUploadMultipleVideos(files: File[]) {
    try {
      setMessage({ text: "Subiendo videos...", type: "success" });
  
      let updatedVideos = Array.isArray(perfil.video_url) ? [...perfil.video_url] : [];
  
      for (const file of files) {
        const { upload_url, file_key } = await obtenerURLSubida(file.name, file.type, "perfil-videos");
  
        const uploadResponse = await fetch(upload_url, {
          method: "PUT",
          body: file,
          headers: { "Content-Type": file.type },
        });
  
        if (!uploadResponse.ok) {
          throw new Error("Error subiendo video: " + file.name);
        }
  
        updatedVideos.push(file_key); // Agregar nuevo video
      }
  
      // Guardar en la base de datos
      const { error } = await supabase
        .from("perfiles")
        .update({ video_url: updatedVideos }) // Se mantiene el nombre video_url
        .eq("id", perfil.id);
  
      if (error) throw new Error("Error al guardar en la base de datos");
  
      setMessage({ text: "✅ Videos subidos correctamente.", type: "success" });
      await refreshPerfil();
    } catch (error) {
      setMessage({ text: error instanceof Error ? error.message : "Error desconocido", type: "error" });
    }
  }
  
  
  async function handleRemoveVideo(videoKey: string) {
    try {
      let updatedVideos = perfil.video_url.filter((vid: string) => vid !== videoKey);
  
      const { error } = await supabase
        .from("perfiles")
        .update({ video_url: updatedVideos })
        .eq("id", perfil.id);
  
      if (error) throw new Error("Error al eliminar el video");
  
      setMessage({ text: "✅ Video eliminado.", type: "success" });
      await refreshPerfil();
    } catch (error) {
      setMessage({ text: error instanceof Error ? error.message : "Error desconocido", type: "error" });
    }
  }

  
  async function handleRemovePhoto() {
    if (!perfil?.foto_url) {
      setMessage({ text: "No hay foto de perfil para eliminar.", type: "error" });
      return;
    }
  
    try {
      const { error } = await supabase
        .from("perfiles")
        .update({ foto_url: null }) // o ""
        .eq("id", perfil.id);
  
      if (error) throw new Error("Error al eliminar la foto de perfil en la BD");
  
      // Limpia el estado
      setMessage({ text: "Foto de perfil eliminada.", type: "success" });
      await refreshPerfil();
    } catch (err) {
      setMessage({
        text: err instanceof Error ? err.message : "Error desconocido",
        type: "error",
      });
    }
  }
  
  // Subir múltiples archivos
  async function handleUploadMultiple(files: File[], folder: string, field: string) {
  try {
    setMessage({ text: "Subiendo archivos...", type: "success" });

    let updatedArray = field === "galeria" ? [...galeria] : [...pdfs];

    for (const file of files) {
      let finalFile = file;

      // 🔹 Solo comprimimos si es la foto de perfil (field === "foto_url")
      if (field === "foto_url") {
        finalFile = await resizeImage(file, 0.5);
      }

      // 🔹 Obtener URL firmada para subida
      const { upload_url, file_key } = await obtenerURLSubida(finalFile.name, finalFile.type, folder);

      // 🔹 Subir a S3
      const uploadResponse = await fetch(upload_url, {
        method: "PUT",
        body: finalFile,
        headers: { "Content-Type": finalFile.type },
      });

      if (!uploadResponse.ok) {
        throw new Error("Error subiendo archivo: " + finalFile.name);
      }

      // 🔹 Agregar la ruta al array
      updatedArray.push(file_key);
    }

    // 🔹 Guardar en BD
    const { error } = await supabase
      .from("perfiles")
      .update({ [field]: updatedArray })
      .eq("id", perfil.id);

    if (error) throw new Error("Error al guardar en la base de datos");

    setMessage({ text: "✅ Archivos subidos correctamente.", type: "success" });
    await refreshPerfil();
  } catch (error) {
    setMessage({ text: error instanceof Error ? error.message : "Error desconocido", type: "error" });
  }
  }


  // Refrescar datos tras subir
  async function refreshPerfil() {
    const { data: updatedPerfil } = await supabase
      .from("perfiles")
      .select("*")
      .eq("id", perfil.id)
      .single();
  
    if (updatedPerfil) {
      setPerfil(updatedPerfil);
      setGaleria(updatedPerfil.galeria || []);
      setVideoUrl(Array.isArray(updatedPerfil.video_url) ? updatedPerfil.video_url : []); // Asegurar que es un array
      setPdfs(updatedPerfil.pdfs || []);
    }
  }
  

  // Guardar campos
  async function handleSave() {
    const { error } = await supabase
      .from("perfiles")
      .update({
        nombre,
        puesto,
        email,
        telefono,
        whatsapp,
        linkedin,
        instagram,
        youtube,
        twitter,
        facebook,
        website,
      })
      .eq("id", perfil.id);

    if (error) {
      setMessage({ text: "Error guardando perfil.", type: "error" });
    } else {
      setMessage({ text: "✅ Perfil actualizado.", type: "success" });
    }
  }

  // Ver perfil público
  function verPerfilPublico() {
    const urlPublica = `/u/${perfil.url_id || "FALTA_URLID"}`;
    window.open(urlPublica, "_blank");
  }

  if (!perfil) {
    return (
      <ProtectedRoute>
        <div className="p-6">
          {message && (
            <p className={`mt-4 p-2 rounded ${message?.type === "success" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
              {message.text}
            </p>
          )}
          <p>Cargando...</p>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <DarkContainer>
        <div className="p-6">
          <Logout />
          <h1 className="text-xl font-bold mb-6">Editar Perfil</h1>
  
          {message && (
            <p className={`p-2 rounded ${message.type === "success" ? "bg-green-500 text-white" : "bg-red-500 text-white"}`}>
              {message.text}
            </p>
          )}
  
          {/* 📌 Campos de usuario */}
          <div className="grid grid-cols-1 gap-4">
            <label>Nombre</label>
            <input className="input-field" value={nombre} onChange={(e) => setNombre(e.target.value)} />
  
            <label>Puesto</label>
            <input className="input-field" value={puesto} onChange={(e) => setPuesto(e.target.value)} />
  
            <label>Email (solo lectura)</label>
            <input className="input-field" value={email} readOnly />
  
            <label>Teléfono</label>
            <input className="input-field" value={telefono} onChange={(e) => setTelefono(e.target.value)} />
  
            <label>WhatsApp</label>
            <input className="input-field" value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} />
  
            <label>LinkedIn</label>
            <input className="input-field" value={linkedin} onChange={(e) => setLinkedin(e.target.value)} />
  
            <label>Instagram</label>
            <input className="input-field" value={instagram} onChange={(e) => setInstagram(e.target.value)} />
  
            <label>Youtube</label>
            <input className="input-field" value={youtube} onChange={(e) => setYoutube(e.target.value)} />
  
            <label>Twitter</label>
            <input className="input-field" value={twitter} onChange={(e) => setTwitter(e.target.value)} />
  
            <label>Facebook</label>
            <input className="input-field" value={facebook} onChange={(e) => setFacebook(e.target.value)} />
  
            <label>Website</label>
            <input className="input-field" value={website} onChange={(e) => setWebsite(e.target.value)} />
          </div>
  
          {/* 📌 Guardar Cambios */}
          <button className="btn-primary mt-4" onClick={handleSave}>
            Guardar Cambios
          </button>
  
          {/* 📌 Foto de Perfil */}
          <h2 className="text-lg font-bold mt-6">Foto de Perfil</h2>
          {fotoFirmada && (
            <>
              <img src={fotoFirmada} alt="Foto de perfil" className="w-32 h-32 object-cover border border-gray-600 rounded my-4" />
              <button className="btn-danger mt-2" onClick={handleRemovePhoto}>
                Eliminar Foto
              </button>
            </>
          )}
          <input type="file" accept="image/*" onChange={(e) => setFotoFile(e.target.files?.[0] || null)} />
          <button className="btn-secondary mt-2" onClick={() => fotoFile && handleUpload(fotoFile, "perfil-fotos", "foto_url")}>
            Subir Foto
          </button>
  
          {/* 📌 Galería de Imágenes */}
          <h2 className="text-lg font-bold mt-6">Galería de Imágenes</h2>
          {galeriaFirmada.length > 0 && (
            <div className="flex flex-wrap gap-4 my-2">
              {galeriaFirmada.map((item) => (
                <img key={item.file_key} src={item.get_url} alt="Imagen galería" className="w-32 h-32 object-cover" />
              ))}
            </div>
          )}
          <input type="file" multiple accept="image/*" onChange={(e) => setGaleriaFiles(Array.from(e.target.files || []))} />
          <button className="btn-secondary mt-2" onClick={() => galeriaFiles.length > 0 && handleUploadMultiple(galeriaFiles, "perfil-galeria", "galeria")}>
            Subir Imágenes
          </button>
  
          {/* 📌 Videos */}
          <h2 className="text-lg font-bold mt-6">Videos</h2>
          {Array.isArray(perfil.video_url) && perfil.video_url.length > 0 && (
            <div className="flex flex-col space-y-4 my-2">
              {perfil.video_url.map((vidKey: string) => {
                const urlFirmada = presignedMap[vidKey];
                if (!urlFirmada) return null;
                return (
                  <div key={vidKey} className="relative">
                    <video src={urlFirmada} controls className="w-64 h-auto rounded shadow" />
                    <button
                      className="absolute bottom-1 right-1 bg-white bg-opacity-70 rounded-full p-1 text-gray-800 hover:bg-opacity-90"
                      onClick={() => handleDownloadMedia(urlFirmada, vidKey)}
                    >
                      <FaDownload />
                    </button>
                    <button
                      className="absolute bottom-1 left-1 bg-red-600 text-white rounded-full p-1 hover:bg-red-700"
                      onClick={() => handleRemoveVideo(vidKey)}
                    >
                      <FaTrash />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
          <input type="file" multiple accept="video/*" onChange={(e) => setVideoFiles(Array.from(e.target.files || []))} />
          <button className="btn-secondary mt-2" onClick={() => videoFiles.length > 0 && handleUploadMultipleVideos(videoFiles)}>
            Subir Videos
          </button>


  
          {/* 📌 Documentos PDF */}
          <h2 className="text-lg font-bold mt-6">Documentos (PDF)</h2>
          {pdfsFirmadas.length > 0 && (
            <div className="flex flex-col gap-2 my-2">
              {pdfsFirmadas.map((item) => (
                <a key={item.file_key} href={item.get_url} target="_blank" rel="noopener noreferrer" className="text-blue-500 underline">
                  Ver PDF: {item.file_key}
                </a>
              ))}
            </div>
          )}
          <input type="file" multiple accept="application/pdf" onChange={(e) => setPdfFiles(Array.from(e.target.files || []))} />
          <button className="btn-secondary mt-2" onClick={() => pdfFiles.length > 0 && handleUploadMultiple(pdfFiles, "perfil-pdfs", "pdfs")}>
            Subir PDFs
          </button>
  
          {/* 📌 Botón Atrás */}
          <button className="btn-back mt-6" onClick={() => router.push("/user")}>
            Atrás
          </button>
        </div>
      </DarkContainer>
    </ProtectedRoute>
  );
  
}
