"use client";

import Link from "next/link";

export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main className="flex min-h-[70vh] flex-col items-center justify-center gap-4 px-4 text-center">
      <p className="text-sm font-medium uppercase tracking-widest text-muted-foreground">Algo salió mal</p>
      <h1 className="text-3xl font-semibold tracking-tight">No pudimos cargar esta página</h1>
      <p className="max-w-md text-sm text-muted-foreground">
        Es un problema temporal de nuestro lado. Inténtalo de nuevo en unos segundos.
      </p>
      <div className="mt-2 flex flex-wrap justify-center gap-2">
        <button
          type="button"
          onClick={reset}
          className="rounded-full bg-foreground px-5 py-2 text-sm font-medium text-background"
        >
          Reintentar
        </button>
        <Link href="/" className="rounded-full border px-5 py-2 text-sm font-medium">
          Ir al inicio
        </Link>
      </div>
    </main>
  );
}
