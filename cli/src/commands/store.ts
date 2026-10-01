import { Command, Option } from "commander";
import { clientFor } from "../context.js";
import { CliError } from "../errors.js";
import { c, emit, keyValues, success } from "../output.js";
import { collect, toCartItem, type CartItem } from "../parsers.js";

export function newsletterCommand(): Command {
  const cmd = new Command("newsletter").description("Suscripciones al newsletter");
  cmd
    .command("subscribe <email>")
    .description("Suscribe un email al newsletter")
    .action(async (email: string, _opts, command: Command) => {
      const result = await clientFor(command).post<{ email: string }>("/newsletter", { email });
      emit(result, () => success(`Suscrito: ${result.email}`));
    });
  return cmd;
}

export function uploadCommand(): Command {
  return new Command("upload")
    .description("Sube una imagen (máx. 5 MB) al storage y devuelve su URL pública")
    .argument("<file>", "ruta de la imagen (jpg, png, webp, avif, gif)")
    .addOption(
      new Option("--folder <folder>", "carpeta de destino")
        .choices(["products", "categories", "avatars"])
        .default("products"),
    )
    .action(async (file: string, opts: { folder: string }, command: Command) => {
      const result = await clientFor(command).upload<{ key: string; publicUrl: string }>(file, opts.folder);
      emit(result, () => success(`Subida: ${result.publicUrl}`));
    });
}

export function paymentsCommand(): Command {
  const cmd = new Command("payments").description("Métodos de pago y checkout");

  cmd
    .command("methods")
    .description("Muestra qué pasarelas de pago están configuradas")
    .action(async (_opts, command: Command) => {
      const methods = await clientFor(command).get<{ paypal: boolean; stripe: boolean }>("/payments/methods");
      emit(methods, () => keyValues({ PayPal: methods.paypal, Stripe: methods.stripe }));
    });

  cmd
    .command("checkout <provider>")
    .description("Crea un pedido y devuelve el enlace de pago (stripe | paypal)")
    .option("--item <productId[:qty[:variantId]]>", "producto del carrito (repetible)", collect(toCartItem))
    .action(async (provider: string, opts: { item?: CartItem[] }, command: Command) => {
      const paths: Record<string, string> = { stripe: "/payments/stripe/sessions", paypal: "/payments/paypal/orders" };
      const path = paths[provider.toLowerCase()];
      if (!path) throw new CliError(`Pasarela desconocida: ${provider}`, "Usa stripe o paypal.");
      if (!opts.item?.length) throw new CliError("El carrito está vacío", "Añade productos con --item <productId>:<cantidad>.");

      const result = await clientFor(command).post<{ orderId: string; url?: string; approveUrl?: string }>(path, {
        items: opts.item,
      });
      emit(result, () => {
        success(`Pedido ${result.orderId} creado, pendiente de pago`);
        console.log(`${c.dim("Paga en:")} ${result.url ?? result.approveUrl}`);
      });
    });

  return cmd;
}
