/*
  Warnings:

  - You are about to drop the column `points` on the `User` table. All the data in the column will be lost.
  - Changed the type of `ticketType` on the `Ticket` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- CreateEnum
CREATE TYPE "public"."ReferralStatus" AS ENUM ('active', 'expired', 'redeemed');

-- AlterEnum
ALTER TYPE "public"."PromoType" ADD VALUE 'event_based';

-- DropForeignKey
ALTER TABLE "public"."Promotion" DROP CONSTRAINT "Promotion_eventId_fkey";

-- AlterTable
ALTER TABLE "public"."Promotion" ADD COLUMN     "isActive" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "usedQuota" INTEGER NOT NULL DEFAULT 0,
ALTER COLUMN "eventId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "public"."ReferralTransaction" ADD COLUMN     "status" "public"."ReferralStatus" NOT NULL DEFAULT 'active';

-- AlterTable
ALTER TABLE "public"."Ticket" DROP COLUMN "ticketType",
ADD COLUMN     "ticketType" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "public"."User" DROP COLUMN "points",
ADD COLUMN     "referralPoints" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "referredBy" TEXT;

-- DropEnum
DROP TYPE "public"."TicketType";

-- AddForeignKey
ALTER TABLE "public"."Promotion" ADD CONSTRAINT "Promotion_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "public"."Event"("id") ON DELETE SET NULL ON UPDATE CASCADE;
