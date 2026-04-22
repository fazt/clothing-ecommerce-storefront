"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  productsApi,
  type ProductInput,
  type ProductVariantInput,
} from "@/lib/api";

function parseVariantsJson(raw: string): ProductVariantInput[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((v) => v && typeof v === "object")
      .map((v: Record<string, unknown>) => ({
        id: typeof v.id === "string" ? v.id : undefined,
        size: typeof v.size === "string" ? v.size : null,
        color: typeof v.color === "string" ? v.color : null,
        sku: typeof v.sku === "string" ? v.sku : null,
        stock: Number.isFinite(Number(v.stock)) ? Number(v.stock) : 0,
        price:
          v.price === null || v.price === undefined || v.price === ""
            ? null
            : typeof v.price === "number"
              ? v.price
              : Number(v.price),
      }))
      .filter((v) => v.size !== null || v.color !== null);
  } catch {
    return [];
  }
}

function parseForm(formData: FormData): ProductInput {
  const name = String(formData.get("name") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const price = String(formData.get("price") ?? "").trim();
  const stockRaw = String(formData.get("stock") ?? "0").trim();
  const imageUrl = String(formData.get("imageUrl") ?? "").trim();
  const categoryId = String(formData.get("categoryId") ?? "").trim();
  const images = formData
    .getAll("images")
    .map((v) => String(v ?? "").trim())
    .filter((v) => v.length > 0);
  const isNew = formData.get("isNew") !== null;
  const isSale = formData.get("isSale") !== null;
  const isFeatured = formData.get("isFeatured") !== null;
  const variants = parseVariantsJson(
    String(formData.get("variantsJson") ?? ""),
  );

  return {
    name,
    description: description || null,
    price: Number(price),
    stock: Number(stockRaw) || 0,
    imageUrl: imageUrl || null,
    images,
    isNew,
    isSale,
    isFeatured,
    categoryId: categoryId || null,
    variants,
  };
}

export async function createProductAction(formData: FormData) {
  const data = parseForm(formData);
  if (!data.name || Number.isNaN(Number(data.price))) {
    throw new Error("Nombre y precio son obligatorios");
  }
  await productsApi.create(data);
  revalidatePath("/dashboard/products");
  redirect("/dashboard/products");
}

export async function updateProductAction(id: string, formData: FormData) {
  const data = parseForm(formData);
  if (!data.name || Number.isNaN(Number(data.price))) {
    throw new Error("Nombre y precio son obligatorios");
  }
  await productsApi.update(id, data);
  revalidatePath("/dashboard/products");
  redirect("/dashboard/products");
}

export async function deleteProductAction(id: string) {
  await productsApi.remove(id);
  revalidatePath("/dashboard/products");
}
