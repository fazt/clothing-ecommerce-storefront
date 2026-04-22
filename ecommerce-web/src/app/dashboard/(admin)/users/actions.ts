"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { usersApi, type Role, type UserCreateInput, type UserUpdateInput } from "@/lib/api";

const isRole = (value: string): value is Role => value === "USER" || value === "ADMIN";

function parseCreate(formData: FormData): UserCreateInput {
  const role = String(formData.get("role") ?? "USER");
  return {
    email: String(formData.get("email") ?? "").trim().toLowerCase(),
    password: String(formData.get("password") ?? ""),
    name: String(formData.get("name") ?? "").trim() || null,
    role: isRole(role) ? role : "USER",
  };
}

function parseUpdate(formData: FormData): UserUpdateInput {
  const role = String(formData.get("role") ?? "");
  const password = String(formData.get("password") ?? "");
  return {
    name: String(formData.get("name") ?? "").trim() || null,
    role: isRole(role) ? role : undefined,
    password: password ? password : undefined,
  };
}

export async function createUserAction(formData: FormData) {
  const data = parseCreate(formData);
  if (!data.email) throw new Error("El email es obligatorio");
  if (!data.password || data.password.length < 6) {
    throw new Error("La contraseña debe tener al menos 6 caracteres");
  }
  await usersApi.create(data);
  revalidatePath("/dashboard/users");
  redirect("/dashboard/users");
}

export async function updateUserAction(id: string, formData: FormData) {
  const data = parseUpdate(formData);
  if (data.password && data.password.length < 6) {
    throw new Error("La contraseña debe tener al menos 6 caracteres");
  }
  await usersApi.update(id, data);
  revalidatePath("/dashboard/users");
  redirect("/dashboard/users");
}

export async function deleteUserAction(id: string) {
  await usersApi.remove(id);
  revalidatePath("/dashboard/users");
}
