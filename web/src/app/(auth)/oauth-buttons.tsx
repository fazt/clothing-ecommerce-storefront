import { unstable_rethrow } from "next/navigation";
import { authApi, type AuthProviders } from "@/lib/api";
import { GoogleButton } from "./google-button";
import { GithubButton } from "./github-button";

const NO_PROVIDERS: AuthProviders = { google: false, github: false };

/**
 * "Continuar con …" buttons for the providers the API has credentials for.
 * Renders nothing when there are none or the API can't be reached.
 */
export async function OAuthButtons({ next }: { next?: string }) {
  const providers = await authApi.providers().catch((e: unknown) => {
    unstable_rethrow(e);
    return NO_PROVIDERS;
  });
  if (!Object.values(providers).some(Boolean)) return null;

  const redirect = next && next.startsWith("/") && !next.startsWith("//") ? next : undefined;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3">
        {providers.google ? <GoogleButton next={redirect} /> : null}
        {providers.github ? <GithubButton next={redirect} /> : null}
      </div>
      <div
        className="flex items-center gap-3 text-[11px] uppercase tracking-[0.2em]"
        style={{ color: "var(--ink-faded)" }}
      >
        <span className="h-px flex-1" style={{ backgroundColor: "var(--border)" }} />
        o con tu email
        <span className="h-px flex-1" style={{ backgroundColor: "var(--border)" }} />
      </div>
    </div>
  );
}
