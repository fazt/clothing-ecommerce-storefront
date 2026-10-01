/**
 * Create or promote an admin user directly in the DB.
 *
 * Usage:
 *   npx tsx scripts/create-admin.ts --email <email> --password <pw> [--name <name>] [--force]
 *
 * Flags:
 *   --email    (required) user email
 *   --password (required) password in plain text — will be hashed with bcrypt
 *   --name     display name (optional)
 *   --force    overwrite the password if the user already exists
 *
 * Behaviour:
 *   - Reads DATABASE_URL from environment (or .env) via Prisma.
 *   - If the user does not exist, creates it with role=ADMIN.
 *   - If the user exists, promotes it to role=ADMIN (password only updated when --force).
 *   - Idempotent: safe to re-run.
 *
 * Examples:
 *   npx tsx scripts/create-admin.ts --email fazt@faztweb.com --password "s3cure!" --name Fazt
 *
 *   # against Railway (public proxy URL):
 *   DATABASE_URL="postgresql://.../railway" \
 *     npx tsx scripts/create-admin.ts --email admin@site.com --password "$(openssl rand -hex 16)"
 */

import bcrypt from "bcrypt";
import { PrismaClient } from "@prisma/client";

type ArgMap = { email?: string; password?: string; name?: string; force?: boolean };

function parseArgs(): ArgMap {
  const argv = process.argv.slice(2);
  const out: ArgMap = {};
  for (let i = 0; i < argv.length; i++) {
    const token = argv[i];
    if (!token.startsWith("--")) continue;
    const eq = token.indexOf("=");
    const key = (eq >= 0 ? token.slice(2, eq) : token.slice(2)) as keyof ArgMap;
    let raw: string | undefined;
    if (eq >= 0) {
      raw = token.slice(eq + 1);
    } else {
      const next = argv[i + 1];
      if (next && !next.startsWith("--")) {
        raw = next;
        i += 1;
      } else {
        raw = "true";
      }
    }
    if (key === "force") {
      out.force = raw !== "false" && raw !== "0";
    } else if (key === "email" || key === "password" || key === "name") {
      out[key] = raw;
    }
  }
  return out;
}

function usageAndExit(message?: string): never {
  if (message) console.error(`✖ ${message}\n`);
  console.error(
    "Usage: npx tsx scripts/create-admin.ts --email <email> --password <pw> [--name <name>] [--force]",
  );
  process.exit(1);
}

const prisma = new PrismaClient();

async function main() {
  const { email, password, name, force } = parseArgs();

  if (!email) usageAndExit("--email is required");
  if (!password) usageAndExit("--password is required");
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email!)) {
    usageAndExit(`"${email}" is not a valid email`);
  }
  if (password!.length < 6) {
    usageAndExit("password must be at least 6 characters");
  }

  const normalizedEmail = email!.trim().toLowerCase();
  const displayName = name?.trim() || null;
  const passwordHash = await bcrypt.hash(password!, 10);

  const existing = await prisma.user.findUnique({
    where: { email: normalizedEmail },
  });

  if (existing) {
    const data: {
      role: "ADMIN";
      name?: string | null;
      passwordHash?: string;
    } = { role: "ADMIN" };

    if (displayName !== null) data.name = displayName;
    if (force) data.passwordHash = passwordHash;

    const updated = await prisma.user.update({
      where: { id: existing.id },
      data,
    });

    const parts: string[] = [`role=${updated.role}`];
    if (force) parts.push("password updated");
    if (displayName && displayName !== existing.name) parts.push(`name="${displayName}"`);
    console.log(`✓ Promoted existing user: ${updated.email} · ${parts.join(" · ")}`);
    if (!force && existing.role === "ADMIN") {
      console.log("  (already admin — re-run with --force to also update the password)");
    }
    if (!force && !existing.passwordHash) {
      console.log("  (no password: signs in with a social provider — re-run with --force to set one)");
    }
  } else {
    const created = await prisma.user.create({
      data: {
        email: normalizedEmail,
        passwordHash,
        name: displayName,
        role: "ADMIN",
      },
    });
    console.log(
      `✓ Created admin: ${created.email} · id=${created.id}${
        created.name ? ` · name="${created.name}"` : ""
      }`,
    );
  }
}

main()
  .catch((err) => {
    console.error("✖ Failed to create admin:", err instanceof Error ? err.message : err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
