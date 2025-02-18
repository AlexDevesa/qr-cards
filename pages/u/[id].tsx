import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import { useRouter } from "next/router";
import {
  FaWhatsapp,
  FaLinkedin,
  FaInstagram,
  FaTwitter,
  FaYoutube,
  FaGlobe,
  FaPhone,
  FaEnvelope,
  FaFilePdf,
  FaDownload,
} from "react-icons/fa";
import { obtenerURLsLecturaMultiples } from "../../lib/getUrls";
import { registrarDescarga } from "../../lib/descarga";
import { handleDownloadVCF } from "../../lib/downloadVCard";


export default function Tarjeta() {
  const router = useRouter();
  const { id } = router.query;

  const [perfil, setPerfil] = useState<any>(null);
  const [empresa, setEmpresa] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  // Guardamos el ID real de la tarjeta
  const [tarjetaId, setTarjetaId] = useState<string | null>(null);

  // Mapa fileKey -> presigned GET URL
  const [presignedMap, setPresignedMap] = useState<{ [key: string]: string }>({});

  // Lightbox para ver a pantalla completa
  const [lightboxItem, setLightboxItem] = useState<string | null>(null);

  

  useEffect(() => {
    async function fetchData() {
      if (!id) return;

      // IMPORTANTE: Incluye "id" en la selección
      const { data: tarjeta, error: tarjetaError } = await supabase
        .from("tarjetas")
        .select("id, comercial_id, empresa_id") // <--- AÑADIMOS id
        .eq("url_id", id)
        .single();

      if (!tarjeta || tarjetaError) {
        setLoading(false);
        return;
      }

      // Almacena el ID de la tarjeta en un state
      setTarjetaId(tarjeta.id);

      // 2. Obtener perfil
      const { data: perfilData } = await supabase
        .from("perfiles")
        .select("*")
        .eq("comercial_id", tarjeta.comercial_id)
        .single();

      setPerfil(perfilData);

      // 3. Empresa
      const { data: empresaData } = await supabase
        .from("empresas")
        .select("*")
        .eq("id", tarjeta.empresa_id)
        .single();

      setEmpresa(empresaData);

      setLoading(false);

      // 4.Registrar la visualización
      if (tarjeta.id) {
        registrarDescarga(tarjeta.id, "view").catch((error) =>
          console.error("No se pudo registrar la vista:", error)
        );
      }
    }
    
    fetchData();
  }, [id]);

  // Al tener perfil y empresa, reunir fileKeys y pedir presigned GET
  useEffect(() => {
    async function fetchPresigned() {
      if (!perfil || !empresa) return;

      const fileKeys: string[] = [];
      if (empresa.logo_url) fileKeys.push(empresa.logo_url);
      if (perfil.foto_url) fileKeys.push(perfil.foto_url);
      if (Array.isArray(perfil.galeria)) fileKeys.push(...perfil.galeria);
      if (Array.isArray(perfil.video_url)) fileKeys.push(...perfil.video_url);
      if (Array.isArray(perfil.pdfs)) fileKeys.push(...perfil.pdfs);

      if (fileKeys.length === 0) return;

      try {
        //console.log("Solicitando URLs firmadas para:", fileKeys);
        const result = await obtenerURLsLecturaMultiples(fileKeys);
        //console.log("Respuesta de obtenerURLsLecturaMultiples:", result);

        const map: { [key: string]: string } = {};
        result.forEach((item) => {
          map[item.file_key] = item.get_url;
        });

        setPresignedMap(map);
      } catch (error) {
        //console.error("Error obteniendo URLs firmadas:", error);
      }
    }

    fetchPresigned();
  }, [perfil, empresa]);

  if (loading) return <p className="text-center mt-10">Cargando...</p>;
  if (!perfil || !empresa) return <p className="text-center mt-10">Perfil no encontrado.</p>;

  // Arrays
  const galeria = Array.isArray(perfil.galeria) ? perfil.galeria : [];
  const videos = Array.isArray(perfil.video_url) ? perfil.video_url : [];
  const pdfs = Array.isArray(perfil.pdfs) ? perfil.pdfs : [];

  // Colores
  const fondoPrimario = empresa.color_primario || "#182438";
  const colorSecundario = empresa.color_secundario || "#000000";

  /** Abre el lightbox */
  function openLightbox(url: string) {
    setLightboxItem(url);
  }

  /** Cierra el lightbox */
  function closeLightbox() {
    setLightboxItem(null);
  }

  /** Descarga una imagen/video */
  function handleDownloadMedia(url: string, fileKey: string) {
    const a = document.createElement("a");
    a.href = url;
    const name = fileKey.split("/").pop() || "file";
    a.download = name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }

  const handleVCard= async () => {
    handleDownloadVCF(perfil, empresa, tarjetaId, id, presignedMap);
  }


  return (
    <div
      className="min-h-screen w-full flex flex-col items-center p-6"
      style={{ backgroundColor: fondoPrimario, color: colorSecundario }}
    >
      {/* Lightbox */}
      {lightboxItem && (
        <div
          className="fixed inset-0 bg-black bg-opacity-80 z-50 flex items-center justify-center"
          onClick={closeLightbox}
        >
          {lightboxItem.endsWith(".mp4") ? (
            <video src={lightboxItem} controls className="max-w-full max-h-full" />
          ) : (
            <img src={lightboxItem} alt="Preview" className="max-w-full max-h-full" />
          )}
        </div>
      )}

      {/* Empresa */}
      <div className="bg-white text-black p-6 rounded-lg shadow-lg w-full max-w-md mb-6">
        <div className="flex flex-col items-center">
          {empresa.logo_url && presignedMap[empresa.logo_url] && (
            <img
              src={presignedMap[empresa.logo_url]}
              alt="Logo Empresa"
              className="w-24 h-24 object-cover rounded-full mb-2"
            />
          )}
          <h2 className="text-2xl font-bold" style={{ color: "#000" }}>{empresa.nombre}</h2>
          <div className="mt-4 space-y-2 text-center">
            {empresa.direccion && <p>{empresa.direccion}</p>}
            {(empresa.codigo_postal || empresa.poblacion) && (
              <p>{`${empresa.codigo_postal || ""} ${empresa.poblacion || ""}`}</p>
            )}
            {empresa.cif && <p>CIF: {empresa.cif}</p>}
            {empresa.telefono && (
              <p className="flex items-center justify-center">
                <FaPhone className="mr-2 text-gray-600" /> {empresa.telefono}
              </p>
            )}
            {empresa.web && (
              <p className="flex items-center justify-center">
                <FaGlobe className="mr-2 text-gray-600" />
                <a href={empresa.web} target="_blank" rel="noopener noreferrer" className="text-blue-500 underline">
                  {empresa.web}
                </a>
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Comercial */}
      <div className="bg-white text-black p-6 rounded-lg shadow-lg w-full max-w-md">
        <div className="flex flex-row items-center mb-4">
          {perfil.foto_url && presignedMap[perfil.foto_url] && (
            <img
              src={presignedMap[perfil.foto_url]}
              alt="Foto de perfil"
              className="w-16 h-16 object-cover rounded-full mr-4"
            />
          )}
          <div>
          <h1 className="text-2xl font-bold" style={{ color: "#000" }}>
              {perfil.nombre}
          </h1>
            <p className="text-gray-600">{perfil.puesto}</p>
          </div>
        </div>

        <div className="mt-4 space-y-2">
          {perfil.telefono && (
            <p className="flex items-center">
              <FaPhone className="mr-2 text-gray-600" /> {perfil.telefono}
            </p>
          )}
          {perfil.email && (
            <p className="flex items-center">
              <FaEnvelope className="mr-2 text-gray-600" /> {perfil.email}
            </p>
          )}
          {perfil.website && (
            <p className="flex items-center">
              <FaGlobe className="mr-2 text-gray-600" />
              <a href={perfil.website} target="_blank" rel="noopener noreferrer" className="text-blue-500 underline">
                {perfil.website}
              </a>
            </p>
          )}
        </div>

        {/* Redes */}
        <div className="flex justify-center space-x-4 mt-4">
          {perfil.whatsapp && (
            <a href={`https://wa.me/${perfil.whatsapp}`} target="_blank" rel="noopener noreferrer">
              <FaWhatsapp className="text-green-500 text-2xl" />
            </a>
          )}
          {perfil.linkedin && (
            <a href={perfil.linkedin} target="_blank" rel="noopener noreferrer">
              <FaLinkedin className="text-blue-500 text-2xl" />
            </a>
          )}
          {perfil.instagram && (
            <a href={perfil.instagram} target="_blank" rel="noopener noreferrer">
              <FaInstagram className="text-pink-500 text-2xl" />
            </a>
          )}
          {perfil.twitter && (
            <a href={perfil.twitter} target="_blank" rel="noopener noreferrer">
              <FaTwitter className="text-blue-400 text-2xl" />
            </a>
          )}
          {perfil.youtube && (
            <a href={perfil.youtube} target="_blank" rel="noopener noreferrer">
              <FaYoutube className="text-red-500 text-2xl" />
            </a>
          )}
        </div>

        <button
          className="bg-blue-500 text-white px-4 py-2 rounded mt-6 w-full flex items-center justify-center"
          onClick={() => handleVCard()}
        >
          📥 Descargar Contacto
        </button>
      </div>

      {/* Galería */}
      {Array.isArray(perfil.galeria) && perfil.galeria.length > 0 && (
        <div className="bg-white text-black p-6 rounded-lg shadow-lg w-full max-w-md mt-6">
          <h2 className="text-xl font-bold mb-4 text-center">Galería</h2>
          <div className="flex flex-wrap gap-4 justify-center">
            {perfil.galeria.map((imgKey: string) => {
              const urlFirmada = presignedMap[imgKey];
              if (!urlFirmada) return null;
              return (
                <div key={imgKey} className="relative">
                  <img
                    src={urlFirmada}
                    alt="Imagen galería"
                    className="w-32 h-32 object-cover rounded shadow cursor-pointer"
                    onClick={() => openLightbox(urlFirmada)}
                  />
                  <button
                    className="absolute bottom-1 right-1 bg-white bg-opacity-70 rounded-full p-1 text-gray-800 hover:bg-opacity-90"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDownloadMedia(urlFirmada, imgKey);
                    }}
                  >
                    <FaDownload />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}


      {/* 📌 Videos */}
      {Array.isArray(perfil.video_url) && perfil.video_url.length > 0 && Object.keys(presignedMap).length > 0 && (
      <div className="bg-white text-black p-6 rounded-lg shadow-lg w-full max-w-md mt-6">
        <h2 className="text-xl font-bold mb-4 text-center">Videos</h2>
        <div className="flex flex-col space-y-4 items-center">
          {perfil.video_url.map((vidKey: string) => {
            const urlFirmada = presignedMap[vidKey];

            if (!urlFirmada) {
              console.warn(`No se encontró URL firmada para ${vidKey}`);
              return null;
            }

            return (
              <div key={vidKey} className="relative">
                <video
                  src={urlFirmada}
                  controls
                  className="w-64 h-auto rounded shadow cursor-pointer"
                />
                <button
                  className="absolute bottom-1 right-1 bg-white bg-opacity-70 rounded-full p-1 text-gray-800 hover:bg-opacity-90"
                  onClick={(e) => {
                    e.stopPropagation();
                    const a = document.createElement("a");
                    a.href = urlFirmada;
                    a.download = vidKey.split("/").pop() || "video";
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                  }}
                >
                  <FaDownload />
                </button>
              </div>
            );
          })}
        </div>
      </div>
    )}


      {/* PDFs */}
      {Array.isArray(perfil.pdfs) && perfil.pdfs.length > 0 && (
        <div className="bg-white text-black p-6 rounded-lg shadow-lg w-full max-w-md mt-6">
          <h2 className="text-xl font-bold mb-4 text-center">Documentos</h2>
          <div className="flex flex-col space-y-3">
            {perfil.pdfs.map((pdfKey: string) => {
              const urlFirmada = presignedMap[pdfKey];
              if (!urlFirmada) return null;
              return (
                <div key={pdfKey} className="flex items-center justify-center space-x-2">
                  <FaFilePdf className="text-red-600 text-2xl" />
                  <a
                    href={urlFirmada}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-500 underline"
                  >
                    Abrir PDF
                  </a>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
