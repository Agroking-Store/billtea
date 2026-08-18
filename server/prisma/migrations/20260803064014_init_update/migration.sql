/*
  Warnings:

  - You are about to drop the column `tax` on the `branches` table. All the data in the column will be lost.
  - You are about to drop the column `taxLabel` on the `branches` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "branches" DROP COLUMN "tax",
DROP COLUMN "taxLabel",
ADD COLUMN     "accountName" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "taxes" JSONB NOT NULL DEFAULT '[]';

-- AlterTable
ALTER TABLE "companies" ADD COLUMN     "tagline" TEXT NOT NULL DEFAULT '';

-- CreateTable
CREATE TABLE "theme_settings" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "lightTheme" JSONB NOT NULL DEFAULT '{}',
    "darkTheme" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "theme_settings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "theme_settings_companyId_key" ON "theme_settings"("companyId");

-- AddForeignKey
ALTER TABLE "theme_settings" ADD CONSTRAINT "theme_settings_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;
