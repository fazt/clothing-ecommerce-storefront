import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**" },
      { protocol: "http", hostname: "**" },
    ],
  },
  // Dev only: extra hostnames (comma-separated, e.g. a Tailscale name) allowed
  // to load dev resources. Without it the app never hydrates on those hosts.
  allowedDevOrigins: process.env.ALLOWED_DEV_ORIGINS?.split(",")
    .map((host) => host.trim())
    .filter(Boolean),
};

export default nextConfig;
