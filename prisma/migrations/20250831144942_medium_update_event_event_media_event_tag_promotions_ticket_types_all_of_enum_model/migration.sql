/*
  Warnings:

  - The values [percentage,fixed_amount] on the enum `DiscountType` will be removed. If these variants are still used in the database, this will fail.
  - The values [draft,published,completed,cancelled] on the enum `EventStatus` will be removed. If these variants are still used in the database, this will fail.
  - The values [qr_code,bank_transfer] on the enum `PaymentMethod` will be removed. If these variants are still used in the database, this will fail.
  - The values [active,expired,redeemed] on the enum `ReferralStatus` will be removed. If these variants are still used in the database, this will fail.
  - The values [daily,monthly,yearly] on the enum `ReportType` will be removed. If these variants are still used in the database, this will fail.
  - The values [customer,event_organizer,admin] on the enum `UserRole` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `eventType` on the `Event` table. All the data in the column will be lost.
  - You are about to drop the column `price` on the `Event` table. All the data in the column will be lost.
  - You are about to drop the column `name` on the `EventTag` table. All the data in the column will be lost.
  - You are about to drop the `Ticket` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[tag]` on the table `EventTag` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `venue` to the `Event` table without a default value. This is not possible if the table is not empty.
  - Added the required column `tag` to the `EventTag` table without a default value. This is not possible if the table is not empty.
  - Changed the type of `promoType` on the `Promotion` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- CreateEnum
CREATE TYPE "public"."TicketType" AS ENUM ('FREE', 'PAID');

-- AlterEnum
BEGIN;
CREATE TYPE "public"."DiscountType_new" AS ENUM ('PERCENTAGE', 'FIXED_AMOUNT');
ALTER TABLE "public"."Promotion" ALTER COLUMN "discountType" TYPE "public"."DiscountType_new" USING ("discountType"::text::"public"."DiscountType_new");
ALTER TYPE "public"."DiscountType" RENAME TO "DiscountType_old";
ALTER TYPE "public"."DiscountType_new" RENAME TO "DiscountType";
DROP TYPE "public"."DiscountType_old";
COMMIT;

-- AlterEnum
BEGIN;
CREATE TYPE "public"."EventStatus_new" AS ENUM ('DRAFT', 'PUBLISHED', 'COMPLETED', 'CANCELLED');
ALTER TABLE "public"."Event" ALTER COLUMN "status" TYPE "public"."EventStatus_new" USING ("status"::text::"public"."EventStatus_new");
ALTER TYPE "public"."EventStatus" RENAME TO "EventStatus_old";
ALTER TYPE "public"."EventStatus_new" RENAME TO "EventStatus";
DROP TYPE "public"."EventStatus_old";
COMMIT;

-- AlterEnum
BEGIN;
CREATE TYPE "public"."PaymentMethod_new" AS ENUM ('QR_CODE', 'BANK_TRANSFER');
ALTER TABLE "public"."Transaction" ALTER COLUMN "paymentMethod" TYPE "public"."PaymentMethod_new" USING ("paymentMethod"::text::"public"."PaymentMethod_new");
ALTER TYPE "public"."PaymentMethod" RENAME TO "PaymentMethod_old";
ALTER TYPE "public"."PaymentMethod_new" RENAME TO "PaymentMethod";
DROP TYPE "public"."PaymentMethod_old";
COMMIT;

-- AlterEnum
BEGIN;
CREATE TYPE "public"."ReferralStatus_new" AS ENUM ('ACTIVE', 'EXPIRED', 'REDEEMED');
ALTER TABLE "public"."ReferralTransaction" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "public"."ReferralTransaction" ALTER COLUMN "status" TYPE "public"."ReferralStatus_new" USING ("status"::text::"public"."ReferralStatus_new");
ALTER TYPE "public"."ReferralStatus" RENAME TO "ReferralStatus_old";
ALTER TYPE "public"."ReferralStatus_new" RENAME TO "ReferralStatus";
DROP TYPE "public"."ReferralStatus_old";
ALTER TABLE "public"."ReferralTransaction" ALTER COLUMN "status" SET DEFAULT 'ACTIVE';
COMMIT;

-- AlterEnum
BEGIN;
CREATE TYPE "public"."ReportType_new" AS ENUM ('DAILY', 'MONTHLY', 'YEAR');
ALTER TABLE "public"."Dashboard" ALTER COLUMN "reportType" TYPE "public"."ReportType_new" USING ("reportType"::text::"public"."ReportType_new");
ALTER TYPE "public"."ReportType" RENAME TO "ReportType_old";
ALTER TYPE "public"."ReportType_new" RENAME TO "ReportType";
DROP TYPE "public"."ReportType_old";
COMMIT;

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "public"."TransactionStatus" ADD VALUE 'PENDING';
ALTER TYPE "public"."TransactionStatus" ADD VALUE 'SUCCESS';
ALTER TYPE "public"."TransactionStatus" ADD VALUE 'FAILED';
ALTER TYPE "public"."TransactionStatus" ADD VALUE 'REFUNDED';

-- AlterEnum
BEGIN;
CREATE TYPE "public"."UserRole_new" AS ENUM ('CUSTOMER', 'EVENT_ORGANIZER', 'ADMIN');
ALTER TABLE "public"."User" ALTER COLUMN "role" DROP DEFAULT;
ALTER TABLE "public"."User" ALTER COLUMN "role" TYPE "public"."UserRole_new" USING ("role"::text::"public"."UserRole_new");
ALTER TYPE "public"."UserRole" RENAME TO "UserRole_old";
ALTER TYPE "public"."UserRole_new" RENAME TO "UserRole";
DROP TYPE "public"."UserRole_old";
ALTER TABLE "public"."User" ALTER COLUMN "role" SET DEFAULT 'CUSTOMER';
COMMIT;

-- DropForeignKey
ALTER TABLE "public"."Ticket" DROP CONSTRAINT "Ticket_eventId_fkey";

-- DropForeignKey
ALTER TABLE "public"."Ticket" DROP CONSTRAINT "Ticket_userId_fkey";

-- DropForeignKey
ALTER TABLE "public"."Transaction" DROP CONSTRAINT "Transaction_ticketId_fkey";

-- DropIndex
DROP INDEX "public"."EventTag_name_key";

-- AlterTable
ALTER TABLE "public"."Event" DROP COLUMN "eventType",
DROP COLUMN "price",
ADD COLUMN     "venue" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "public"."EventTag" DROP COLUMN "name",
ADD COLUMN     "deletedAt" TIMESTAMP(3),
ADD COLUMN     "tag" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "public"."Promotion" DROP COLUMN "promoType",
ADD COLUMN     "promoType" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "public"."ReferralTransaction" ALTER COLUMN "status" SET DEFAULT 'ACTIVE';

-- AlterTable
ALTER TABLE "public"."User" ALTER COLUMN "role" SET DEFAULT 'CUSTOMER';

-- DropTable
DROP TABLE "public"."Ticket";

-- DropEnum
DROP TYPE "public"."EventType";

-- DropEnum
DROP TYPE "public"."PromoType";

-- DropEnum
DROP TYPE "public"."TicketStatus";

-- CreateTable
CREATE TABLE "public"."TicketTypes" (
    "id" BIGSERIAL NOT NULL,
    "eventId" BIGINT NOT NULL,
    "name" TEXT NOT NULL,
    "price" INTEGER NOT NULL,
    "quantity" INTEGER NOT NULL,
    "description" TEXT NOT NULL,
    "ticketType" "public"."TicketType" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "TicketTypes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "EventTag_tag_key" ON "public"."EventTag"("tag");

-- AddForeignKey
ALTER TABLE "public"."TicketTypes" ADD CONSTRAINT "TicketTypes_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "public"."Event"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Transaction" ADD CONSTRAINT "Transaction_ticketId_fkey" FOREIGN KEY ("ticketId") REFERENCES "public"."TicketTypes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
