import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

// Ajouter un morceau à une playlist
export async function addTrack(
  playlistId: string,
  title: string,
  sourceId: string,
  artist?: string,
) {
  if (!title) throw new Error('Le titre est obligatoire');
  if (!sourceId) throw new Error('Le sourceId est obligatoire');

  const track = await prisma.track.create({
    data: {
      title: title,
      sourceId: sourceId, // le videoId YouTube
      artist: artist,
      playlistId: playlistId, // à quelle playlist il appartient
    },
  });
  return track;
}

// Lister les morceaux d'une playlist
export async function getTracks(playlistId: string) {
  return await prisma.track.findMany({
    where: { playlistId: playlistId }, // filtre : seulement cette playlist
  });
}
