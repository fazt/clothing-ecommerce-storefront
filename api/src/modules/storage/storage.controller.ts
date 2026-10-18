import crypto from "crypto";
import fs from "node:fs/promises";
import path from "path";
import { Request, Response } from "express";
import { putObject, StorageNotConfiguredError } from "./spaces.client";
import type { UploadInput } from "./storage.schema";
import { env } from "../../config/env";
import { logger } from "../../lib/logger";
import { sniffImageType, UPLOADS_DIR } from "../../lib/uploads";

const ALLOWED_CONTENT_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/avif",
  "image/gif",
]);

const MAX_FILENAME_LEN = 80;

function sanitizeFilename(filename: string): string {
  const base = path
    .basename(filename)
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9._-]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return base.slice(0, MAX_FILENAME_LEN) || "file";
}

function mimeToExt(mime: string): string {
  switch (mime) {
    case "image/jpeg":
      return ".jpg";
    case "image/png":
      return ".png";
    case "image/webp":
      return ".webp";
    case "image/avif":
      return ".avif";
    case "image/gif":
      return ".gif";
    default:
      return "";
  }
}

function buildKey(folder: string, filename: string, contentType: string): string {
  const safe = sanitizeFilename(filename);
  const ext = path.extname(safe) || mimeToExt(contentType);
  const stem = path.basename(safe, path.extname(safe)) || "image";
  const random = crypto.randomBytes(6).toString("hex");
  return `${folder}/${Date.now()}-${random}-${stem}${ext}`;
}

/** Driver local: guarda en ./uploads/<key> y la API lo sirve en /uploads/<key>. */
async function putLocal(key: string, body: Buffer) {
  const target = path.join(UPLOADS_DIR, key);
  // La key la construimos nosotros, pero se comprueba igual que no salga de la carpeta.
  if (!target.startsWith(UPLOADS_DIR + path.sep)) throw new Error("Ruta de subida inválida");
  await fs.mkdir(path.dirname(target), { recursive: true });
  await fs.writeFile(target, body);
  const publicUrl = `${env.API_URL.replace(/\/+$/, "")}/uploads/${key.split("/").map(encodeURIComponent).join("/")}`;
  return { key, publicUrl };
}

export const storageController = {
  upload: async (req: Request & { file?: Express.Multer.File }, res: Response) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "file is required (field name: file)" });
      }
      const { originalname, buffer } = req.file;
      // El tipo se deduce de los bytes del archivo, no del Content-Type que manda el cliente.
      const mimetype = sniffImageType(buffer);
      if (!mimetype || !ALLOWED_CONTENT_TYPES.has(mimetype)) {
        return res.status(400).json({
          error: "Formato no soportado",
          allowed: [...ALLOWED_CONTENT_TYPES],
        });
      }
      const { folder } = req.body as UploadInput;
      // Los clientes solo suben su avatar; las carpetas del catálogo son de ADMIN.
      if (folder !== "avatars" && req.user?.role !== "ADMIN") {
        return res.status(403).json({ error: "Forbidden" });
      }
      const key = buildKey(folder, originalname, mimetype);
      const result =
        env.STORAGE_DRIVER === "local"
          ? await putLocal(key, buffer)
          : await putObject({ key, body: buffer, contentType: mimetype });
      return res.status(201).json(result);
    } catch (error) {
      if (error instanceof StorageNotConfiguredError) {
        return res.status(503).json({
          error: "Storage no está configurado todavía",
          code: "STORAGE_NOT_CONFIGURED",
        });
      }
      logger.error({ err: error }, "storage.upload: error");
      return res.status(500).json({ error: "Failed to upload file" });
    }
  },
};
