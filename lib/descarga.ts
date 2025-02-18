// lib/descarga.ts
export async function registrarDescarga(
    tarjetaId: string,
    tipo: "view" | "download" = "download"
  ) {
    const ENDPOINT = "https://id4drvr8k8.execute-api.us-east-1.amazonaws.com/dev/descarga";
  
    try {
      const userAgent = navigator.userAgent; // si lo deseas
      const body = {
        tarjeta_id: tarjetaId,
        tipo,
        ip: "Desconocido",
        user_agent: userAgent,
      };
  
      const response = await fetch(ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
        // mode: "cors" // Podrías añadirlo, aunque normal. 
      });
  
      if (!response.ok) {
        const text = await response.text();
        //console.error("Error registrando:", text);
        throw new Error("No se pudo registrar la descarga. Status: " + response.status);
      }
  
      const data = await response.json();
      //console.log("Registro OK:", data);
      return data;
    } catch (error) {
      // Manejo de error
      //console.error("Error al registrar descarga:", error);
      // Retornamos null o lo que quieras
      return null;
    }
  }
  