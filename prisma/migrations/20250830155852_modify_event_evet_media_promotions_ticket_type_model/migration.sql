/*
  Warnings:

  - You are about to drop the column `format` on the `Event` table. All the data in the column will be lost.
  - You are about to drop the column `discountPercentage` on the `Promotion` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[code]` on the table `Promotion` will be added. If there are existing duplicate values, this will fail.
  - Changed the type of `category` on the `Event` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Added the required column `discountType` to the `Promotion` table without a default value. This is not possible if the table is not empty.
  - Added the required column `discountValue` to the `Promotion` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "public"."DiscountType" AS ENUM ('percentage', 'fixed_amount');

-- AlterTable
ALTER TABLE "public"."Event" DROP COLUMN "format",
DROP COLUMN "category",
ADD COLUMN     "category" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "public"."Promotion" DROP COLUMN "discountPercentage",
ADD COLUMN     "code" TEXT,
ADD COLUMN     "discountType" "public"."DiscountType" NOT NULL,
ADD COLUMN     "discountValue" INTEGER NOT NULL,
ADD COLUMN     "maxDiscountAmount" INTEGER,
ADD COLUMN     "minPurchaseAmount" INTEGER;

-- DropEnum
DROP TYPE "public"."EventCategory";

-- DropEnum
DROP TYPE "public"."EventFormat";

-- CreateTable
CREATE TABLE "public"."EventMedia" (
    "id" BIGSERIAL NOT NULL,
    "eventId" BIGINT NOT NULL,
    "url" TEXT NOT NULL,

    CONSTRAINT "EventMedia_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Promotion_code_key" ON "public"."Promotion"("code");

-- AddForeignKey
ALTER TABLE "public"."EventMedia" ADD CONSTRAINT "EventMedia_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "public"."Event"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
