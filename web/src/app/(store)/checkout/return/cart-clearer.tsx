"use client";

import { useEffect } from "react";
import { useCart } from "@/components/cart-provider";

export function CartClearer() {
  const { clear, hydrated } = useCart();
  useEffect(() => {
    if (hydrated) clear();
  }, [hydrated, clear]);
  return null;
}
