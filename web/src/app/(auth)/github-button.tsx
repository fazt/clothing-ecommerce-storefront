"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { API_URL } from "@/lib/api-client";
import { cn } from "@/lib/utils";

// A full-page navigation to the API, which redirects to GitHub and back. The
// API issues the auth cookie on the way back, like the password login.
export function GithubButton({ next }: { next?: string }) {
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
      href={`${API_URL}/auth/github${query}`}
      onClick={() => setPending(true)}
      aria-disabled={pending || undefined}
      className={cn(
        buttonVariants({ variant: "outline", size: "lg" }),
        "h-11 w-full gap-3 rounded-full text-[14px]",
        pending && "pointer-events-none opacity-70",
      )}
    >
      {pending ? <Loader2 className="animate-spin" aria-hidden /> : <GithubLogo />}
      {pending ? "Redirigiendo a GitHub…" : "Continuar con GitHub"}
    </a>
  );
}

// GitHub's mark (Octicons `mark-github`); it follows the text color, so it
// works in light and dark themes.
function GithubLogo() {
  return (
    <svg viewBox="0 0 16 16" className="size-[18px]" fill="currentColor" aria-hidden>
      <path d="M8 0c4.42 0 8 3.58 8 8a8.013 8.013 0 0 1-5.45 7.59c-.4.08-.55-.17-.55-.38 0-.27.01-1.13.01-2.2 0-.75-.25-1.23-.54-1.48 1.78-.2 3.65-.88 3.65-3.95 0-.88-.31-1.59-.82-2.15.08-.2.36-1.02-.08-2.12 0 0-.67-.22-2.2.82-.64-.18-1.32-.27-2-.27-.68 0-1.36.09-2 .27-1.53-1.03-2.2-.82-2.2-.82-.44 1.1-.16 1.92-.08 2.12-.51.56-.82 1.28-.82 2.15 0 3.06 1.86 3.75 3.64 3.95-.23.2-.44.55-.51 1.07-.46.21-1.61.55-2.33-.66-.15-.24-.6-.83-1.23-.82-.67.01-.27.38.01.53.34.19.73.9.82 1.13.16.45.68 1.31 2.69.94 0 .67.01 1.3.01 1.49 0 .21-.15.45-.55.38A7.995 7.995 0 0 1 0 8c0-4.42 3.58-8 8-8Z" />
    </svg>
  );
}
