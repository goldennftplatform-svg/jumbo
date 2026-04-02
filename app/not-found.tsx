import Link from "next/link";

export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col items-center justify-center px-4 py-10 text-center">
      <p className="font-display text-4xl tracking-widest text-comrade-red">404</p>
      <p className="mt-2 text-comrade-crust">Nothing here, comrade.</p>
      <Link
        href="/"
        className="mt-8 text-sm text-comrade-red underline decoration-comrade-red/50 underline-offset-4 hover:text-comrade-cheese"
      >
        ← Back to Upsizer
      </Link>
    </main>
  );
}
