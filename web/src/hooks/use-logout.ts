"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api-client";

export function useLogout() {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function logout() {
    setPending(true);
    try {
      // The API clears the HttpOnly cookie; the browser can't do it itself.
      await api.auth.logout();
      router.push("/login");
      router.refresh();
    } catch (e) {
      setPending(false);
      alert(e instanceof Error ? e.message : "No se pudo cerrar sesión");
    }
  }

  return { logout, pending };
}
