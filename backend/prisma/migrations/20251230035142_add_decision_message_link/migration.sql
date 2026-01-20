/*
  Warnings:

  - A unique constraint covering the columns `[messageId]` on the table `decisions` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "decisions" ADD COLUMN     "messageId" TEXT,
ALTER COLUMN "status" SET DEFAULT 'OPEN';

-- CreateIndex
CREATE UNIQUE INDEX "decisions_messageId_key" ON "decisions"("messageId");

-- AddForeignKey
ALTER TABLE "decisions" ADD CONSTRAINT "decisions_messageId_fkey" FOREIGN KEY ("messageId") REFERENCES "messages"("id") ON DELETE SET NULL ON UPDATE CASCADE;
