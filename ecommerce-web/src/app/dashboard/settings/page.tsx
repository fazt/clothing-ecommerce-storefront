import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PageHeader } from "@/components/dashboard/page-header";
import { Separator } from "@/components/ui/separator";

export default function DashboardSettingsPage() {
  return (
    <div className="mx-auto w-full max-w-5xl">
      <PageHeader
        title="Ajustes"
        description="Configura tu tienda, pagos, envíos y equipo."
      />

      <Tabs defaultValue="general" className="w-full">
        <TabsList className="w-full justify-start gap-1 rounded-none border-b bg-transparent p-0">
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="payments">Pagos</TabsTrigger>
          <TabsTrigger value="shipping">Envíos</TabsTrigger>
          <TabsTrigger value="taxes">Impuestos</TabsTrigger>
          <TabsTrigger value="team">Equipo</TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="mt-6 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Información de la tienda</CardTitle>
              <CardDescription>
                Datos públicos que verán tus clientes.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="store-name">Nombre de la tienda</Label>
                <Input id="store-name" defaultValue="Atelier" />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="store-email">Email de contacto</Label>
                <Input
                  id="store-email"
                  type="email"
                  defaultValue="hola@atelier.com"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="store-desc">Descripción</Label>
                <Textarea
                  id="store-desc"
                  rows={3}
                  defaultValue="Ropa contemporánea, diseñada para durar."
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Moneda y región</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-2 md:grid-cols-2 md:gap-4">
                <div className="grid gap-2">
                  <Label>Moneda</Label>
                  <select className="h-8 rounded-md border bg-background px-3 text-sm">
                    <option>USD · Dólar</option>
                    <option>EUR · Euro</option>
                    <option>MXN · Peso mexicano</option>
                    <option>ARS · Peso argentino</option>
                  </select>
                </div>
                <div className="grid gap-2">
                  <Label>Zona horaria</Label>
                  <select className="h-8 rounded-md border bg-background px-3 text-sm">
                    <option>Europe/Madrid</option>
                    <option>America/Mexico_City</option>
                    <option>America/Argentina/Buenos_Aires</option>
                  </select>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end gap-2">
            <Button variant="outline">Cancelar</Button>
            <Button>Guardar cambios</Button>
          </div>
        </TabsContent>

        <TabsContent value="payments" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Pasarelas de pago</CardTitle>
              <CardDescription>
                Métodos disponibles en el checkout.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Gateway name="Stripe" desc="Tarjetas · Apple Pay · Google Pay" active />
              <Gateway name="PayPal" desc="Cuenta PayPal y tarjetas" active />
              <Gateway name="Mercado Pago" desc="LATAM · cuotas" />
              <Gateway name="Transferencia" desc="Pago manual por transferencia" />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="shipping" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Zonas de envío</CardTitle>
              <CardDescription>
                Tarifas según la dirección de entrega.
              </CardDescription>
            </CardHeader>
            <CardContent className="divide-y">
              <ShipRow zone="España península" rate="$5.99" time="2–4 días" />
              <ShipRow zone="Europa" rate="$12.99" time="4–7 días" />
              <ShipRow zone="Latinoamérica" rate="$19.99" time="7–14 días" />
              <ShipRow zone="Resto del mundo" rate="$29.99" time="10–20 días" />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="taxes" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Impuestos</CardTitle>
              <CardDescription>Configura IVA por región.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-2 md:grid-cols-3">
                <div className="grid gap-2">
                  <Label>España</Label>
                  <Input defaultValue="21%" />
                </div>
                <div className="grid gap-2">
                  <Label>México</Label>
                  <Input defaultValue="16%" />
                </div>
                <div className="grid gap-2">
                  <Label>Argentina</Label>
                  <Input defaultValue="21%" />
                </div>
              </div>
              <Separator />
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" className="h-4 w-4 rounded border" defaultChecked />
                Incluir impuestos en el precio mostrado
              </label>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="team" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Equipo</CardTitle>
              <CardDescription>
                Usuarios con acceso al panel.
              </CardDescription>
            </CardHeader>
            <CardContent className="divide-y">
              <TeamRow name="Fazt" email="fazt@faztweb.com" role="Administrador" />
              <TeamRow name="María López" email="maria@atelier.com" role="Editor" />
              <TeamRow
                name="Juan Pérez"
                email="juan@atelier.com"
                role="Operaciones"
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function Gateway({
  name,
  desc,
  active,
}: {
  name: string;
  desc: string;
  active?: boolean;
}) {
  return (
    <div className="flex items-center justify-between rounded-md border p-3">
      <div>
        <p className="text-sm font-semibold">{name}</p>
        <p className="text-xs text-muted-foreground">{desc}</p>
      </div>
      <Button variant={active ? "outline" : "default"} size="sm">
        {active ? "Configurar" : "Activar"}
      </Button>
    </div>
  );
}

function ShipRow({
  zone,
  rate,
  time,
}: {
  zone: string;
  rate: string;
  time: string;
}) {
  return (
    <div className="flex items-center justify-between py-3">
      <div>
        <p className="text-sm font-medium">{zone}</p>
        <p className="text-xs text-muted-foreground">{time}</p>
      </div>
      <div className="flex items-center gap-3">
        <span className="font-semibold">{rate}</span>
        <Button variant="ghost" size="sm">
          Editar
        </Button>
      </div>
    </div>
  );
}

function TeamRow({
  name,
  email,
  role,
}: {
  name: string;
  email: string;
  role: string;
}) {
  return (
    <div className="flex items-center justify-between py-3">
      <div>
        <p className="text-sm font-medium">{name}</p>
        <p className="text-xs text-muted-foreground">{email}</p>
      </div>
      <div className="flex items-center gap-3">
        <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium">
          {role}
        </span>
        <Button variant="ghost" size="sm">
          Editar
        </Button>
      </div>
    </div>
  );
}
