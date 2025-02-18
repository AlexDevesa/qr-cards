import { registrarDescarga } from "./descarga";
import { resizeImage } from "./resizeImage";

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

// Plegar líneas para compatibilidad con vCard (máximo 75 caracteres por línea)
function foldLine(str: string, maxLength = 75): string {
  const chunks: string[] = [];
  let i = 0;
  while (i < str.length) {
    chunks.push(str.slice(i, i + maxLength));
    i += maxLength;
  }
  return chunks.join("\r\n ");
}

// Separa el nombre en N y FN para iPhone
function parseFullName(fullName: string) {
  const parts = fullName.trim().split(/\s+/);
  if (parts.length === 1) {
    return {
      nLine: `N:;${parts[0]};;;`,
      fnLine: `FN:${parts[0]}`,
    };
  } else {
    const [nombre, ...apellidos] = parts;
    const joinedApellidos = apellidos.join(" ");
    return {
      nLine: `N:${joinedApellidos};${nombre};;;`,
      fnLine: `FN:${fullName}`,
    };
  }
}

export async function handleDownloadVCF(
  perfil: any,
  empresa: any,
  tarjetaId: string | null,
  id: string | string[] | undefined,
  presignedMap: { [key: string]: string }
) {
  if (!perfil || !empresa) return;

  if (tarjetaId) {
    await registrarDescarga(tarjetaId, "download");
  }

  const fullName = perfil.nombre?.trim() || "Invitado";
  const { nLine, fnLine } = parseFullName(fullName);

  let vCardLines = [
    "BEGIN:VCARD",
    "VERSION:3.0",
    nLine,
    fnLine,
    `ORG:${empresa.nombre}`,
    `TITLE:${perfil.puesto}`,
    `TEL;TYPE=WORK,voice:${perfil.telefono}`,
    `EMAIL;TYPE=WORK:${perfil.email}`,
    `URL:https://qr.techversio.com/u/${id}"}`,
  ];

  let fotoKey = perfil.foto_url || empresa.logo_url;
  let fotoUrl = fotoKey ? presignedMap[fotoKey] : null;

  if (fotoUrl) {
    try {
      console.log("Descargando imagen desde:", fotoUrl);

      const response = await fetch(fotoUrl);
      if (!response.ok) throw new Error(`No se pudo descargar la imagen: ${response.statusText}`);

      const blob = await response.blob();

      // Redimensionar la imagen para que pese menos de 0.2 MB
      const resizedFile = await resizeImage(
        new File([blob], "profile.jpeg", { type: "image/jpeg" }),
        0.1 // Reducimos la calidad para que pese menos
      );
      const resizedBlob = new Blob([resizedFile], { type: "image/jpeg" });

      // Convertir la imagen a Base64
      const base64 = await blobToBase64(resizedBlob);

      // *Importantísimo* para iOS: Plegar líneas según estándar vCard
      const foldedBase64 = foldLine(base64);

      // Agregar imagen en Base64 a la vCard
      vCardLines.push(`PHOTO;TYPE=JPEG;ENCODING=BASE64:${foldedBase64}\r\n`);
    } catch (err) {
      console.error("Error al descargar/incrustar foto en la vCard:", err);
    }
  }

  vCardLines.push("END:VCARD");

  // Descargar la vCard
  descargarVCard(vCardLines, fullName);
}

function descargarVCard(vCardLines: string[], fullName: string) {
  const vCardBlob = new Blob([vCardLines.join("\r\n")], { type: "text/vcard" });
  const url = URL.createObjectURL(vCardBlob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${fullName.replace(/\s+/g, "_")}.vcf`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
