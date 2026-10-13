import { defineConfig } from "vitest/config";
import { testDatabaseUrl } from "./tests/setup/test-db-url";

export default defineConfig({
  test: {
    include: ["tests/**/*.test.ts"],
    environment: "node",
    globalSetup: ["tests/setup/global-setup.ts"],
    // Every test file talks to the same database: run them one at a time.
    fileParallelism: false,
    testTimeout: 20_000,
    hookTimeout: 60_000,
    env: {
      NODE_ENV: "test",
      DATABASE_URL: testDatabaseUrl(),
      // Placeholders keep the real payment and email clients disabled.
      PAYPAL_CLIENT_ID: "test-placeholder",
      PAYPAL_CLIENT_SECRET: "test-placeholder",
      STRIPE_SECRET_KEY: "sk_test_placeholder",
      STRIPE_WEBHOOK_SECRET: "whsec_placeholder",
      RESEND_API_KEY: "re_placeholder",
    },
  },
});
