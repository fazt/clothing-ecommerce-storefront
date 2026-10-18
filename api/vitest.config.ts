import { defineConfig } from "vitest/config";

// Base de test separada en el Postgres del docker-compose (puerto 5486).
const TEST_DATABASE_URL =
  process.env["TEST_DATABASE_URL"] ?? "postgresql://atelier:atelier@127.0.0.1:5486/atelier_test?schema=public";

export default defineConfig({
  test: {
    environment: "node",
    include: ["test/**/*.test.ts"],
    globalSetup: ["./test/global-setup.ts"],
    // Los tests de integración comparten la base: uno detrás de otro.
    fileParallelism: false,
    testTimeout: 20_000,
    env: {
      NODE_ENV: "test",
      DATABASE_URL: TEST_DATABASE_URL,
      TEST_DATABASE_URL,
      JWT_SECRET: "test-jwt-secret-0123456789-0123456789",
      WEB_URL: "http://127.0.0.1:5226",
      API_URL: "http://127.0.0.1:4057",
      JOBS_ENABLED: "false",
      PAYMENTS_SIMULATED_ENABLED: "true",
      // Stripe "activo" para probar la verificación del webhook (no se llama a su API).
      STRIPE_SECRET_KEY: "sk_test_dummy",
      STRIPE_WEBHOOK_SECRET: "whsec_test_secret",
      MP_ACCESS_TOKEN: "",
      PAYPAL_CLIENT_ID: "",
      RESEND_API_KEY: "",
    },
  },
});
