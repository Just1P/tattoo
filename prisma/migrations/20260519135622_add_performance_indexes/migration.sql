-- CreateIndex
CREATE INDEX "ArtistFollower_userId_idx" ON "ArtistFollower"("userId");

-- CreateIndex
CREATE INDEX "Booking_artistId_status_idx" ON "Booking"("artistId", "status");

-- CreateIndex
CREATE INDEX "Booking_userId_status_idx" ON "Booking"("userId", "status");

-- CreateIndex
CREATE INDEX "ConversationParticipant_userId_idx" ON "ConversationParticipant"("userId");

-- CreateIndex
CREATE INDEX "Message_conversationId_createdAt_idx" ON "Message"("conversationId", "createdAt");

-- CreateIndex
CREATE INDEX "Message_senderId_readAt_idx" ON "Message"("senderId", "readAt");

-- CreateIndex
CREATE INDEX "Tattoo_artistId_pinned_position_idx" ON "Tattoo"("artistId", "pinned", "position");

-- CreateIndex
CREATE INDEX "Tattoo_styleId_createdAt_idx" ON "Tattoo"("styleId", "createdAt");

-- CreateIndex
CREATE INDEX "Tattoo_createdAt_idx" ON "Tattoo"("createdAt");

-- CreateIndex
CREATE INDEX "TattooArtist_verified_createdAt_idx" ON "TattooArtist"("verified", "createdAt");
