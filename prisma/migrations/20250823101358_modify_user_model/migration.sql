-- AlterTable
ALTER TABLE "public"."User" ADD COLUMN     "verificationExpiry" TIMESTAMP(3),
ADD COLUMN     "verificationToken" TEXT;
