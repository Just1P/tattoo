-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('booking_request', 'booking_confirmed', 'booking_cancelled', 'new_follower');

-- AlterTable: cast TEXT → enum via colonne temporaire
ALTER TABLE "Notification" ADD COLUMN "type_new" "NotificationType";
UPDATE "Notification" SET "type_new" = "type"::"NotificationType";
ALTER TABLE "Notification" DROP COLUMN "type";
ALTER TABLE "Notification" RENAME COLUMN "type_new" TO "type";
ALTER TABLE "Notification" ALTER COLUMN "type" SET NOT NULL;

-- CreateIndex
CREATE INDEX "Notification_userId_read_createdAt_idx" ON "Notification"("userId", "read", "createdAt");
