/**
 * Database the test suite runs against. It is wiped before every test, so it
 * must never be the development or production database.
 */
export function testDatabaseUrl(): string {
  const url =
    process.env.TEST_DATABASE_URL ??
    "postgresql://postgres:postgres@localhost:5434/ecommerce_test?schema=public";
  const dbName = new URL(url).pathname.replace(/^\//, "");
  if (!/test/i.test(dbName)) {
    throw new Error(
      `TEST_DATABASE_URL apunta a "${dbName}": el nombre de la base de datos de tests debe contener "test".`,
    );
  }
  return url;
}
