"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { API_URL } from "@/lib/api-client";
import { cn } from "@/lib/utils";

// A full-page navigation to the API, which redirects to Google and back. The
// API issues the auth cookie on the way back, like the password login.
export function GoogleButton({ next }: { next?: string }) {
  const [pending, setPending] = useState(false);

  // The Back button can restore this page from the bfcache with `pending` on.
  useEffect(() => {
    const reset = (event: PageTransitionEvent) => {
      if (event.persisted) setPending(false);
    };
    window.addEventListener("pageshow", reset);
    return () => window.removeEventListener("pageshow", reset);
  }, []);

  const query = next ? `?${new URLSearchParams({ redirect: next })}` : "";

  return (
    <a
      href={`${API_URL}/auth/google${query}`}
      onClick={() => setPending(true)}
      aria-disabled={pending || undefined}
      className={cn(
        buttonVariants({ variant: "outline", size: "lg" }),
        "h-11 w-full gap-3 rounded-full text-[14px]",
        pending && "pointer-events-none opacity-70",
      )}
    >
      {pending ? <Loader2 className="animate-spin" aria-hidden /> : <GoogleLogo />}
      {pending ? "Redirigiendo a Google…" : "Continuar con Google"}
    </a>
  );
}

function GoogleLogo() {
  return (
    <svg viewBox="0 0 48 48" className="size-[18px]" aria-hidden>
      <path
        fill="#EA4335"
        d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
      />
      <path
        fill="#4285F4"
        d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
      />
      <path
        fill="#FBBC05"
        d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
      />
      <path
        fill="#34A853"
        d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
      />
    </svg>
  );
}
