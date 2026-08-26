import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Créer une playlist
export async function createPlaylist(name: string, ownerId: string) {
  if (!name) throw new Error('Le nom de la playlist est obligatoire');

  const playlist = await prisma.playlist.create({
    data: {
      name: name,
      ownerId: ownerId,
    },
  });
  return playlist;
}

// Lister toutes les playlists
export async function getPlaylists() {
  const playlists = await prisma.playlist.findMany();
  return playlists;
}
