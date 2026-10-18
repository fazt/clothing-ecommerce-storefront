import "dotenv/config";
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts",
  },
  datasource: {
    // `prisma generate` no necesita conexión: el valor de respaldo evita fallar sin .env.
    url: process.env["DATABASE_URL"] ?? "postgresql://atelier:atelier@127.0.0.1:5486/atelier",
  },
});
