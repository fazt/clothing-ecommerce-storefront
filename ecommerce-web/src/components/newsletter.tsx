import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function Newsletter() {
  return (
    <section className="mx-auto w-full max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
      <div className="rounded-2xl bg-foreground px-6 py-12 text-background sm:px-12 sm:py-16">
        <div className="mx-auto flex max-w-2xl flex-col items-center gap-4 text-center">
          <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
            Únete al club Atelier
          </h2>
          <p className="text-sm opacity-80 sm:text-base">
            Recibe 10% de descuento en tu primera compra y accede antes que
            nadie a nuevas colecciones y ofertas exclusivas.
          </p>
          <form className="mt-2 flex w-full max-w-md flex-col gap-2 sm:flex-row">
            <Input
              type="email"
              placeholder="tu@email.com"
              className="bg-background text-foreground"
            />
            <Button variant="secondary" type="submit">
              Suscribirme
            </Button>
          </form>
          <p className="text-xs opacity-60">
            Al suscribirte aceptas nuestra política de privacidad.
          </p>
        </div>
      </div>
    </section>
  );
}
