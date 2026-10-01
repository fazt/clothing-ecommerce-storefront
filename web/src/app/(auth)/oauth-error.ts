// The API sends failed OAuth sign-ins back to /login?error=<provider>_<reason>.
// Only known codes map to a message; the raw query value is never shown.
const PROVIDER_LABELS: Record<string, string> = {
  google: "Google",
  github: "GitHub",
};

const REASONS: Record<string, (provider: string) => string> = {
  unavailable: (provider) => `El inicio de sesión con ${provider} no está disponible en este momento.`,
  cancelled: (provider) => `Cancelaste el inicio de sesión con ${provider}.`,
  state: () => "El intento de inicio de sesión caducó o no es válido. Vuelve a intentarlo.",
  email_unverified: (provider) =>
    `Tu email de ${provider} no está verificado. Verifícalo o entra con tu email y contraseña.`,
  account_conflict: (provider) =>
    `Ese email ya está vinculado a otra cuenta de ${provider}. Entra con esa cuenta o con tu contraseña.`,
  failed: (provider) => `No se pudo iniciar sesión con ${provider}. Inténtalo de nuevo.`,
};

export function oauthErrorMessage(code: string | undefined): string | null {
  if (!code) return null;
  const separator = code.indexOf("_");
  const provider = separator > 0 ? PROVIDER_LABELS[code.slice(0, separator)] : undefined;
  if (!provider) return null;
  const reason = REASONS[code.slice(separator + 1)] ?? REASONS.failed;
  return reason(provider);
}
