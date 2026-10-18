import Link from "next/link";

export const metadata = { title: "Página no encontrada — Atelier" };

export default function NotFound() {
  return (
    <main className="flex min-h-[70vh] flex-col items-center justify-center gap-4 px-4 text-center">
      <p className="text-sm font-medium uppercase tracking-widest text-muted-foreground">Error 404</p>
      <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">No encontramos esta página</h1>
      <p className="max-w-md text-sm text-muted-foreground">
        Puede que el enlace esté roto o que la prenda ya no esté disponible.
      </p>
      <div className="mt-2 flex flex-wrap justify-center gap-2">
        <Link href="/" className="rounded-full bg-foreground px-5 py-2 text-sm font-medium text-background">
          Ir al inicio
        </Link>
        <Link href="/products" className="rounded-full border px-5 py-2 text-sm font-medium">
          Ver la tienda
        </Link>
      </div>
    </main>
  );
}
