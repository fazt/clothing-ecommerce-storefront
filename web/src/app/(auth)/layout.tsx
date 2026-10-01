import Link from "next/link";
import { shopFontVariables } from "@/lib/fonts";
import "../(store)/editorial.css";
import "./auth.css";

export default function AuthLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div
      className={`shop-theme min-h-screen flex flex-col ${shopFontVariables}`}
    >
      <header className="border-b" style={{ borderColor: "var(--border)" }}>
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-5 sm:px-6 lg:px-8">
          <Link href="/" className="font-integral text-[22px]">
            ATELIER
          </Link>
          <Link
            href="/"
            className="text-[13px] underline-offset-4 hover:underline"
            style={{ color: "var(--ink-soft)" }}
          >
            ← Volver a la tienda
          </Link>
        </div>
      </header>

      <div className="flex-1 grid lg:grid-cols-2">
        <aside
          className="relative hidden overflow-hidden lg:flex lg:flex-col lg:justify-between lg:p-12 xl:p-16"
          style={{ backgroundColor: "var(--bg-soft)" }}
        >
          <Star className="absolute -top-14 -right-10 h-64 w-64 opacity-10" />
          <Star className="absolute bottom-10 -left-6 h-40 w-40 opacity-15" />
          <div className="relative z-10">
            <p
              className="text-[11px] uppercase tracking-[0.25em]"
              style={{ color: "var(--ink-soft)" }}
            >
              Atelier · SS26 Collection
            </p>
            <h2 className="font-integral mt-8 text-[48px] leading-[0.95] xl:text-[64px]">
              Dress
              <br />
              like you
              <br />
              mean it.
            </h2>
            <p
              className="mt-6 max-w-sm text-[15px] leading-relaxed"
              style={{ color: "var(--ink-soft)" }}
            >
              Diseños pensados para durar, confeccionados con cuidado. Únete
              para guardar tus favoritos, seguir tus pedidos y descubrir drops
              antes que nadie.
            </p>
          </div>
          <div className="relative z-10 mt-10 flex gap-10">
            <Stat value="200+" label="Marcas" />
            <div
              className="h-12 w-px"
              style={{ backgroundColor: "var(--border)" }}
            />
            <Stat value="30k+" label="Clientes" />
            <div
              className="h-12 w-px"
              style={{ backgroundColor: "var(--border)" }}
            />
            <Stat value="2k+" label="Productos" />
          </div>
        </aside>

        <main className="flex items-center justify-center p-6 sm:p-10 lg:p-16">
          <div className="w-full max-w-md">{children}</div>
        </main>
      </div>
    </div>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div>
      <p className="font-bold text-[26px] leading-none">{value}</p>
      <p
        className="mt-1 text-[12px]"
        style={{ color: "var(--ink-soft)" }}
      >
        {label}
      </p>
    </div>
  );
}

function Star({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 100 100"
      fill="none"
      aria-hidden
    >
      <path
        d="M50 0L60 40L100 50L60 60L50 100L40 60L0 50L40 40L50 0Z"
        fill="var(--ink)"
      />
    </svg>
  );
}
