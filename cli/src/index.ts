#!/usr/bin/env node
import { readFileSync } from "node:fs";
import { Command } from "commander";
import { analyticsCommand } from "./commands/analytics.js";
import { registerAuthCommands } from "./commands/auth.js";
import { categoriesCommand } from "./commands/categories.js";
import { customersCommand } from "./commands/customers.js";
import { discountsCommand } from "./commands/discounts.js";
import { meCommand, showMe } from "./commands/me.js";
import { ordersCommand } from "./commands/orders.js";
import { productsCommand } from "./commands/products.js";
import { newsletterCommand, paymentsCommand, uploadCommand } from "./commands/store.js";
import { configCommand, healthCommand, requestCommand } from "./commands/system.js";
import { usersCommand } from "./commands/users.js";
import { ApiError, CliError } from "./errors.js";
import { c, isJsonMode, setJsonMode } from "./output.js";

// Resolves from both src/ (tsx) and dist/ (build).
const { version } = JSON.parse(readFileSync(new URL("../package.json", import.meta.url), "utf8")) as {
  version: string;
};

const program = new Command("ecom")
  .description("CLI para operar la API del ecommerce")
  .version(version, "-v, --version", "muestra la versión")
  .option("--api <url>", "URL de la API (también ECOM_API_URL; por defecto la guardada o http://localhost:4000)")
  .option("--json", "imprime la respuesta JSON de la API")
  .helpOption("-h, --help", "muestra la ayuda")
  .helpCommand("help [command]", "muestra la ayuda de un comando")
  .configureHelp({ showGlobalOptions: true })
  .showHelpAfterError()
  .hook("preAction", (_program, action) => setJsonMode(Boolean(action.optsWithGlobals().json)));

registerAuthCommands(program);
program.command("whoami").description("Muestra el usuario de la sesión actual").action(showMe);
program.addCommand(meCommand());
program.addCommand(productsCommand());
program.addCommand(categoriesCommand());
program.addCommand(ordersCommand());
program.addCommand(customersCommand());
program.addCommand(discountsCommand());
program.addCommand(usersCommand());
program.addCommand(analyticsCommand());
program.addCommand(paymentsCommand());
program.addCommand(newsletterCommand());
program.addCommand(uploadCommand());
program.addCommand(healthCommand());
program.addCommand(configCommand());
program.addCommand(requestCommand());

// addCommand() does not pass the root's help settings down to prebuilt commands.
function inheritSettings(parent: Command) {
  for (const sub of parent.commands) {
    sub.copyInheritedSettings(program);
    inheritSettings(sub);
  }
}
inheritSettings(program);

function report(error: unknown) {
  if (error instanceof ApiError) {
    if (isJsonMode()) {
      const body = error.body && typeof error.body === "object" ? error.body : { error: error.message };
      console.error(JSON.stringify({ status: error.status, ...body }, null, 2));
      return;
    }
    console.error(`${c.red("✖")} ${error.message} ${c.dim(`(HTTP ${error.status})`)}`);
    for (const detail of error.details) {
      console.error(`  ${c.dim("•")} ${detail.path ? `${detail.path}: ` : ""}${detail.message}`);
    }
    if (error.status === 401) console.error(c.dim("La sesión no es válida o expiró: usa `ecom login`."));
    if (error.status === 403) console.error(c.dim("Tu usuario no tiene permiso para esta operación (requiere ADMIN)."));
    return;
  }
  if (error instanceof CliError) {
    console.error(`${c.red("✖")} ${error.message}`);
    if (error.hint) console.error(c.dim(error.hint));
    return;
  }
  console.error(`${c.red("✖")} ${error instanceof Error ? error.message : String(error)}`);
}

try {
  await program.parseAsync();
} catch (error) {
  report(error);
  process.exitCode = 1;
}
