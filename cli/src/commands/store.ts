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
    .description("Muestra qué pasarelas de pago están activas en la API")
    .action(async (_opts, command: Command) => {
      const result = await clientFor(command).get<{ methods: { id: string; label: string }[] }>("/checkout/methods");
      emit(result, () =>
        keyValues(Object.fromEntries(result.methods.map((m) => [m.id, m.label] as [string, string]))),
      );
    });

  cmd
    .command("checkout <provider>")
    .description("Crea un pedido y devuelve el enlace de pago (stripe | paypal | mercadopago | simulated)")
    .option("--item <productId[:qty[:variantId]]>", "producto del carrito (repetible)", collect(toCartItem))
    .option("--coupon <code>", "cupón de descuento")
    .option("--shipping-method <id>", "método de envío (por defecto, el primero activo)")
    .requiredOption("--name <name>", "nombre de quien recibe")
    .requiredOption("--address <line1>", "dirección de entrega")
    .requiredOption("--city <city>", "ciudad")
    .option("--country <country>", "país", "Perú")
    .action(
      async (
        provider: string,
        opts: {
          item?: CartItem[];
          coupon?: string;
          shippingMethod?: string;
          name: string;
          address: string;
          city: string;
          country: string;
        },
        command: Command,
      ) => {
        const providers = ["STRIPE", "PAYPAL", "MERCADOPAGO", "SIMULATED"];
        const id = provider.toUpperCase();
        if (!providers.includes(id)) {
          throw new CliError(`Pasarela desconocida: ${provider}`, "Usa stripe, paypal, mercadopago o simulated.");
        }
        if (!opts.item?.length) throw new CliError("El carrito está vacío", "Añade productos con --item <productId>:<cantidad>.");

        const result = await clientFor(command).post<{ orderId: string; number: number; url: string }>("/checkout", {
          items: opts.item,
          provider: id,
          couponCode: opts.coupon ?? null,
          shippingMethodId: opts.shippingMethod ?? null,
          shipping: { name: opts.name, line1: opts.address, city: opts.city, country: opts.country },
        });
        emit(result, () => {
          success(`Pedido #${result.number} creado, pendiente de pago (stock reservado)`);
          console.log(`${c.dim("Paga en:")} ${result.url}`);
        });
      },
    );

  return cmd;
}
