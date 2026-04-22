"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { categoriesApi, type CategoryInput } from "@/lib/api";

function parse(formData: FormData): CategoryInput {
  return {
    slug: String(formData.get("slug") ?? "").trim(),
    name: String(formData.get("name") ?? "").trim(),
    image: String(formData.get("image") ?? "").trim() || null,
    isVisible: formData.get("isVisible") === "on",
  };
}

export async function createCategoryAction(formData: FormData) {
  const data = parse(formData);
  if (!data.slug || !data.name) {
    throw new Error("slug y nombre son obligatorios");
  }
  await categoriesApi.create(data);
  revalidatePath("/dashboard/categories");
  redirect("/dashboard/categories");
}

export async function updateCategoryAction(id: string, formData: FormData) {
  const data = parse(formData);
  if (!data.slug || !data.name) {
    throw new Error("slug y nombre son obligatorios");
  }
  await categoriesApi.update(id, data);
  revalidatePath("/dashboard/categories");
  redirect("/dashboard/categories");
}

export async function deleteCategoryAction(id: string) {
  await categoriesApi.remove(id);
  revalidatePath("/dashboard/categories");
}
