"use server";

import { getAuthToken, getSessionUser } from "@/lib/session";

const API_URL = process.env.API_URL ?? "http://localhost:4000/api";

export type UploadResult =
  | { ok: true; key: string; publicUrl: string }
  | { ok: false; error: string; code?: string };

export async function uploadImageAction(
  formData: FormData,
): Promise<UploadResult> {
  const user = await getSessionUser();
  if (!user || user.role !== "ADMIN") {
    return { ok: false, error: "No autorizado." };
  }
  const file = formData.get("file");
  if (!(file instanceof File)) {
    return { ok: false, error: "No se recibió ningún archivo." };
  }

  const forward = new FormData();
  forward.append("file", file, file.name);
  const folder = formData.get("folder");
  if (typeof folder === "string" && folder) {
    forward.append("folder", folder);
  }

  const token = await getAuthToken();
  try {
    const res = await fetch(`${API_URL}/storage/upload`, {
      method: "POST",
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      body: forward,
      cache: "no-store",
    });
    if (res.status === 503) {
      return {
        ok: false,
        code: "STORAGE_NOT_CONFIGURED",
        error:
          "DigitalOcean Spaces aún no está configurado. Añade DO_SPACES_KEY, DO_SPACES_SECRET y DO_SPACES_BUCKET al .env de la API.",
      };
    }
    if (res.status === 413) {
      return { ok: false, error: "La imagen supera el tamaño máximo (5 MB)." };
    }
    if (res.status === 400) {
      return {
        ok: false,
        error: "Archivo no válido. Usa JPG, PNG, WEBP, AVIF o GIF.",
      };
    }
    if (!res.ok) {
      const body = await res.text().catch(() => "");
      return {
        ok: false,
        error: `Error del servidor (${res.status}). ${body.slice(0, 120)}`,
      };
    }
    const data = (await res.json()) as { key: string; publicUrl: string };
    return { ok: true, key: data.key, publicUrl: data.publicUrl };
  } catch (e) {
    const message = e instanceof Error ? e.message : "Error de red";
    return { ok: false, error: `No se pudo subir la imagen. ${message}` };
  }
}
