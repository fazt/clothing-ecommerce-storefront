import { env } from "./config/env";
import { logger } from "./lib/logger";
import { prisma } from "./lib/prisma";
import { createApp } from "./app";
import { startJobs } from "./jobs";

const app = createApp();

const server = app.listen(env.PORT, () => {
  logger.info({ port: env.PORT }, `API escuchando en http://127.0.0.1:${env.PORT}`);
});

const stopJobs = startJobs();

let shuttingDown = false;
function shutdown(signal: string) {
  if (shuttingDown) return;
  shuttingDown = true;
  logger.info({ signal }, "cerrando la API");
  stopJobs();
  server.close(() => {
    prisma
      .$disconnect()
      .catch(() => undefined)
      .finally(() => process.exit(0));
  });
  // Si alguna conexión no cierra, salir igual.
  setTimeout(() => process.exit(1), 10_000).unref();
}

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));
process.on("unhandledRejection", (reason) => {
  logger.error({ err: reason }, "promesa rechazada sin manejar");
});
