// lib/getUrls.ts
export async function obtenerURLsLecturaMultiples(fileKeys: string[]): Promise<Array<{ file_key: string; get_url: string }>> {
  try {
    // Reemplaza con la URL de tu API Gateway
    const API_URL = "https://id4drvr8k8.execute-api.us-east-1.amazonaws.com/dev/get-urls";

    const response = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ file_keys: fileKeys }),
    });

    if (!response.ok) {
      const text = await response.text();
      //console.error("Error al obtener URLs firmadas:", text);
      throw new Error("No se pudo obtener las URLs firmadas. Status: " + response.status);
    }

    // data = { statusCode, body: "{\"urls\":[...]}" }
    const data = await response.json();
    const parsedBody = JSON.parse(data.body); // { urls: [...] }
    return parsedBody.urls; // [{ file_key, get_url }, ...]
  } catch (error) {
    //console.error("Error en obtenerURLsLecturaMultiples:", error);
    return [];
  }
}
