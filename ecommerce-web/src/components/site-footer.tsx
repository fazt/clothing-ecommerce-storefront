import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="mt-20 border-t bg-muted/30">
      <div className="mx-auto grid w-full max-w-7xl gap-10 px-4 py-12 sm:px-6 lg:px-8 md:grid-cols-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight">ATELIER</h2>
          <p className="mt-3 text-sm text-muted-foreground">
            Ropa contemporánea, diseñada para durar. Fabricada con materiales
            responsables.
          </p>
        </div>

        <FooterColumn
          title="Comprar"
          links={[
            { label: "Mujer", href: "/products" },
            { label: "Hombre", href: "/products" },
            { label: "Accesorios", href: "/products" },
            { label: "Novedades", href: "/products" },
            { label: "Ofertas", href: "/products" },
          ]}
        />

        <FooterColumn
          title="Ayuda"
          links={[
            { label: "Envíos", href: "#" },
            { label: "Devoluciones", href: "#" },
            { label: "Guía de tallas", href: "#" },
            { label: "Contacto", href: "#" },
            { label: "FAQ", href: "#" },
          ]}
        />

        <FooterColumn
          title="Empresa"
          links={[
            { label: "Nosotros", href: "#" },
            { label: "Sostenibilidad", href: "#" },
            { label: "Tiendas", href: "#" },
            { label: "Trabaja con nosotros", href: "#" },
          ]}
        />
      </div>

      <div className="border-t">
        <div className="mx-auto flex w-full max-w-7xl flex-col items-center justify-between gap-3 px-4 py-6 text-xs text-muted-foreground sm:flex-row sm:px-6 lg:px-8">
          <p>© {new Date().getFullYear()} Atelier. Todos los derechos reservados.</p>
          <div className="flex gap-4">
            <Link href="#" className="hover:text-foreground">
              Privacidad
            </Link>
            <Link href="#" className="hover:text-foreground">
              Términos
            </Link>
            <Link href="#" className="hover:text-foreground">
              Cookies
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

function FooterColumn({
  title,
  links,
}: {
  title: string;
  links: { label: string; href: string }[];
}) {
  return (
    <div>
      <h3 className="text-sm font-semibold">{title}</h3>
      <ul className="mt-3 space-y-2">
        {links.map((l) => (
          <li key={l.label}>
            <Link
              href={l.href}
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              {l.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
