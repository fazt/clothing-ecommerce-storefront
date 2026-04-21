import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function Hero() {
  return (
    <section className="relative overflow-hidden">
      <div className="mx-auto grid w-full max-w-7xl items-center gap-8 px-4 py-16 sm:px-6 md:py-24 lg:grid-cols-2 lg:px-8 lg:gap-12">
        <div className="flex flex-col gap-6">
          <span className="inline-flex w-fit items-center rounded-full bg-foreground/5 px-3 py-1 text-xs font-medium">
            Nueva colección · Primavera 2026
          </span>
          <h1 className="text-4xl font-bold tracking-tight text-balance sm:text-5xl md:text-6xl">
            Vístete de esencia,{" "}
            <span className="italic font-serif">simple</span> y atemporal.
          </h1>
          <p className="max-w-lg text-base text-muted-foreground md:text-lg">
            Prendas pensadas para quedarse en tu armario. Diseños limpios,
            materiales nobles y confección con detalles que marcan la
            diferencia.
          </p>
          <div className="mt-2 flex flex-wrap gap-3">
            <Link
              href="/products"
              className={cn(buttonVariants({ size: "lg" }))}
            >
              Explorar colección
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
            <Link
              href="/products"
              className={cn(buttonVariants({ size: "lg", variant: "outline" }))}
            >
              Ver ofertas
            </Link>
          </div>
          <div className="mt-4 flex items-center gap-6 text-xs text-muted-foreground">
            <span>Envío gratis desde $80</span>
            <span className="h-3 w-px bg-border" />
            <span>Devoluciones gratuitas</span>
            <span className="h-3 w-px bg-border" />
            <span>Pago en 3 cuotas</span>
          </div>
        </div>
        <div className="relative aspect-[4/5] w-full overflow-hidden rounded-2xl bg-muted">
          <Image
            src="https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=1200&auto=format&fit=crop&q=80"
            alt="Colección primavera"
            fill
            priority
            className="object-cover"
            sizes="(max-width: 1024px) 100vw, 50vw"
          />
        </div>
      </div>
    </section>
  );
}
