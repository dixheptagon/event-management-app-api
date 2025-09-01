/*
  Warnings:

  - The values [pending,success,failed,refunded] on the enum `TransactionStatus` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "public"."TransactionStatus_new" AS ENUM ('PENDING', 'SUCCESS', 'FAILED', 'REFUNDED');
ALTER TABLE "public"."Transaction" ALTER COLUMN "status" TYPE "public"."TransactionStatus_new" USING ("status"::text::"public"."TransactionStatus_new");
ALTER TYPE "public"."TransactionStatus" RENAME TO "TransactionStatus_old";
ALTER TYPE "public"."TransactionStatus_new" RENAME TO "TransactionStatus";
DROP TYPE "public"."TransactionStatus_old";
COMMIT;
