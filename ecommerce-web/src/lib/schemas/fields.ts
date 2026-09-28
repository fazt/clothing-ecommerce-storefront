// Reusable Zod fields for form input. Values arrive as strings from FormData,
// so empty strings are normalized here. Messages mirror the API's.
import { z } from "zod";

export const emailField = z
  .string()
  .trim()
  .toLowerCase()
  .pipe(z.email({ error: "Email inválido" }));

export const passwordField = z
  .string()
  .min(6, { error: "La contraseña debe tener al menos 6 caracteres" })
  .max(100, { error: "La contraseña es demasiado larga" });

/** Trimmed text where "" becomes null. */
export const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max, { error: `Máximo ${max} caracteres` })
    .transform((v) => v || null);

/** URL where "" becomes null. */
export const optionalUrl = z
  .string()
  .trim()
  .transform((v) => v || null)
  .pipe(z.url({ error: "URL inválida" }).nullable());
