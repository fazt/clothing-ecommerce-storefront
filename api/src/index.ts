import "dotenv/config";
import express, { NextFunction, Request, Response } from "express";
import multer from "multer";
import cors from "cors";
import cookieParser from "cookie-parser";
import morgan from "morgan";
import router from "./routes";

const app = express();
const PORT = process.env.PORT || 3000;

// The browser calls the API directly with credentials (auth cookie), so CORS
// must name the allowed web origins explicitly.
const allowedOrigins = (process.env.CORS_ORIGINS ?? "http://localhost:3000")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(cors({ origin: allowedOrigins, credentials: true }));
app.use(morgan("dev"));
app.use(cookieParser());
// Stripe signs the exact bytes it sends, so its webhook keeps a raw body.
// express.json() below skips requests whose body is already parsed.
app.use("/api/payments/stripe/webhook", express.raw({ type: "application/json" }));
app.use(express.json());

app.get("/", (_req, res) => {
  res.json({ message: "Ecommerce API running" });
});

app.use("/api", router);

// Turn body-parser and multer failures into JSON instead of Express's HTML page.
app.use((err: unknown, _req: Request, res: Response, next: NextFunction) => {
  if (res.headersSent) return next(err);
  if (err instanceof multer.MulterError) {
    const status = err.code === "LIMIT_FILE_SIZE" ? 413 : 400;
    return res.status(status).json({ error: err.message, code: err.code });
  }
  if ((err as { type?: string }).type === "entity.parse.failed") {
    return res.status(400).json({ error: "JSON inválido" });
  }
  console.error("[api] unhandled error", err);
  return res.status(500).json({ error: "Internal server error" });
});

app.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
});
