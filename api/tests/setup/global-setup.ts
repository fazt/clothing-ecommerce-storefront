import { execSync } from "node:child_process";
import { testDatabaseUrl } from "./test-db-url";

/** Brings the test database schema up to date once per run. */
export default function setup() {
  execSync("npx prisma migrate deploy", {
    stdio: "inherit",
    env: { ...process.env, DATABASE_URL: testDatabaseUrl() },
  });
}
