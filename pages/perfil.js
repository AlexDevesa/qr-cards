import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

export default function Perfil() {
  const [perfil, setPerfil] = useState(null);

  useEffect(() => {
    const getPerfil = async () => {
      const { data, error } = await supabase
        .from("perfiles")
        .select("*")
        .single();
      if (!error) setPerfil(data);
    };

    getPerfil();
  }, []);

  return (
    <div className="p-8">
      <h2 className="text-xl font-bold mb-4">Mi perfil</h2>
      {perfil ? (
        <div>
          <p><strong>Nombre:</strong> {perfil.nombre}</p>
          <p><strong>Empresa:</strong> {perfil.empresa}</p>
          <p><strong>WhatsApp:</strong> {perfil.whatsapp}</p>
          <p><strong>LinkedIn:</strong> <a href={perfil.linkedin} className="text-blue-500">{perfil.linkedin}</a></p>
          <p><strong>Video:</strong> <a href={perfil.video_url} className="text-blue-500">{perfil.video_url}</a></p>
        </div>
      ) : (
        <p>Cargando perfil...</p>
      )}
    </div>
  );
}
