import Turnstile from "react-turnstile";

const turnstileSiteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY!;

export default function Captcha({ onVerify }: { onVerify: (token: string) => void }) {
  return (
    <div className="mt-3 flex justify-center">
      {turnstileSiteKey ? (
        <Turnstile sitekey={turnstileSiteKey} onVerify={onVerify} />
      ) : (
        <p className="text-red-500 text-sm">Error al cargar el CAPTCHA</p>
      )}
    </div>
  );
}
