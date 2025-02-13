import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { useRouter } from "next/router";

export default function Dashboard() {
  const [user, setUser] = useState(null);
  const router = useRouter();

  useEffect(() => {
    const getUser = async () => {
      const { data, error } = await supabase.auth.getUser();
      if (error || !data.user) {
        router.push("/auth");
      } else {
        setUser(data.user);
      }
    };

    getUser();
  }, []);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center">
      <h1 className="text-2xl font-bold">Bienvenido, {user?.email}</h1>
      <button
        onClick={async () => {
          await supabase.auth.signOut();
          router.push("/auth");
        }}
        className="mt-4 px-4 py-2 bg-red-500 text-white rounded"
      >
        Cerrar sesión
      </button>
    </div>
  );
}
