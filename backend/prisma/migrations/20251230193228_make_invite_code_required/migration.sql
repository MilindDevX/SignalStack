/*
  Warnings:

  - Made the column `inviteCode` on table `teams` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "teams" ALTER COLUMN "inviteCode" SET NOT NULL;
