/*
  Warnings:

  - You are about to drop the column `resolvedAt` on the `decisions` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "decisions" DROP COLUMN "resolvedAt",
ADD COLUMN     "closedAt" TIMESTAMP(3),
ADD COLUMN     "closureReason" TEXT,
ADD COLUMN     "supersedesDecisionId" TEXT;

-- AddForeignKey
ALTER TABLE "decisions" ADD CONSTRAINT "decisions_supersedesDecisionId_fkey" FOREIGN KEY ("supersedesDecisionId") REFERENCES "decisions"("id") ON DELETE SET NULL ON UPDATE CASCADE;
