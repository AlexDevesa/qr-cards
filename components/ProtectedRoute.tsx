import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { supabase } from "../lib/supabase";

type RolePermissions = {
  root: string[];
  admin: string[];
  comercial: string[];
};

const rolePermissions: RolePermissions = {
  root: ["/admin", "/crear-empresa", "/crear-tarjeta", "/dashboard", "/perfil"],
  admin: ["/dashboard", "/configuracion_empresa", "/add_comercial", "/asignar_tarjetas", "/perfil","/user"],
  comercial: ["/perfil", "/user"],
};

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [isAllowed, setIsAllowed] = useState(false);

  useEffect(() => {
    async function checkUser() {
      const { data: authData, error: authError } = await supabase.auth.getUser();
      if (authError || !authData.user) return router.push("/login");

      const { data: usuarioData, error: usuarioError } = await supabase
        .from("usuarios")
        .select("rol")
        .eq("email", authData.user.email)
        .single();

      if (usuarioError || !usuarioData) return router.push("/login");

      const userRole: keyof RolePermissions = usuarioData.rol as keyof RolePermissions;
      const allowedRoutes = rolePermissions[userRole] || [];

      if (allowedRoutes.includes(router.pathname)) {
        setIsAllowed(true);
      } else {
        router.push("/login");
      }
    }

    checkUser();
  }, [router.pathname]);

  return isAllowed ? <>{children}</> : null;
}
