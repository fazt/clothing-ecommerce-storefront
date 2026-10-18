import crypto from "crypto";
import path from "path";
import { Request, Response } from "express";
import { putObject, StorageNotConfiguredError } from "./spaces.client";
import type { UploadInput } from "./storage.schema";

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

export const storageController = {
  upload: async (
    req: Request & { file?: Express.Multer.File },
    res: Response,
  ) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "file is required (field name: file)" });
      }
      const { mimetype, originalname, buffer } = req.file;
      if (!ALLOWED_CONTENT_TYPES.has(mimetype)) {
        return res.status(400).json({
          error: "Unsupported content type",
          allowed: [...ALLOWED_CONTENT_TYPES],
        });
      }
      const { folder } = req.body as UploadInput;
      // Customers may only upload their own avatar; catalog folders are admin-only.
      if (folder !== "avatars" && req.user?.role !== "ADMIN") {
        return res.status(403).json({ error: "Forbidden" });
      }
      const key = buildKey(folder, originalname, mimetype);
      const result = await putObject({
        key,
        body: buffer,
        contentType: mimetype,
      });
      return res.status(201).json(result);
    } catch (error) {
      if (error instanceof StorageNotConfiguredError) {
        return res.status(503).json({
          error: "Storage no está configurado todavía",
          code: "STORAGE_NOT_CONFIGURED",
        });
      }
      console.error("[storage.upload] error", error);
      return res.status(500).json({ error: "Failed to upload file" });
    }
  },
};
