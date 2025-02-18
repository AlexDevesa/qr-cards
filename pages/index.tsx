import Link from 'next/link';
import DarkContainer from '../components/DarkContainer';

export default function Home() {
  return (
    <DarkContainer>
      <div className="flex flex-col items-center justify-center text-center min-h-screen">
        <h1 className="text-4xl font-bold mb-4">Tarjetas NFC y QR</h1>
        <p className="text-lg text-gray-300">Gestiona tu tarjeta de presentación digital.</p>
        <Link href="/login">
          <button className="bg-blue-500 text-white px-6 py-3 rounded mt-6 hover:bg-blue-600 transition">
            Iniciar sesión
          </button>
        </Link>
      </div>
    </DarkContainer>
  );
}
