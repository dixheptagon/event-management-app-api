/*
  Warnings:

  - You are about to drop the `_EventTags` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `eventId` to the `EventTag` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "public"."_EventTags" DROP CONSTRAINT "_EventTags_A_fkey";

-- DropForeignKey
ALTER TABLE "public"."_EventTags" DROP CONSTRAINT "_EventTags_B_fkey";

-- AlterTable
ALTER TABLE "public"."EventTag" ADD COLUMN     "eventId" BIGINT NOT NULL;

-- DropTable
DROP TABLE "public"."_EventTags";

-- AddForeignKey
ALTER TABLE "public"."EventTag" ADD CONSTRAINT "EventTag_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "public"."Event"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
