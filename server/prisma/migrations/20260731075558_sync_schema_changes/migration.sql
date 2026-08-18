/*
  Warnings:

  - The values [DRAFT,SENT,CANCELLED] on the enum `InvoiceStatus` will be removed. If these variants are still used in the database, this will fail.
  - The values [STAFF] on the enum `UserRole` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `signatureType` on the `branches` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[branchId,invoiceNumber]` on the table `invoices` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[branchId,quotationNumber]` on the table `quotations` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
CREATE TYPE "PlanRank" AS ENUM ('TRIAL', 'BRONZE', 'SILVER', 'GOLD');

-- CreateEnum
CREATE TYPE "BillingCycle" AS ENUM ('MONTHLY', 'YEARLY');

-- CreateEnum
CREATE TYPE "SubscriptionStatus" AS ENUM ('TRIAL', 'ACTIVE', 'EXPIRED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "SubPaymentStatus" AS ENUM ('PENDING', 'SUCCESS', 'FAILED', 'REFUNDED');

-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('SUBSCRIPTION_PURCHASED', 'PAYMENT_SUCCESS', 'PAYMENT_FAILED', 'SUBSCRIPTION_EXPIRING', 'SUBSCRIPTION_EXPIRED', 'PLAN_UPGRADED', 'PLAN_DOWNGRADED');

-- CreateEnum
CREATE TYPE "DocumentType" AS ENUM ('QUOTATION', 'INVOICE');

-- AlterEnum
BEGIN;
CREATE TYPE "InvoiceStatus_new" AS ENUM ('UNPAID', 'PARTIAL', 'PAID', 'OVERDUE');
ALTER TABLE "public"."invoices" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "invoices" ALTER COLUMN "status" TYPE "InvoiceStatus_new" USING ("status"::text::"InvoiceStatus_new");
ALTER TYPE "InvoiceStatus" RENAME TO "InvoiceStatus_old";
ALTER TYPE "InvoiceStatus_new" RENAME TO "InvoiceStatus";
DROP TYPE "public"."InvoiceStatus_old";
ALTER TABLE "invoices" ALTER COLUMN "status" SET DEFAULT 'UNPAID';
COMMIT;

-- AlterEnum
BEGIN;
CREATE TYPE "UserRole_new" AS ENUM ('SUPER_ADMIN', 'OWNER', 'MANAGER');
ALTER TABLE "public"."users" ALTER COLUMN "role" DROP DEFAULT;
ALTER TABLE "users" ALTER COLUMN "role" TYPE "UserRole_new" USING ("role"::text::"UserRole_new");
ALTER TYPE "UserRole" RENAME TO "UserRole_old";
ALTER TYPE "UserRole_new" RENAME TO "UserRole";
DROP TYPE "public"."UserRole_old";
ALTER TABLE "users" ALTER COLUMN "role" SET DEFAULT 'MANAGER';
COMMIT;

-- DropIndex
DROP INDEX "invoices_branchId_sequenceNumber_key";

-- DropIndex
DROP INDEX "quotations_branchId_sequenceNumber_key";

-- AlterTable
ALTER TABLE "branches" DROP COLUMN "signatureType",
ADD COLUMN     "themeConfig" JSONB;

-- AlterTable
ALTER TABLE "invoices" ALTER COLUMN "status" SET DEFAULT 'UNPAID';

-- AlterTable
ALTER TABLE "users" ALTER COLUMN "role" SET DEFAULT 'MANAGER';

-- DropEnum
DROP TYPE "SignatureType";

-- CreateTable
CREATE TABLE "subscription_plans" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "rank" "PlanRank" NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "displayOrder" INTEGER NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "isRecommended" BOOLEAN NOT NULL DEFAULT false,
    "price" DOUBLE PRECISION NOT NULL,
    "billingCycle" "BillingCycle" NOT NULL,
    "quotationLimit" INTEGER NOT NULL DEFAULT 0,
    "invoiceLimit" INTEGER NOT NULL DEFAULT 0,
    "customerLimit" INTEGER NOT NULL DEFAULT 0,
    "productLimit" INTEGER NOT NULL DEFAULT 0,
    "branchLimit" INTEGER NOT NULL DEFAULT 0,
    "staffLimit" INTEGER NOT NULL DEFAULT 0,
    "whatsappMessageLimit" INTEGER NOT NULL DEFAULT 0,
    "customQuotationThemes" BOOLEAN NOT NULL DEFAULT false,
    "customInvoiceThemes" BOOLEAN NOT NULL DEFAULT false,
    "whatsappIntegration" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "subscription_plans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "company_subscriptions" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "planId" TEXT NOT NULL,
    "status" "SubscriptionStatus" NOT NULL DEFAULT 'TRIAL',
    "startDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiryDate" TIMESTAMP(3) NOT NULL,
    "paymentId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "company_subscriptions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "subscription_payments" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "planId" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'INR',
    "razorpayOrderId" TEXT NOT NULL DEFAULT '',
    "razorpayPaymentId" TEXT NOT NULL DEFAULT '',
    "razorpaySignature" TEXT NOT NULL DEFAULT '',
    "status" "SubPaymentStatus" NOT NULL DEFAULT 'PENDING',
    "paymentDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "subscription_payments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "company_usage" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "quotationsUsed" INTEGER NOT NULL DEFAULT 0,
    "invoicesUsed" INTEGER NOT NULL DEFAULT 0,
    "customersUsed" INTEGER NOT NULL DEFAULT 0,
    "productsUsed" INTEGER NOT NULL DEFAULT 0,
    "whatsappMessagesSent" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "company_usage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "type" "NotificationType" NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "document_settings" (
    "id" TEXT NOT NULL,
    "branchId" TEXT NOT NULL,
    "type" "DocumentType" NOT NULL,
    "prefix" TEXT NOT NULL,
    "nextNumber" INTEGER NOT NULL DEFAULT 1,
    "topMessage" TEXT NOT NULL,
    "bottomMessage" TEXT NOT NULL,
    "terms" TEXT NOT NULL,
    "showSku" BOOLEAN NOT NULL DEFAULT false,
    "showHsn" BOOLEAN NOT NULL DEFAULT true,
    "paymentMethod" TEXT,

    CONSTRAINT "document_settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "whatsapp_settings" (
    "id" TEXT NOT NULL,
    "branchId" TEXT NOT NULL,
    "instanceId" TEXT NOT NULL,
    "accessToken" TEXT NOT NULL,
    "autoSendInvoice" BOOLEAN NOT NULL DEFAULT true,
    "attachPdf" BOOLEAN NOT NULL DEFAULT true,
    "selectedTemplate" TEXT NOT NULL DEFAULT 'standard',
    "invoiceTemplate" TEXT NOT NULL,
    "quotationTemplate" TEXT NOT NULL,
    "isLinked" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "whatsapp_settings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "subscription_plans_displayOrder_key" ON "subscription_plans"("displayOrder");

-- CreateIndex
CREATE UNIQUE INDEX "company_subscriptions_companyId_key" ON "company_subscriptions"("companyId");

-- CreateIndex
CREATE UNIQUE INDEX "company_usage_companyId_key" ON "company_usage"("companyId");

-- CreateIndex
CREATE UNIQUE INDEX "document_settings_branchId_type_key" ON "document_settings"("branchId", "type");

-- CreateIndex
CREATE UNIQUE INDEX "whatsapp_settings_branchId_key" ON "whatsapp_settings"("branchId");

-- CreateIndex
CREATE UNIQUE INDEX "invoices_branchId_invoiceNumber_key" ON "invoices"("branchId", "invoiceNumber");

-- CreateIndex
CREATE UNIQUE INDEX "quotations_branchId_quotationNumber_key" ON "quotations"("branchId", "quotationNumber");

-- AddForeignKey
ALTER TABLE "company_subscriptions" ADD CONSTRAINT "company_subscriptions_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "company_subscriptions" ADD CONSTRAINT "company_subscriptions_planId_fkey" FOREIGN KEY ("planId") REFERENCES "subscription_plans"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subscription_payments" ADD CONSTRAINT "subscription_payments_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "company_usage" ADD CONSTRAINT "company_usage_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "document_settings" ADD CONSTRAINT "document_settings_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "branches"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "whatsapp_settings" ADD CONSTRAINT "whatsapp_settings_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "branches"("id") ON DELETE CASCADE ON UPDATE CASCADE;
