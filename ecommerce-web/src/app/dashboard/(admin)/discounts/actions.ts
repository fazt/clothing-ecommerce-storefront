"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  discountsApi,
  type DiscountInput,
  type DiscountStatus,
  type DiscountType,
} from "@/lib/api";

function parse(formData: FormData): DiscountInput {
  const expiresAtRaw = String(formData.get("expiresAt") ?? "").trim();
  const limitRaw = String(formData.get("limit") ?? "").trim();
  return {
    code: String(formData.get("code") ?? "")
      .trim()
      .toUpperCase(),
    description: String(formData.get("description") ?? "").trim() || null,
    type: (String(formData.get("type") ?? "PERCENT")) as DiscountType,
    value: Number(formData.get("value") ?? 0),
    limit: limitRaw ? Number(limitRaw) : null,
    status: (String(formData.get("status") ?? "ACTIVE")) as DiscountStatus,
    expiresAt: expiresAtRaw || null,
  };
}

export async function createDiscountAction(formData: FormData) {
  const data = parse(formData);
  if (!data.code || data.value === undefined) {
    throw new Error("Código y valor son obligatorios");
  }
  await discountsApi.create(data);
  revalidatePath("/dashboard/discounts");
  redirect("/dashboard/discounts");
}

export async function updateDiscountAction(id: string, formData: FormData) {
  const data = parse(formData);
  if (!data.code) throw new Error("Código obligatorio");
  await discountsApi.update(id, data);
  revalidatePath("/dashboard/discounts");
  redirect("/dashboard/discounts");
}

export async function deleteDiscountAction(id: string) {
  await discountsApi.remove(id);
  revalidatePath("/dashboard/discounts");
}
