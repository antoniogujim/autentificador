import Link from "next/link";

export default function Home() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-6 bg-zinc-50 px-6 text-center dark:bg-black">
      <h1 className="text-4xl font-semibold tracking-tight text-black dark:text-zinc-50">
        Autentificador
      </h1>
      <p className="max-w-md text-lg text-zinc-600 dark:text-zinc-400">
        Demo de autenticación con NextAuth.js. Inicia sesión para acceder a
        tu área privada.
      </p>
      <Link
        href="/login"
        className="flex h-12 items-center justify-center gap-2 rounded-full bg-foreground px-6 text-sm font-medium text-background transition-colors hover:bg-[#383838] dark:hover:bg-[#ccc]"
      >
        Iniciar sesión
      </Link>
    </div>
  );
}
