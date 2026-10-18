-- Checkout multi-pasarela (Stripe, PayPal, Mercado Pago, simulada) con reserva de stock y cupones,
-- envíos, wishlist, reseñas, número legible de orden e invalidación de sesiones.
-- Escrita a mano (modo solo escritura): verificar con `prisma migrate diff` en la fase de comprobación.

-- CreateEnum
CREATE TYPE "PaymentProviderId" AS ENUM ('STRIPE', 'PAYPAL', 'MERCADOPAGO', 'SIMULATED');

-- CreateEnum
CREATE TYPE "ReviewStatus" AS ENUM ('PUBLISHED', 'HIDDEN');

-- AlterEnum
ALTER TYPE "OrderStatus" ADD VALUE 'REFUNDED';

-- AlterTable: users
ALTER TABLE "users" ADD COLUMN "tokenVersion" INTEGER NOT NULL DEFAULT 0;

-- Los tokens de restablecimiento ahora se guardan hasheados (SHA-256): los anteriores dejan de valer.
DELETE FROM "password_reset_tokens";

-- AlterTable: Product
ALTER TABLE "Product" ADD COLUMN "ratingAvg" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN "ratingCount" INTEGER NOT NULL DEFAULT 0;

-- AlterTable: Discount
ALTER TABLE "Discount" ADD COLUMN "minSubtotal" DECIMAL(10,2),
ADD COLUMN "startsAt" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "shipping_methods" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "price" DECIMAL(10,2) NOT NULL,
    "freeOver" DECIMAL(10,2),
    "minDays" INTEGER NOT NULL DEFAULT 2,
    "maxDays" INTEGER NOT NULL DEFAULT 5,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "shipping_methods_pkey" PRIMARY KEY ("id")
);

-- AlterTable: Order (nuevas columnas)
ALTER TABLE "Order" ADD COLUMN "number" SERIAL NOT NULL,
ADD COLUMN "currency" TEXT NOT NULL DEFAULT 'USD',
ADD COLUMN "subtotal" DECIMAL(10,2) NOT NULL DEFAULT 0,
ADD COLUMN "discountTotal" DECIMAL(10,2) NOT NULL DEFAULT 0,
ADD COLUMN "shippingTotal" DECIMAL(10,2) NOT NULL DEFAULT 0,
ADD COLUMN "provider" "PaymentProviderId",
ADD COLUMN "providerRef" TEXT,
ADD COLUMN "paymentRef" TEXT,
ADD COLUMN "paidAt" TIMESTAMP(3),
ADD COLUMN "expiresAt" TIMESTAMP(3),
ADD COLUMN "stockReserved" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "discountId" TEXT,
ADD COLUMN "couponCode" TEXT,
ADD COLUMN "shippingMethodId" TEXT,
ADD COLUMN "shippingName" TEXT,
ADD COLUMN "shippingPhone" TEXT,
ADD COLUMN "shippingLine1" TEXT,
ADD COLUMN "shippingLine2" TEXT,
ADD COLUMN "shippingCity" TEXT,
ADD COLUMN "shippingRegion" TEXT,
ADD COLUMN "shippingPostal" TEXT,
ADD COLUMN "shippingCountry" TEXT,
ADD COLUMN "trackingNumber" TEXT;

-- Datos: los pedidos existentes conservan su pasarela y sus referencias de cobro.
UPDATE "Order" SET "subtotal" = "total";
UPDATE "Order" SET "provider" = 'STRIPE', "providerRef" = "stripeSessionId", "paymentRef" = "stripePaymentIntentId"
  WHERE "stripeSessionId" IS NOT NULL;
UPDATE "Order" SET "provider" = 'PAYPAL', "providerRef" = "paypalOrderId", "paymentRef" = "paypalCaptureId"
  WHERE "paypalOrderId" IS NOT NULL AND "provider" IS NULL;
UPDATE "Order" SET "paidAt" = "updatedAt" WHERE "status" IN ('PROCESSING', 'SHIPPED', 'DELIVERED');

-- Numeración legible desde #1001.
UPDATE "Order" SET "number" = "number" + 1000;
SELECT setval(pg_get_serial_sequence('"Order"', 'number'), GREATEST((SELECT COALESCE(MAX("number"), 1000) FROM "Order"), 1000));

-- DropIndex
DROP INDEX IF EXISTS "Order_paypalOrderId_key";

-- DropIndex
DROP INDEX IF EXISTS "Order_stripeSessionId_key";

-- AlterTable: columnas por pasarela reemplazadas por provider/providerRef/paymentRef
ALTER TABLE "Order" DROP COLUMN "paypalCaptureId",
DROP COLUMN "paypalOrderId",
DROP COLUMN "stripePaymentIntentId",
DROP COLUMN "stripeSessionId";

-- CreateTable
CREATE TABLE "payment_events" (
    "id" TEXT NOT NULL,
    "provider" "PaymentProviderId" NOT NULL,
    "eventId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "orderId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "payment_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "wishlist_items" (
    "userId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "wishlist_items_pkey" PRIMARY KEY ("userId","productId")
);

-- CreateTable
CREATE TABLE "reviews" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "title" TEXT,
    "body" TEXT NOT NULL,
    "verified" BOOLEAN NOT NULL DEFAULT false,
    "status" "ReviewStatus" NOT NULL DEFAULT 'PUBLISHED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "reviews_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Product_categoryId_idx" ON "Product"("categoryId");

-- CreateIndex
CREATE INDEX "Product_createdAt_idx" ON "Product"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Order_number_key" ON "Order"("number");

-- CreateIndex
CREATE INDEX "Order_userId_createdAt_idx" ON "Order"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "Order_status_createdAt_idx" ON "Order"("status", "createdAt");

-- CreateIndex
CREATE INDEX "Order_status_expiresAt_idx" ON "Order"("status", "expiresAt");

-- CreateIndex
CREATE INDEX "Order_customerId_idx" ON "Order"("customerId");

-- CreateIndex
CREATE UNIQUE INDEX "Order_provider_providerRef_key" ON "Order"("provider", "providerRef");

-- CreateIndex
CREATE INDEX "OrderItem_orderId_idx" ON "OrderItem"("orderId");

-- CreateIndex
CREATE INDEX "OrderItem_productId_idx" ON "OrderItem"("productId");

-- CreateIndex
CREATE INDEX "OrderItem_variantId_idx" ON "OrderItem"("variantId");

-- CreateIndex
CREATE INDEX "payment_events_orderId_idx" ON "payment_events"("orderId");

-- CreateIndex
CREATE UNIQUE INDEX "payment_events_provider_eventId_key" ON "payment_events"("provider", "eventId");

-- CreateIndex
CREATE INDEX "wishlist_items_productId_idx" ON "wishlist_items"("productId");

-- CreateIndex
CREATE INDEX "reviews_productId_status_createdAt_idx" ON "reviews"("productId", "status", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "reviews_productId_userId_key" ON "reviews"("productId", "userId");

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_discountId_fkey" FOREIGN KEY ("discountId") REFERENCES "Discount"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_shippingMethodId_fkey" FOREIGN KEY ("shippingMethodId") REFERENCES "shipping_methods"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payment_events" ADD CONSTRAINT "payment_events_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "wishlist_items" ADD CONSTRAINT "wishlist_items_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "wishlist_items" ADD CONSTRAINT "wishlist_items_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
