/*
  Warnings:

  - You are about to drop the column `notes` on the `Booking` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Booking" DROP COLUMN "notes",
ADD COLUMN     "artistNote" TEXT,
ADD COLUMN     "bodyPart" TEXT,
ADD COLUMN     "description" TEXT,
ADD COLUMN     "referenceUrls" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "size" TEXT,
ADD COLUMN     "tattooType" TEXT,
ALTER COLUMN "startAt" DROP NOT NULL,
ALTER COLUMN "endAt" DROP NOT NULL;
