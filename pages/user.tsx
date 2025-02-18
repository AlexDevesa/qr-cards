import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { useRouter } from "next/router";
import ProtectedRoute from "../components/ProtectedRoute";
import Logout from "../components/Logout";
import { QRCodeCanvas } from "qrcode.react"; // ✅ Importación corregida
import DarkContainer from "../components/DarkContainer"; 

export default function UserPage() {
  const router = useRouter();
  const [tarjetas, setTarjetas] = useState<any[]>([]);
  const [usuario, setUsuario] = useState<any>(null);
  const [qrUrl, setQrUrl] = useState<string | null>(null);

  useEffect(() => {
    async function fetchUserData() {
      const { data: authData, error: authError } = await supabase.auth.getUser();
      if (authError || !authData?.user) return router.push("/login");

      const { data: usuarioData, error: usuarioError } = await supabase
        .from("usuarios")
        .select("*")
        .eq("email", authData.user.email)
        .single();

      if (usuarioError || !usuarioData) return router.push("/login");

      setUsuario(usuarioData);

      const { data: tarjetasData, error: tarjetasError } = await supabase
        .from("tarjetas")
        .select("*")
        .eq("comercial_id", authData.user.id);

      if (!tarjetasError) setTarjetas(tarjetasData || []);
    }

    fetchUserData();
  }, [router]);

  function generarQR(tarjeta: any) {
    setQrUrl(`https://qr.techversio.com/u/${tarjeta.url_id}`);
  }

  if (!usuario) {
    return (
      <ProtectedRoute>
        <DarkContainer>
          <div className="p-6">
            <p className="text-gray-300">Cargando...</p>
          </div>
        </DarkContainer>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <DarkContainer>
        {/* Título y Logout */}
        <div className="flex flex-col md:flex-row justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-white text-center md:text-left">Mis Tarjetas</h1>
          <Logout />
        </div>
  
        {/* Listado de tarjetas */}
        {tarjetas.length > 0 ? (
          <div className="grid gap-4">
            {tarjetas.map((tarjeta) => (
              <div key={tarjeta.id} className="bg-gray-800 shadow-md p-4 rounded-lg text-white">
                <p><strong>Tarjeta:</strong> {tarjeta.codigo || "Sin nombre"}</p>
                <p>
                  <strong>URL:</strong>{" "}
                  <a
                    href={`https://qr.techversio.com/u/${tarjeta.url_id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-400 underline"
                  >
                    Abrir
                  </a>
                </p>
  
                {/* Botón para generar QR */}
                <button
                  className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded mt-3 w-full"
                  onClick={() => generarQR(tarjeta)}
                >
                  Crear QR
                </button>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-400 text-center">No tienes tarjetas asignadas.</p>
        )}
  
        {/* Mostrar QR si se ha generado */}
        {qrUrl && (
          <div className="mt-8 text-center">
            <h2 className="text-xl font-bold text-white mb-4">Código QR generado</h2>
            <div className="bg-white p-4 rounded-md inline-block">
              <QRCodeCanvas value={qrUrl} size={200} />
            </div>
            <p className="mt-4 text-gray-400">Escanea este código para acceder a la tarjeta.</p>
          </div>
        )}
  
        {/* Botón para ir a la página de perfil */}
        <div className="flex justify-center mt-6">
          <button
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md w-full max-w-xs"
            onClick={() => router.push("/perfil")}
          >
            Ver Perfil
          </button>
        </div>
      </DarkContainer>
    </ProtectedRoute>
  );
  
}
