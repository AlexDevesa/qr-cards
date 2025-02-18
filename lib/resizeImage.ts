import Resizer from "react-image-file-resizer";

/**
 * Redimensiona una imagen si supera el tamaño máximo permitido.
 * 
 * @param file Archivo de imagen a redimensionar.
 * @param maxSizeMB Tamaño máximo en MB antes de redimensionar (por defecto 0.3 MB).
 * @returns Archivo redimensionado en formato JPEG.
 */
export async function resizeImage(file: File, maxSizeMB = 0.3): Promise<File> {
    return new Promise((resolve, reject) => {
        // Si el archivo es menor a maxSizeMB, lo devolvemos sin modificar
        if (!file.type.startsWith("image/") || file.size <= maxSizeMB * 1024 * 1024) {
            return resolve(file);
        }

        Resizer.imageFileResizer(
            file,
            800, // Ancho máximo
            800, // Alto máximo
            "JPEG", // Formato de salida
            80, // Calidad (0 - 100)
            0, // Rotación
            async (resizedFile) => {
                if (resizedFile instanceof Blob) {
                    const newFile = new File([resizedFile], `${file.name.replace(/\.\w+$/, "")}.jpeg`, {
                        type: "image/jpeg",
                    });

                    resolve(newFile);
                } else {
                    reject(new Error("Error al redimensionar la imagen"));
                }
            },
            "blob" // 🔹 Salida en formato Blob en lugar de base64
        );
    });
}
