import { ApiError } from "@/lib/api-client";

export function uploadErrorMessage(e: unknown): string {
  if (!(e instanceof ApiError)) return "Error al subir la imagen.";
  if (e.code === "STORAGE_NOT_CONFIGURED") {
    return "DigitalOcean Spaces aún no está configurado. Añade DO_SPACES_KEY, DO_SPACES_SECRET y DO_SPACES_BUCKET al .env de la API.";
  }
  if (e.status === 413) return "La imagen supera el tamaño máximo (5 MB).";
  if (e.status === 400) return "Archivo no válido. Usa JPG, PNG, WEBP, AVIF o GIF.";
  if (e.status === 0) return e.message;
  return `No se pudo subir la imagen (${e.status}). ${e.message}`;
}
