-- AlterTable
ALTER TABLE "PlaylistTrack" ADD COLUMN     "addedById" TEXT;

-- CreateTable
CREATE TABLE "PlaylistCollaborator" (
    "id" TEXT NOT NULL,
    "status" "FriendshipStatus" NOT NULL DEFAULT 'PENDING',
    "playlistId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "PlaylistCollaborator_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PlaylistCollaborator_playlistId_userId_key" ON "PlaylistCollaborator"("playlistId", "userId");

-- AddForeignKey
ALTER TABLE "PlaylistTrack" ADD CONSTRAINT "PlaylistTrack_addedById_fkey" FOREIGN KEY ("addedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlaylistCollaborator" ADD CONSTRAINT "PlaylistCollaborator_playlistId_fkey" FOREIGN KEY ("playlistId") REFERENCES "Playlist"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlaylistCollaborator" ADD CONSTRAINT "PlaylistCollaborator_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
