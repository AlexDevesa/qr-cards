import { registrarDescarga } from "./descarga";

/**
 * Separa el nombre en `N` y `FN` para compatibilidad con iPhone en vCard.
 */
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

/**
 * Descarga la vCard en el navegador.
 */
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

/**
 * Genera y descarga una vCard con la información del perfil.
 */
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
    // Usamos la URL firmada en lugar de descargar y convertir a Base64
    vCardLines.push(`PHOTO;VALUE=URI:${fotoUrl}`);
  }

  vCardLines.push("END:VCARD");

  // Descargar la vCard
  descargarVCard(vCardLines, fullName);
}
