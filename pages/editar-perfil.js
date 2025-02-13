import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import { useRouter } from "next/router";

export default function EditarPerfil() {
  const [perfil, setPerfil] = useState({
    nombre: "",
    empresa: "",
    whatsapp: "",
    linkedin: "",
    video_url: ""
  });

  const router = useRouter();

  useEffect(() => {
    const fetchPerfil = async () => {
      const { data } = await supabase.from("perfiles").select("*").single();
      setPerfil(data || {});
    };

    fetchPerfil();
  }, []);

  const handleUpdate = async () => {
    await supabase.from("perfiles").update(perfil).eq("id", perfil.id);
    router.push("/perfil");
  };

  return (
    <div className="p-8">
      <h2 className="text-xl font-bold mb-4">Editar Perfil</h2>
      <input type="text" placeholder="Nombre" value={perfil.nombre} onChange={(e) => setPerfil({ ...perfil, nombre: e.target.value })} className="border p-2 w-full mb-4" />
      <input type="text" placeholder="Empresa" value={perfil.empresa} onChange={(e) => setPerfil({ ...perfil, empresa: e.target.value })} className="border p-2 w-full mb-4" />
      <button onClick={handleUpdate} className="bg-green-500 text-white px-4 py-2 rounded">
        Guardar Cambios
      </button>
    </div>
  );
}
