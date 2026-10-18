"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Heart } from "lucide-react";
import { api, ApiError } from "@/lib/api-client";
import { cn } from "@/lib/utils";

/** Corazón de «favoritos». Sin sesión, lleva al login y vuelve al producto. */
export function WishlistButton({ productId, className }: { productId: string; className?: string }) {
  const router = useRouter();
  const [saved, setSaved] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let cancelled = false;
    api.wishlist.ids().then(
      ({ data }) => !cancelled && setSaved(data.includes(productId)),
      () => undefined, // sin sesión: el corazón queda vacío
    );
    return () => {
      cancelled = true;
    };
  }, [productId]);

  function toggle() {
    const next = !saved;
    setSaved(next);
    setBusy(true);
    (next ? api.wishlist.add(productId) : api.wishlist.remove(productId))
      .catch((e: unknown) => {
        setSaved(!next);
        if (e instanceof ApiError && e.status === 401) {
          router.push(`/login?next=${encodeURIComponent(window.location.pathname)}`);
        }
      })
      .finally(() => setBusy(false));
  }

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={busy}
      aria-pressed={saved}
      aria-label={saved ? "Quitar de favoritos" : "Guardar en favoritos"}
      className={cn(
        "inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm transition-colors hover:bg-muted disabled:opacity-60",
        className,
      )}
    >
      <Heart className={cn("h-4 w-4", saved && "fill-current text-rose-600")} />
      {saved ? "En favoritos" : "Guardar"}
    </button>
  );
}
