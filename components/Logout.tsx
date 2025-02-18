import { supabase } from "../lib/supabase";
import { useRouter } from "next/router";

export default function Logout() {
  const router = useRouter();

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/login");
  }

  return (
    <button className="bg-red-500 text-white px-4 py-2 rounded fixed top-4 right-4" onClick={handleLogout}>
      Logout
    </button>
  );
}
