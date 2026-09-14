import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Image,
    Platform,
    ScrollView,
} from "react-native";

import { SafeAreaView } from "react-native-safe-area-context";

import {
    ChevronLeft,
    Plus,
    Home,
    Search,
    Disc3,
    User,
} from "lucide-react-native";

import { useLocalSearchParams, useRouter } from "expo-router";

import { COLORS, FONTS } from "@/constants";

import { useEffect, useState } from "react";

const mockRecommendedTracks = [
    {
        id: "1",
        title: "Title 1",
        artist: "Playlist by Music-Room",
        imageUrl:
            "https://m.media-amazon.com/images/I/71G7k2qQKXL._SL1200_.jpg",
    },
    {
        id: "2",
        title: "Title 2",
        artist: "Playlist by Faustoche",
        imageUrl:
            "https://m.media-amazon.com/images/I/71vX4qQ7QML._SL1200_.jpg",
    },
    {
        id: "3",
        title: "Title 3",
        artist: "Playlist by Faustoche",
        imageUrl:
            "https://m.media-amazon.com/images/I/71z7Qq7QKML._SL1200_.jpg",
    },
    {
        id: "4",
        title: "Title 4",
        artist: "Playlist by user3423957",
        imageUrl:
            "https://m.media-amazon.com/images/I/71G7k2qQKXL._SL1200_.jpg",
    },
    {
        id: "5",
        title: "Title 5",
        artist: "Playlist by Faustoche",
        imageUrl:
            "https://m.media-amazon.com/images/I/71vX4qQ7QML._SL1200_.jpg",
    },
];

export default function Playlist() {
    const { id } = useLocalSearchParams();
    const router = useRouter();

    const [playlistName, setPlaylistName] = useState("");
    const [playlistTracks, setPlaylistTracks] = useState<any[]>([]);
    const [addedTrackIds, setAddedTrackIds] = useState<string[]>([]);

    const apiUrl =
        Platform.OS === "android"
            ? "http://10.0.2.2:3000"
            : "http://localhost:3000";

    useEffect(() => {
        const fetchPlaylist = async () => {
            try {
                const response = await fetch(
                    `${apiUrl}/playlists/${id}`
                );

                const data = await response.json();

                setPlaylistName(data.name);

                if (data.tracks) {
                    setPlaylistTracks(data.tracks);
                }
            } catch (error) {
                console.error(error);
            }
        };

        fetchPlaylist();
    }, [id]);

    const handleAddTrack = async (trackId: string) => {
        try {
            const response = await fetch(
                `${apiUrl}/playlists/${id}/tracks`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        trackId: trackId,
                    }),
                }
            );

            if (response.ok) {
                setAddedTrackIds((current) => [
                    ...current,
                    trackId,
                ]);

                setPlaylistTracks((current) => [
                    ...current,
                    mockRecommendedTracks.find(
                        (track) => track.id === trackId
                    ),
                ]);
            }
        } catch (error) {
            console.error(error);
        }
    };

    return (
        <SafeAreaView style={styles.safeArea}>
            <View style={styles.container}>
                <ScrollView
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={styles.scrollContent}
                >
                    {/* HEADER */}
                    <View style={styles.header}>
                        <TouchableOpacity
                            onPress={() => router.back()}
                            style={styles.backButton}
                        >
                            <ChevronLeft
                                size={28}
                                color={COLORS.textPrimary}
                            />
                        </TouchableOpacity>
                    </View>

                    {/* PLAYLIST INFO */}
                    <View style={styles.playlistInfo}>
                        <View style={styles.cover} />

                        <View style={styles.playlistDetails}>
                            <Text style={styles.playlistTitle}>
                                {playlistName || "Playlist's name"}
                            </Text>

                            <Text style={styles.playlistAuthor}>
                                Playlist by Faustoche
                            </Text>
                        </View>
                    </View>

                    {/* BUTTONS */}
                    <View style={styles.buttonsContainer}>
                        <TouchableOpacity style={styles.infoButton}>
                            <Text style={styles.infoButtonText}>
                                Name and informations
                            </Text>
                        </TouchableOpacity>

                        {playlistTracks.length > 0 && (
                            <TouchableOpacity style={styles.infoButton}>
                                <Text style={styles.infoButtonText}>
                                    + Add titles
                                </Text>
                            </TouchableOpacity>
                        )}
                    </View>

                    {/* DIVIDER */}
                    <View style={styles.divider} />

                    {/* EMPTY PLAYLIST */}
                    {playlistTracks.length === 0 && (
                        <View style={styles.emptyState}>
                            <Text style={styles.emptyText}>
                                No titles yet
                            </Text>
                        </View>
                    )}

                    {/* ADD TITLES */}
                    {playlistTracks.length === 0 && (
                        <TouchableOpacity
                            style={styles.addTitlesButton}
                        >
                            <Text style={styles.addTitlesText}>
                                Add new titles
                            </Text>
                        </TouchableOpacity>
                    )}

                    {/* RECOMMENDED */}
                    <Text style={styles.sectionTitle}>
                        Recommended titles
                    </Text>

                    <View style={styles.tracksList}>
                        {mockRecommendedTracks.map((track) => {
                            const isAdded =
                                addedTrackIds.includes(track.id);

                            return (
                                <View
                                    key={track.id}
                                    style={styles.trackItem}
                                >
                                    <Image
                                        source={{
                                            uri: track.imageUrl,
                                        }}
                                        style={styles.trackImage}
                                    />

                                    <View style={styles.trackInfo}>
                                        <Text
                                            style={styles.trackTitle}
                                            numberOfLines={1}
                                        >
                                            {track.title}
                                        </Text>

                                        <Text
                                            style={styles.trackArtist}
                                            numberOfLines={1}
                                        >
                                            {track.artist}
                                        </Text>
                                    </View>

                                    <TouchableOpacity
                                        style={styles.addButton}
                                        onPress={() =>
                                            handleAddTrack(track.id)
                                        }
                                        disabled={isAdded}
                                    >
                                        {!isAdded && (
                                            <Plus
                                                size={22}
                                                color={
                                                    COLORS.textPrimary
                                                }
                                            />
                                        )}
                                    </TouchableOpacity>
                                </View>
                            );
                        })}
                    </View>
                </ScrollView>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: COLORS.background,
    },

    container: {
        flex: 1,
    },

    scrollContent: {
        paddingHorizontal: 24,
        paddingBottom: 110,
    },

    header: {
        height: 55,
        justifyContent: "center",
    },

    backButton: {
        width: 40,
        height: 40,
        justifyContent: "center",
        alignItems: "flex-start",
    },

    playlistInfo: {
        flexDirection: "row",
        alignItems: "center",
        marginTop: 8,
    },

    cover: {
        width: 92,
        height: 96,
        borderRadius: 5,
        backgroundColor: "#929292",
    },

    playlistDetails: {
        marginLeft: 28,
        flex: 1,
    },

    playlistTitle: {
        fontFamily: FONTS.semiBold,
        fontSize: 20,
        color: COLORS.textPrimary,
        marginBottom: 8,
    },

    playlistAuthor: {
        fontFamily: FONTS.regular,
        fontSize: 14,
        color: COLORS.textPrimary,
    },

    buttonsContainer: {
        flexDirection: "row",
        alignItems: "center",
        gap: 10,
        marginTop: 12,
    },

    infoButton: {
        alignSelf: "flex-start",
        paddingHorizontal: 18,
        paddingVertical: 7,
        borderRadius: 20,
        backgroundColor: "#FBEAC7",
    },

    infoButtonText: {
        fontFamily: FONTS.semiBold,
        fontSize: 12,
        color: "#E7A500",
    },

    divider: {
        height: 1,
        backgroundColor: "#E2E2E2",
        marginTop: 8,
    },

    emptyState: {
        alignItems: "center",
        marginTop: 20,
    },

    emptyText: {
        fontFamily: FONTS.regular,
        fontSize: 14,
        color: COLORS.textMuted,
    },

    addTitlesButton: {
        height: 49,
        borderRadius: 25,
        backgroundColor: "#FBEAC7",
        justifyContent: "center",
        alignItems: "center",
        marginTop: 26,
        marginHorizontal: 50,
    },

    addTitlesText: {
        fontFamily: FONTS.semiBold,
        fontSize: 14,
        color: "#E7A500",
    },

    sectionTitle: {
        fontFamily: FONTS.semiBold,
        fontSize: 20,
        color: COLORS.textPrimary,
        marginTop: 43,
        marginBottom: 28,
    },

    tracksList: {
        gap: 10,
    },

    trackItem: {
        flexDirection: "row",
        alignItems: "center",
        minHeight: 56,
    },

    trackImage: {
        width: 56,
        height: 56,
        borderRadius: 5,
    },

    trackInfo: {
        flex: 1,
        marginLeft: 12,
        paddingRight: 8,
    },

    trackTitle: {
        fontFamily: FONTS.semiBold,
        fontSize: 14,
        color: COLORS.textPrimary,
        marginBottom: 3,
    },

    trackArtist: {
        fontFamily: FONTS.regular,
        fontSize: 13,
        color: COLORS.textPrimary,
    },

    addButton: {
        width: 35,
        height: 35,
        justifyContent: "center",
        alignItems: "center",
    },

    bottomNav: {
        position: "absolute",
        bottom: 0,
        left: 24,
        right: 24,
        height: 61,
        borderRadius: 32,
        backgroundColor: "#FFFFFF",
        borderWidth: 1,
        borderColor: "#DDDDDD",
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-around",
        paddingHorizontal: 8,
    },

    navItem: {
        width: 50,
        height: 50,
        alignItems: "center",
        justifyContent: "center",
    },

    activeNavItem: {
        width: 54,
        height: 54,
        borderRadius: 27,
        backgroundColor: "#FBEAC7",
    },
});
