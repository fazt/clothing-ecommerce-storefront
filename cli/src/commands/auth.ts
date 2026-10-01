import type { Command } from "commander";
import { ApiClient } from "../client.js";
import { config } from "../config.js";
import { apiUrlFor } from "../context.js";
import { ApiError, CliError } from "../errors.js";
import { c, emit, success } from "../output.js";
import { ask, askHidden } from "../prompt.js";

export function registerAuthCommands(program: Command) {
  program
    .command("login")
    .description("Inicia sesión y guarda el token para la API seleccionada")
    .option("-e, --email <email>", "email (si se omite, se pregunta)")
    .option("-p, --password <password>", "contraseña (también ECOM_PASSWORD; si se omite, se pide sin eco)")
    .action(async (opts: { email?: string; password?: string }, command: Command) => {
      const apiUrl = apiUrlFor(command);
      const email = opts.email ?? (await ask("Email: ", "Usa --email."));
      const password =
        opts.password ?? process.env.ECOM_PASSWORD ?? (await askHidden("Contraseña: ", "Usa --password o ECOM_PASSWORD."));
      try {
        const { user, token } = await new ApiClient(apiUrl).authenticate("/auth/login", { email, password });
        config.saveSession(apiUrl, { token, email: user.email, role: user.role });
        emit({ user, apiUrl }, () => success(`Sesión iniciada como ${user.email} (${user.role}) en ${apiUrl}`));
      } catch (error) {
        // A 401 here means wrong credentials, not an expired session.
        if (error instanceof ApiError && error.status === 401) throw new CliError(error.message);
        throw error;
      }
    });

  program
    .command("register")
    .description("Crea una cuenta de cliente e inicia sesión con ella")
    .option("-e, --email <email>", "email")
    .option("-p, --password <password>", "contraseña (mín. 6)")
    .option("--name <name>", "nombre")
    .action(async (opts: { email?: string; password?: string; name?: string }, command: Command) => {
      const apiUrl = apiUrlFor(command);
      const email = opts.email ?? (await ask("Email: ", "Usa --email."));
      const password = opts.password ?? (await askHidden("Contraseña: ", "Usa --password."));
      const { user, token } = await new ApiClient(apiUrl).authenticate("/auth/register", {
        email,
        password,
        name: opts.name,
      });
      config.saveSession(apiUrl, { token, email: user.email, role: user.role });
      emit({ user, apiUrl }, () => success(`Cuenta creada: ${user.email} ${c.dim(user.id)}`));
    });

  program
    .command("logout")
    .description("Borra el token guardado para la API seleccionada")
    .action((_opts, command: Command) => {
      const apiUrl = apiUrlFor(command);
      const removed = config.clearSession(apiUrl);
      emit({ ok: removed, apiUrl }, () =>
        removed ? success(`Sesión cerrada en ${apiUrl}`) : console.log(c.dim(`No había sesión en ${apiUrl}.`)),
      );
    });

  program
    .command("forgot-password <email>")
    .description("Envía el email de recuperación de contraseña")
    .action(async (email: string, _opts, command: Command) => {
      const result = await new ApiClient(apiUrlFor(command)).post("/auth/forgot-password", { email });
      // The API always answers ok so it does not reveal which emails exist.
      emit(result, () => success(`Si ${email} tiene cuenta, recibirá un email para restablecer la contraseña.`));
    });

  program
    .command("reset-password <token>")
    .description("Restablece la contraseña con el token recibido por email")
    .option("-p, --password <password>", "nueva contraseña (si se omite, se pide sin eco)")
    .action(async (token: string, opts: { password?: string }, command: Command) => {
      const password = opts.password ?? (await askHidden("Nueva contraseña: ", "Usa --password."));
      const result = await new ApiClient(apiUrlFor(command)).post("/auth/reset-password", { token, password });
      emit(result, () => success("Contraseña restablecida. Ya puedes usar `ecom login`."));
    });
}
