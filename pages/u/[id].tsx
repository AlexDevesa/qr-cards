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
import { resizeImage } from "../../lib/resizeImage"; 


// Convierte un Blob a base64
async function blobToBase64(blob: Blob): Promise<string> {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = reject;
    reader.onload = () => {
      const dataUrl = reader.result as string;
      const base64 = dataUrl.split(",", 2)[1];
      resolve(base64);
    };
    reader.readAsDataURL(blob);
  });
}

// Separa el nombre en N y FN para iPhone
function parseFullName(fullName: string) {
  const parts = fullName.trim().split(/\s+/);
  if (parts.length === 1) {
    // Solo un token => sin apellidos
    const name = parts[0];
    return {
      nLine: `N:;${name};;;`,
      fnLine: `FN:${name}`,
    };
  } else {
    // El primer token es NOMBRE, el resto son apellidos
    const [nombre, ...apellidos] = parts;
    const joinedApellidos = apellidos.join(" ");
    return {
      nLine: `N:${joinedApellidos};${nombre};;;`,
      fnLine: `FN:${fullName}`,
    };
  }
}

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

      // OPCIONAL: Registrar la visualización
      if (tarjeta.id) {
        registrarDescarga(tarjeta.id, "view");
  //.catch((error) => console.error("No se pudo registrar la vista:", error));
      }
    }
    fetchData();
  }, [id]);

  // Al tener perfil y empresa, reunir fileKeys y pedir presigned GET
  useEffect(() => {
    if (!perfil || !empresa) return;

    const fileKeys: string[] = [];
    if (empresa.logo_url) fileKeys.push(empresa.logo_url);
    if (perfil.foto_url) fileKeys.push(perfil.foto_url);
    if (Array.isArray(perfil.galeria)) fileKeys.push(...perfil.galeria);
    if (Array.isArray(perfil.videos)) fileKeys.push(...perfil.videos);
    if (Array.isArray(perfil.pdfs)) fileKeys.push(...perfil.pdfs);

    if (fileKeys.length === 0) return;

    async function fetchPresigned() {
      const result = await obtenerURLsLecturaMultiples(fileKeys);
      const map: { [key: string]: string } = {};
      result.forEach((item) => {
        map[item.file_key] = item.get_url;
      });
      setPresignedMap(map);
    }
    fetchPresigned();
  }, [perfil, empresa]);

  if (loading) return <p className="text-center mt-10">Cargando...</p>;
  if (!perfil || !empresa) return <p className="text-center mt-10">Perfil no encontrado.</p>;

  // Arrays
  const galeria = Array.isArray(perfil.galeria) ? perfil.galeria : [];
  const videos = Array.isArray(perfil.videos) ? perfil.videos : [];
  const pdfs = Array.isArray(perfil.pdfs) ? perfil.pdfs : [];

  // Colores
  const fondoPrimario = empresa.color_primario || "#ffffff";
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

  /**
   * Genera y descarga la vCard
   */
  function foldLine(str: string, maxLength = 75): string {
    const chunks: string[] = [];
    let i = 0;
    while (i < str.length) {
      // Tomamos hasta maxLength caracteres
      chunks.push(str.slice(i, i + maxLength));
      i += maxLength;
    }
    // Unimos con "\r\n " (CRLF + espacio) según el estándar vCard
    return chunks.join("\r\n ");
  }

  const handleDownloadVCF = async () => {
    
    if (!perfil || !empresa) return;

    // 1. Registrar la descarga en la tabla descargas
    if (tarjetaId) {
        await registrarDescarga(tarjetaId, "download");
    }

    // 2. Parsear nombre
    const fullName = perfil.nombre?.trim() || "Invitado";
    const { nLine, fnLine } = parseFullName(fullName);

    // 3. Construir la vCard
    let vcf = `BEGIN:VCARD
VERSION:3.0
${nLine}
${fnLine}
ORG:${empresa.nombre}
TITLE:${perfil.puesto}
TEL;TYPE=WORK,voice:${perfil.telefono}
EMAIL;TYPE=WORK:${perfil.email}
NOTE:Mi perfil para consultar novedades: https://qr.techversio.com/u/${id}
URL:${perfil.website || ""}
`;

// 4. Descargar y redimensionar la imagen
let fotoKey = perfil.foto_url || empresa.logo_url;
if (fotoKey && presignedMap[fotoKey]) {
  try {
    const response = await fetch(presignedMap[fotoKey], {
      mode: "cors",
      credentials: "omit",
      referrerPolicy: "no-referrer",
    });
    if (!response.ok) throw new Error(`No se pudo descargar la imagen: ${response.statusText}`);

    const blob = await response.blob();
    const contentType = response.headers.get("Content-Type") || "image/jpeg";

    // Redimensionar
    const resizedFile = await resizeImage(
      new File([blob], "profile.jpeg", { type: contentType }),
      0.1 // por ejemplo
    );
    const resizedBlob = new Blob([resizedFile], { type: "image/jpeg" });

    // Convertir a base64
    const base64 = await blobToBase64(resizedBlob);

    // *Importantísimo* para iOS:
    const foldedBase64 = foldLine(base64);

    // Usar ENCODING=BASE64 y plegado de líneas
    vcf += `PHOTO;TYPE=JPEG;ENCODING=BASE64:${foldedBase64}\r\n`;
  } catch (err) {
    console.error("Error al descargar/incrustar foto en la vCard:", err);
  }
}

vcf += "END:VCARD";

// 5. Descargar vCard
try {
  const blob = new Blob([vcf], { type: "text/vcard" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = fullName.replace(/\s+/g, "_") + ".vcf";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);

  // Revocar URL temporal después de un tiempo
  setTimeout(() => URL.revokeObjectURL(url), 1000);
} catch (downloadError) {
  console.error("Error al descargar la vCard:", downloadError);
}
};



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
          onClick={handleDownloadVCF}
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

      {/* Videos */}
      {Array.isArray(perfil.videos) && perfil.videos.length > 0 && (
        <div className="bg-white text-black p-6 rounded-lg shadow-lg w-full max-w-md mt-6">
          <h2 className="text-xl font-bold mb-4 text-center">Videos</h2>
          <div className="flex flex-col space-y-4 items-center">
            {perfil.videos.map((vidKey: string) => {
              const urlFirmada = presignedMap[vidKey];
              if (!urlFirmada) return null;
              return (
                <div key={vidKey} className="relative">
                  <video
                    src={urlFirmada}
                    controls
                    className="w-64 h-auto rounded shadow cursor-pointer"
                    onClick={() => openLightbox(urlFirmada)}
                  />
                  <button
                    className="absolute bottom-1 right-1 bg-white bg-opacity-70 rounded-full p-1 text-gray-800 hover:bg-opacity-90"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDownloadMedia(urlFirmada, vidKey);
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
