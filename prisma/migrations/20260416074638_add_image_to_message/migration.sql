-- AlterTable
ALTER TABLE "Message" ADD COLUMN     "imageUrl" VARCHAR(500),
ALTER COLUMN "content" DROP NOT NULL;
