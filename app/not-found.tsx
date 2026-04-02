import Link from "next/link";

export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col items-center justify-center px-5 text-center">
      <p className="font-display-pc text-3xl text-zinc-300">404</p>
      <p className="mt-2 text-sm text-zinc-500">Page not found.</p>
      <Link href="/" className="mt-6 text-sm text-comrade-red hover:underline">
        Home
      </Link>
    </main>
  );
}
