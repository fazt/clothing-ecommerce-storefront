"use server";

import { revalidatePath } from "next/cache";
import { ordersApi, type OrderStatus } from "@/lib/api";

export async function updateOrderStatusAction(id: string, status: OrderStatus) {
  await ordersApi.updateStatus(id, status);
  revalidatePath("/dashboard/orders");
  revalidatePath("/dashboard");
}

export async function deleteOrderAction(id: string) {
  await ordersApi.remove(id);
  revalidatePath("/dashboard/orders");
  revalidatePath("/dashboard");
}
