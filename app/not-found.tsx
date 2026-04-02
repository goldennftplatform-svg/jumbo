import Link from "next/link";

export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col items-center justify-center px-4 py-10 text-center">
      <p className="font-display-pc text-5xl tracking-[0.2em] text-comrade-red drop-shadow-[0_0_20px_rgba(196,30,58,0.5)]">
        404
      </p>
      <p className="mt-3 text-comrade-crust">Nothing here, comrade.</p>
      <Link
        href="/"
        className="font-display-pc mt-8 text-sm tracking-wider text-comrade-gold underline decoration-comrade-gold/40 underline-offset-4 hover:text-comrade-cheese"
      >
        ← Back to Upsizer
      </Link>
    </main>
  );
}
