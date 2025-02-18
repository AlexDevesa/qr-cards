export async function registrarDescarga(
  tarjetaId: string,
  tipo: "view" | "download" = "download"
) {
  const ENDPOINT = "https://id4drvr8k8.execute-api.us-east-1.amazonaws.com/dev/descarga";

  try {
    const userAgent = navigator.userAgent;
    const referrer = document.referrer || "Desconocido";

    const body = {
      tarjeta_id: tarjetaId,
      tipo,
      user_agent: userAgent,
      referrer
    };

    //console.log("Enviando registro de descarga:", body);

    const response = await fetch(ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorText = await response.text();
      //console.error("Error al registrar descarga:", errorText);
      throw new Error(`No se pudo registrar la descarga. Status: ${response.status}`);
    }

    const data = await response.json();
    //console.log("Registro exitoso:", data);
    return data;
  } catch (error) {
    //console.error("Error en registrarDescarga:", error);
    return null;
  }
}
