"use server";

import { redirect } from "next/navigation";
import { authApi } from "@/lib/api";
import { clearAuthCookie, setAuthCookie } from "@/lib/session";

function errorMessage(error: unknown): string {
  const raw = error instanceof Error ? error.message : "Error desconocido";
  if (raw.includes("API 401")) return "Email o contraseña incorrectos.";
  if (raw.includes("API 409")) return "Ese email ya está registrado.";
  if (raw.includes("API 400")) return "Datos inválidos. Revisa el formulario.";
  return "No se pudo completar la operación. Intenta de nuevo.";
}

export type AuthActionState = { error?: string } | undefined;

export async function loginAction(
  _prev: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const next = String(formData.get("next") ?? "").trim();

  if (!email || !password) {
    return { error: "Email y contraseña son obligatorios." };
  }

  let role: "USER" | "ADMIN";
  try {
    const { token, user } = await authApi.login({ email, password });
    await setAuthCookie(token);
    role = user.role;
  } catch (error) {
    return { error: errorMessage(error) };
  }

  const destination = next && next.startsWith("/") ? next : role === "ADMIN" ? "/dashboard" : "/";
  redirect(destination);
}

export async function registerAction(
  _prev: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const name = String(formData.get("name") ?? "").trim();

  if (!email || !password) {
    return { error: "Email y contraseña son obligatorios." };
  }
  if (password.length < 6) {
    return { error: "La contraseña debe tener al menos 6 caracteres." };
  }

  try {
    const { token } = await authApi.register({
      email,
      password,
      name: name || undefined,
    });
    await setAuthCookie(token);
  } catch (error) {
    return { error: errorMessage(error) };
  }

  redirect("/");
}

export async function logoutAction(): Promise<void> {
  await clearAuthCookie();
  redirect("/login");
}

export type ForgotPasswordState = { sent?: boolean; error?: string } | undefined;

export async function forgotPasswordAction(
  _prev: ForgotPasswordState,
  formData: FormData,
): Promise<ForgotPasswordState> {
  const email = String(formData.get("email") ?? "").trim();
  if (!email) {
    return { error: "Introduce un email." };
  }
  try {
    await authApi.forgotPassword(email);
  } catch {
    // Never reveal whether the email exists. Still show "sent" state so UX is consistent.
  }
  return { sent: true };
}

export type ResetPasswordState = { error?: string } | undefined;

export async function resetPasswordAction(
  _prev: ResetPasswordState,
  formData: FormData,
): Promise<ResetPasswordState> {
  const token = String(formData.get("token") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const confirmPassword = String(formData.get("confirmPassword") ?? "");

  if (!token) {
    return { error: "Token inválido o expirado." };
  }
  if (password.length < 6) {
    return { error: "La contraseña debe tener al menos 6 caracteres." };
  }
  if (password !== confirmPassword) {
    return { error: "Las contraseñas no coinciden." };
  }

  try {
    await authApi.resetPassword(token, password);
  } catch (error) {
    const raw = error instanceof Error ? error.message : "";
    if (raw.includes("API 400")) {
      return { error: "Token inválido o expirado." };
    }
    return { error: "No se pudo actualizar la contraseña. Intenta de nuevo." };
  }

  redirect("/login?reset=1");
}
