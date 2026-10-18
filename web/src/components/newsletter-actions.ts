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
  } catch {
    return {
      status: "error",
      message: "No pudimos suscribirte ahora. Inténtalo de nuevo.",
    };
  }
}
