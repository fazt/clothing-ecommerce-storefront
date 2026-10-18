import express, { NextFunction, Request, Response } from "express";
import multer from "multer";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import pinoHttp from "pino-http";
import { allowedOrigins, env } from "./config/env";
import { logger, pathOnly } from "./lib/logger";
import { prisma } from "./lib/prisma";
import { apiLimiter } from "./lib/rate-limit";
import router from "./routes";
import { webhookRoutes } from "./modules/payments";
import { UPLOADS_DIR } from "./lib/uploads";

export function createApp() {
  const app = express();
  app.disable("x-powered-by");
  if (env.TRUST_PROXY > 0) app.set("trust proxy", env.TRUST_PROXY);

  app.use(
    helmet({
      // La API solo sirve JSON e imágenes subidas; las imágenes se muestran desde la web.
      crossOriginResourcePolicy: { policy: "cross-origin" },
    }),
  );
  // El navegador llama a la API con credenciales (cookie de sesión): CORS con orígenes explícitos.
  app.use(cors({ origin: allowedOrigins, credentials: true }));
  app.use(
    pinoHttp({
      logger,
      // Sin query string: tokens de reset, `code` de OAuth o `session_id` no llegan a los logs.
      serializers: {
        req: (req: { method: string; url: string; id: unknown }) => ({
          id: req.id,
          method: req.method,
          url: pathOnly(req.url),
        }),
      },
      autoLogging: { ignore: (req) => pathOnly(req.url) === "/api/health" },
    }),
  );
  app.use(cookieParser());

  // Webhooks de pago: firma calculada sobre los bytes exactos → cuerpo crudo y ANTES de express.json().
  app.use("/api/webhooks", express.raw({ type: "*/*", limit: "1mb" }), webhookRoutes);

  app.use(express.json({ limit: "1mb" }));

  app.get("/api/health", async (_req, res) => {
    try {
      await prisma.$queryRaw`SELECT 1`;
      res.json({ status: "ok", db: "ok", uptime: Math.round(process.uptime()) });
    } catch {
      res.status(503).json({ status: "error", db: "unreachable" });
    }
  });

  // Imágenes subidas con el driver local (STORAGE_DRIVER=local).
  app.use(
    "/uploads",
    express.static(UPLOADS_DIR, { maxAge: "7d", index: false, dotfiles: "deny", fallthrough: false }),
  );

  app.get("/", (_req, res) => {
    res.json({ message: "Atelier API", docs: "/api/health" });
  });

  app.use("/api", apiLimiter, router);

  app.use((_req, res) => {
    res.status(404).json({ error: "Ruta no encontrada", code: "NOT_FOUND" });
  });

  // Errores de body-parser, multer y el resto → JSON en vez de la página HTML de Express.
  app.use((err: unknown, req: Request, res: Response, next: NextFunction) => {
    if (res.headersSent) return next(err);
    if (err instanceof multer.MulterError) {
      const status = err.code === "LIMIT_FILE_SIZE" ? 413 : 400;
      return res.status(status).json({ error: err.message, code: err.code });
    }
    const typed = err as { type?: string; status?: number; statusCode?: number };
    if (typed.type === "entity.parse.failed") {
      return res.status(400).json({ error: "JSON inválido" });
    }
    if (typed.type === "entity.too.large") {
      return res.status(413).json({ error: "Cuerpo demasiado grande" });
    }
    const status = typed.status ?? typed.statusCode;
    if (status === 404) return res.status(404).json({ error: "No encontrado", code: "NOT_FOUND" });
    req.log?.error({ err }, "error no controlado");
    return res.status(500).json({ error: "Internal server error" });
  });

  return app;
}
