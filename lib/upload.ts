// lib/upload.ts

export async function obtenerURLSubida(fileName: string, fileType: string, folder: string) {
  //console.log("↗️ Solicitando URL firmada para la subida...");

  // Ajusta la URL a tu endpoint de API Gateway
  const API_URL = "https://id4drvr8k8.execute-api.us-east-1.amazonaws.com/dev/upload";

  const response = await fetch(API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ file_name: fileName, file_type: fileType, folder }),
  });

  if (!response.ok) {
    const text = await response.text();
    //console.error("Error al obtener URL de subida:", text);
    throw new Error("No se pudo obtener la URL firmada. Status: " + response.status);
  }

  // data es algo como:
  // {
  //   "statusCode": 200,
  //   "body": "{\"upload_url\":\"...\",\"file_key\":\"...\"}"
  // }
  const data = await response.json();
  //console.log("✅ Respuesta de la API Gateway:", data);

  // Debemos parsear data.body para extraer "upload_url" y "file_key".
  const parsedBody = JSON.parse(data.body);

  //console.log("✅ parsedBody:", parsedBody);

  // parsedBody: { upload_url: "...", file_key: "..." }
  return parsedBody; 
}
