import path from "node:path";
import type { NextConfig } from "next";

/**
 * Hosts de imágenes permitidos por next/image: Unsplash (catálogo demo), la propia API (driver
 * local de subidas) y los que se agreguen en IMAGE_HOSTS (p. ej. el CDN de Spaces).
 * No se usa un comodín: el optimizador de imágenes no debe poder pedir cualquier URL (SSRF).
 */
function imageHosts() {
  const hosts = new Set(["images.unsplash.com"]);
  for (const raw of [process.env.NEXT_PUBLIC_API_URL, ...(process.env.IMAGE_HOSTS ?? "").split(",")]) {
    const value = raw?.trim();
    if (!value) continue;
    try {
      hosts.add(new URL(value.includes("://") ? value : `https://${value}`).hostname);
    } catch {
      // valor inválido: se ignora
    }
  }
  return [...hosts];
}

const nextConfig: NextConfig = {
  output: "standalone",
  // Monorepo: el trazado de dependencias del build standalone parte de la raíz.
  outputFileTracingRoot: path.join(__dirname, ".."),
  poweredByHeader: false,
  images: {
    remotePatterns: imageHosts().flatMap((hostname) => [
      { protocol: "https" as const, hostname },
      { protocol: "http" as const, hostname },
    ]),
  },
  // Solo dev: hosts extra (separados por coma, p. ej. Tailscale) que pueden usar el dev server.
  allowedDevOrigins: ["127.0.0.1", ...(process.env.ALLOWED_DEV_ORIGINS ?? "")
    .split(",")
    .map((host) => host.trim())
    .filter(Boolean)],
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-Frame-Options", value: "DENY" },
        ],
      },
    ];
  },
};

export default nextConfig;
