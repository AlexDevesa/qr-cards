import { useState } from "react";
import { supabase } from "../lib/supabase";
import { useRouter } from "next/router";

export default function Registro() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [nombre, setNombre] = useState("");
  const [empresaId, setEmpresaId] = useState(""); // Para admin y comerciales
  const [rol, setRol] = useState("comercial"); // Por defecto, es comercial
  const [errorMessage, setErrorMessage] = useState("");

  async function handleRegister() {
    setErrorMessage("");

    if (!email || !password || !nombre) {
      setErrorMessage("Todos los campos son obligatorios.");
      return;
    }

    // 🔹 Registrar en Supabase Auth
    const { data: authUser, error: authError } = await supabase.auth.signUp({
      email,
      password,
    });

    if (authError) {
      setErrorMessage("Error en el registro.");
      return;
    }

    // 🔹 Insertar usuario en la base de datos
    const { error: userError } = await supabase.from("usuarios").insert([
      { email, nombre, empresa_id: empresaId || null, rol, activo: true },
    ]);

    if (userError) {
      setErrorMessage("Error al guardar el usuario en la base de datos.");
      return;
    }

    alert("Usuario registrado correctamente.");
    router.push("/dashboard");
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold">Registro de Usuarios</h1>
      {errorMessage && <p className="text-red-500">{errorMessage}</p>}

      <input className="border p-2 w-full my-2" placeholder="Nombre" onChange={(e) => setNombre(e.target.value)} />
      <input className="border p-2 w-full my-2" placeholder="Email" onChange={(e) => setEmail(e.target.value)} />
      <input className="border p-2 w-full my-2" type="password" placeholder="Contraseña" onChange={(e) => setPassword(e.target.value)} />

      <select className="border p-2 w-full my-2" onChange={(e) => setRol(e.target.value)}>
        <option value="comercial">Comercial</option>
        <option value="admin">Administrador</option>
      </select>

      {rol === "admin" && (
        <input className="border p-2 w-full my-2" placeholder="ID de Empresa" onChange={(e) => setEmpresaId(e.target.value)} />
      )}

      <button className="bg-green-500 text-white px-4 py-2 rounded" onClick={handleRegister}>
        Registrar Usuario
      </button>
    </div>
  );
}
