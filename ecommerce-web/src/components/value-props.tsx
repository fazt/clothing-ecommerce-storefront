import { Truck, RotateCcw, Shield, Heart } from "lucide-react";

const items = [
  {
    icon: Truck,
    title: "Envío gratis",
    desc: "En pedidos superiores a $80",
  },
  {
    icon: RotateCcw,
    title: "Devoluciones fáciles",
    desc: "30 días para cambios y devoluciones",
  },
  {
    icon: Shield,
    title: "Pago seguro",
    desc: "Tus datos siempre protegidos",
  },
  {
    icon: Heart,
    title: "Moda responsable",
    desc: "Materiales éticos y sostenibles",
  },
];

export function ValueProps() {
  return (
    <section className="border-y bg-muted/30">
      <div className="mx-auto grid w-full max-w-7xl grid-cols-2 gap-6 px-4 py-10 sm:px-6 md:grid-cols-4 lg:px-8">
        {items.map(({ icon: Icon, title, desc }) => (
          <div key={title} className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-background">
              <Icon className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-semibold">{title}</p>
              <p className="text-xs text-muted-foreground">{desc}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
