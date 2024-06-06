-- AlterTable
ALTER TABLE "teams" ADD COLUMN     "deletedAt" TIMESTAMP(3),
ADD COLUMN     "deletedById" TEXT,
ADD COLUMN     "isDeleted" BOOLEAN NOT NULL DEFAULT false;
