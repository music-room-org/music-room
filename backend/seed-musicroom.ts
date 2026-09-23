import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const TRACK_IDS: string[] = [
    '050d6e5b-0ab6-4c4d-9cd7-be89bf151956',
    'c3a725b7-a151-445d-a217-6b0bf0ec5bd4',
    'ef68d65d-8fde-4626-853a-683873873313',
    '307d1d11-f2c1-4201-8f62-9db6a82d84c2',
    '06ec90a5-6ed4-4b42-9886-a4e4ddeff2f4',
    '0e9b833d-4b29-4be7-ab4f-05019d3ff8f2',
    '6ece2420-f892-4565-9bb1-0b95e5e8aa97',
    '1074b25b-a799-495c-ba69-91286422b559',
    '8bac776e-0e4d-4a53-b3ac-82fd38ce1168',
    '9a06f867-a31c-4c7b-9b54-a992e9ab947a',
    '965bd67a-760a-4ac9-a4a2-25ad34d11348',
    '135ed451-4b04-4de3-8763-fbf211201597',
    '8f66dc5e-3af6-4c1d-aa9f-24817bb5f879',
    '8755b03d-ba22-4493-a3bb-2b177545552a',
    'b3916348-e1a0-43ec-86ad-864013677605',
    'c0aea8b6-b462-4f93-9af9-0382318c4c46',
    '609fd4ee-ebce-4949-878e-2e79c7ad1fcf',
    '9ae740fb-68cd-477c-895a-4738597e0fd1',
    '751c4951-5306-4242-a6cc-1a290e21e518',
    '66c3b2e2-5e74-4766-af67-140e43e65b67',
    'd028b527-5a09-4971-a0e1-ca1b1dbe4eea',
    'f984a2a9-ceca-4b07-b57c-d6e1ded01ab3',
    '03deba7d-1f35-46d2-ba87-f8b7b4f5c089',
    '9887403a-4174-45ba-af16-55a2696ade31',
    '4fd49709-ccfb-4ef3-92e2-360619f821bc',
    '5dfe4d39-ca5b-4f37-b9e3-41ab8fb6d09b',
    '76dd1304-96f3-45a6-957f-8e9ae82b8ed1',
    '9119005b-9fba-4a57-9d15-cc03eb4f9f56',
    '5742f105-68e1-4ae9-8f9a-561d00dce5fa',
    '8f115206-3a83-412a-b419-1ce5a6c90bc6',
    '765bc88e-aea1-45ff-bb82-ab3f370f95d0',
    'd1d105b4-dfd2-4229-a5bf-ca58e4ffa681',
    '57259034-10d5-46fc-a1c3-6037ee36fb02',
    '8dc169b0-0d88-4a75-906c-926be1a73f7c',
    'fcf28c24-0239-4790-92de-434a79c6ce44',
    'bc07289d-2912-4da6-b97d-e1aa97389ca2',
    'd63f5a98-8aef-4555-99e0-f27c103ad538',
    '87af2f33-12bd-40ce-b7ca-f9b4c36e88ec',
    '254c57d3-e40f-4782-9360-1e24f05e2ab1',
    '078a5dbf-5965-435b-b6cb-b2d3cbdb1d0a',
    '1323c133-0ef1-4493-9351-78c0e9e596d5',
    '0c988082-3509-49f6-a536-456457af57ca',
    '04138dc6-4c83-438d-91ee-955d642dd247',
    '8e71906b-f5f0-4279-819e-c3fdea727793',
    'cec3a8f4-38f0-49fa-92cb-ffd5ece58da5',
    'ba95f5b2-d171-483c-94d8-2185367b13e9',
    '3e879a0f-a769-4da1-844c-e280aba81338',
    '76235231-2ffe-4b3d-8ace-f4878b4de9ea',
    '2047eb02-d0ef-4c97-9f7f-49aea7a59124',
    '5489358b-570a-4e26-ad94-f1ed2200393c',
];

async function main(): Promise<void> {
    // 1. Créer ou récupérer le compte officiel Music-Room
    const systemUser = await prisma.user.upsert({
        where: { email: 'admin@music-room.com' },
        update: {},
        create: {
            email: 'admin@music-room.com',
            username: 'Music-Room',
            emailVerified: true,
            profileImage: 'https://cdn-icons-png.flaticon.com/512/3844/3844724.png',
        },
    });

    console.log(`Utilisateur système prêt : ${systemUser.username}`);

    // 2. Créer la playlist "2000's" (ou la récupérer si elle existe déjà)
    let playlist = await prisma.playlist.findFirst({
        where: { name: "2000's", ownerId: systemUser.id },
    });

    if (!playlist) {
        playlist = await prisma.playlist.create({
            data: {
                name: "2000's",
                ownerId: systemUser.id,
                isPublic: true,
                imageUrl: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=800&q=80',
            },
        });
    }

    console.log(`Playlist prête : ${playlist.name}`);

    // 3. Lier les tracks à la playlist, dans l'ordre de la liste
    const result = await prisma.playlistTrack.createMany({
        data: TRACK_IDS.map((trackId, index) => ({
            playlistId: playlist!.id,
            trackId,
            position: index,
            addedById: systemUser.id,
        })),
        skipDuplicates: true,
    });

    console.log(`${result.count} titres ajoutés à la playlist.`);
    console.log('Script terminé avec succès !');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });