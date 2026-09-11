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

// Récupérer UNE playlist par son id
export async function getPlaylistById(id: string) {
  return await prisma.playlist.findUnique({
    where: { id: id },
  });
}

// Récupérer les playlists d'un utilisateur (les siennes)
export async function getMyPlaylists(ownerId: string) {
  return await prisma.playlist.findMany({
    where: { ownerId: ownerId },
  });
}

// Récupérer les playlists PUBLIQUES
export async function getPublicPlaylists() {
  return await prisma.playlist.findMany({
    where: { isPublic: true },
  });
}

// Playlists PUBLIQUES d'un autre utilisateur
export async function getUserPublicPlaylists(ownerId: string) {
  return await prisma.playlist.findMany({
    where: {
      ownerId: ownerId,
      isPublic: true,
    },
  });
}