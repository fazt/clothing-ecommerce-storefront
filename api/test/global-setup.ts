import { execSync } from "node:child_process";

/** Antes de la suite: aplica las migraciones a la base de test (`migrate deploy` la crea si no existe). */
export default function setup(): void {
  const url =
    process.env["TEST_DATABASE_URL"] ?? "postgresql://atelier:atelier@127.0.0.1:5486/atelier_test?schema=public";
  execSync("pnpm exec prisma migrate deploy", {
    stdio: "inherit",
    env: { ...process.env, DATABASE_URL: url },
  });
}
