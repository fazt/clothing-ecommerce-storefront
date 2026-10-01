import { Command } from "commander";
import type { Paginated } from "../client.js";
import { config } from "../config.js";
import { clientFor } from "../context.js";
import { CliError } from "../errors.js";
import { emit, keyValues, pageFooter, success, table } from "../output.js";
import { toInt } from "../parsers.js";
import { askHidden } from "../prompt.js";
import { orderColumns, type Order } from "./orders.js";

interface Me extends Record<string, unknown> {
  id: string;
  email: string;
  role: string;
}

function signedClient(command: Command) {
  const api = clientFor(command);
  if (!api.isAuthenticated) {
    throw new CliError(`No hay sesión para ${api.baseUrl}`, "Inicia sesión con `ecom login`.");
  }
  return api;
}

export async function showMe(_opts: unknown, command: Command) {
  const me = await signedClient(command).get<Me>("/me");
  emit(me, () => keyValues(me));
}

export function meCommand(): Command {
  const cmd = new Command("me").description("Tu cuenta: perfil, contraseña y pedidos");

  cmd.command("show", { isDefault: true }).description("Muestra tu perfil").action(showMe);

  cmd
    .command("update")
    .description("Actualiza tu perfil")
    .option("--name <name>", 'nombre ("" lo quita)')
    .option("--email <email>", "nuevo email (pide la contraseña actual)")
    .option("--avatar <url>", 'URL del avatar ("" lo quita)')
    .option("--current-password <password>", "contraseña actual (requerida al cambiar el email)")
    .action(
      async (
        opts: { name?: string; email?: string; avatar?: string; currentPassword?: string },
        command: Command,
      ) => {
        const api = signedClient(command);
        const body: Record<string, unknown> = {};
        if (opts.name !== undefined) body.name = opts.name;
        if (opts.avatar !== undefined) body.avatarUrl = opts.avatar;
        if (opts.email !== undefined) {
          body.email = opts.email;
          body.currentPassword =
            opts.currentPassword ?? (await askHidden("Contraseña actual: ", "Usa --current-password."));
        }
        if (!Object.keys(body).length) {
          throw new CliError("Nada que actualizar", "Usa --name, --email o --avatar.");
        }
        const me = await api.patch<Me>("/me", body);
        // Keep the saved session label in sync with the new email.
        const session = config.session(api.baseUrl);
        if (session) config.saveSession(api.baseUrl, { ...session, email: me.email });
        emit(me, () => success(`Perfil actualizado: ${me.email}`));
      },
    );

  cmd
    .command("password")
    .description("Cambia tu contraseña")
    .option("--current <password>", "contraseña actual")
    .option("--new <password>", "nueva contraseña (mín. 6)")
    .action(async (opts: { current?: string; new?: string }, command: Command) => {
      const api = signedClient(command);
      const currentPassword = opts.current ?? (await askHidden("Contraseña actual: ", "Usa --current."));
      let newPassword = opts.new;
      if (newPassword === undefined) {
        newPassword = await askHidden("Nueva contraseña: ", "Usa --new.");
        if ((await askHidden("Repite la nueva contraseña: ")) !== newPassword) {
          throw new CliError("Las contraseñas no coinciden");
        }
      }
      const result = await api.put("/me/password", { currentPassword, newPassword });
      emit(result ?? { ok: true }, () => success("Contraseña actualizada"));
    });

  cmd
    .command("orders")
    .description("Lista tus pedidos")
    .option("-p, --page <n>", "página", toInt, 1)
    .option("-n, --page-size <n>", "resultados por página (máx. 100)", toInt, 20)
    .action(async (opts: { page: number; pageSize: number }, command: Command) => {
      const result = await signedClient(command).get<Paginated<Order>>("/me/orders", {
        page: opts.page,
        pageSize: opts.pageSize,
      });
      emit(result, () => {
        table(result.data, orderColumns);
        pageFooter(result);
      });
    });

  return cmd;
}
