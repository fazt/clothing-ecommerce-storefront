"use server";

import { newsletterApi } from "@/lib/api";

export interface NewsletterState {
  status: "idle" | "success" | "error";
  message: string;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function subscribeNewsletter(
  _prevState: NewsletterState,
  formData: FormData,
): Promise<NewsletterState> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();

  if (!EMAIL_RE.test(email)) {
    return {
      status: "error",
      message: "Ingresa un email válido.",
    };
  }

  try {
    await newsletterApi.subscribe(email);
    return {
      status: "success",
      message: "Listo. Te avisaremos sobre nuevos lanzamientos y ofertas.",
    };
  } catch (e) {
    const limited = e instanceof Error && e.message.includes("429");
    return {
      status: "error",
      message: limited
        ? "Demasiados intentos. Prueba de nuevo en un rato."
        : "No pudimos suscribirte ahora. Inténtalo de nuevo.",
    };
  }
}
