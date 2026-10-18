import path from "node:path";

/** Carpeta del driver local de imágenes (STORAGE_DRIVER=local). En Docker es un volumen. */
export const UPLOADS_DIR = path.resolve(process.cwd(), "uploads");

/** Firma real del archivo (magic bytes): el Content-Type del cliente no es de fiar. */
export function sniffImageType(buf: Buffer): string | null {
  if (buf.length < 12) return null;
  if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return "image/jpeg";
  if (buf.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return "image/png";
  if (buf.subarray(0, 4).toString("ascii") === "RIFF" && buf.subarray(8, 12).toString("ascii") === "WEBP") return "image/webp";
  if (buf.subarray(0, 6).toString("ascii") === "GIF87a" || buf.subarray(0, 6).toString("ascii") === "GIF89a") return "image/gif";
  if (buf.subarray(4, 12).toString("ascii") === "ftypavif") return "image/avif";
  return null;
}
