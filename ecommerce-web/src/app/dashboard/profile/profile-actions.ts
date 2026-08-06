"use server";

import { revalidatePath } from "next/cache";
import { usersApi, type UserUpdateInput } from "@/lib/api";
import { getSessionUser } from "@/lib/session";

export async function updateProfileAction(formData: FormData) {
  const user = await getSessionUser();
  if (!user) throw new Error("No autenticado");

  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const name = String(formData.get("name") ?? "").trim() || null;
  const currentPassword = String(formData.get("currentPassword") ?? "");
  const password = String(formData.get("password") ?? "");
  const confirmPassword = String(formData.get("confirmPassword") ?? "");

  if (!currentPassword) {
    throw new Error("La contraseña actual es requerida para realizar cambios");
  }

  const data: UserUpdateInput = {
    name,
    currentPassword,
  };

  if (email && email !== user.email) {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      throw new Error("El correo electrónico no es válido");
    }
    data.email = email;
  }

  if (password) {
    if (password.length < 6) {
      throw new Error("La nueva contraseña debe tener al menos 6 caracteres");
    }
    if (password !== confirmPassword) {
      throw new Error("Las contraseñas nuevas no coinciden");
    }
    data.password = password;
  }

  await usersApi.update(user.id, data);
  revalidatePath("/dashboard/profile");
  return { success: true };
}