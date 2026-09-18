import { View, Text, StyleSheet, TouchableOpacity, TextInput, Platform, ScrollView, Image, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ChevronLeft, ThumbsUp, Play, Plus, Search, Power } from "lucide-react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { COLORS, FONTS, API_BASE_URL } from "@/constants";
import { useState, useCallback, useEffect } from "react";
import * as SecureStore from "expo-secure-store";
import { usePlayer } from "@/context/PlayerContext";

async function getToken() {
    if (Platform.OS === "web") return localStorage.getItem("userToken");
    return await SecureStore.getItemAsync("userToken");
}

export default function LiveSession() {
    const { id } = useLocalSearchParams();
    const router = useRouter();
    const { playTrack } = usePlayer();

    const [sessionName, setSessionName] = useState("Loading Session...");
    const [tracks, setTracks] = useState<any[]>([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [searchResults, setSearchResults] = useState<any[]>([]);
    const [isSearching, setIsSearching] = useState(false);

    const apiUrl = Platform.OS === "android" ? "http://10.0.2.2:3000" : "http://localhost:3000";

    const fetchSession = useCallback(async () => {
        try {
            const token = await getToken();
            const response = await fetch(`${apiUrl}/live_session/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (response.ok) {
                const data = await response.json();
                setSessionName(data.name);
                if (data.liveSessionTracks) {
                    const sorted = data.liveSessionTracks.sort((a: any, b: any) => (b.votes?.length || 0) - (a.votes?.length || 0));
                    setTracks(sorted);
                }
            }
        } catch (error) {
            console.error(error);
        }
    }, [id]);

    useEffect(() => {
        fetchSession();
        const interval = setInterval(fetchSession, 3000);
        return () => clearInterval(interval);
    }, [fetchSession]);

    const handleVote = async (trackId: string) => {
        try {
            const token = await getToken();
            await fetch(`${apiUrl}/live_session/vote`, {
                method: "POST",
                headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                body: JSON.stringify({ sessionId: id, trackId })
            });
            fetchSession();
        } catch (err) {
            console.error(err);
        }
    };

    const handleNextTrack = async () => {
        try {
            const token = await getToken();
            const response = await fetch(`${apiUrl}/live_session/track/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (response.ok) {
                const nextTrackData = await response.json();
                playTrack(nextTrackData.track);
                fetchSession();
            } else {
                alert("No tracks in queue!");
            }
        } catch (err) {
            console.error(err);
        }
    };

    const handleSearch = async (text: string) => {
        setSearchQuery(text);
        if (!text.trim()) {
            setSearchResults([]);
            return;
        }
        try {
            setIsSearching(true);
            const res = await fetch(`${API_BASE_URL}/player/search?q=${encodeURIComponent(text)}`);
            if (res.ok) setSearchResults(await res.json());
        } catch (err) {} finally {
            setIsSearching(false);
        }
    };

    const handleAddTrack = async (track: any) => {
        try {
            const token = await getToken();
            const response = await fetch(`${apiUrl}/live_session/${id}/tracks`, {
                method: "POST",
                headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                body: JSON.stringify({ 
                    title: track.title, 
                    artist: track.artist || "Unknown Artist", 
                    sourceId: track.id 
                })
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ message: "Erreur inconnue" }));
                alert(`Le serveur a refusé l'ajout : ${errorData.message || response.status}`);
                return; // On arrête ici, on ne vide pas la recherche si ça a planté
            }

            setSearchQuery("");
            setSearchResults([]);
            fetchSession();
        } catch (err) {
            alert("Erreur de connexion au serveur backend.");
        }
    };

    const handleEndSession = async () => {
        try {
            const token = await getToken();
            await fetch(`${apiUrl}/live_session/${id}`, {
                method: "DELETE",
                headers: { Authorization: `Bearer ${token}` }
            });
            router.push("/library");
        } catch (err) {}
    };

    return (
        <SafeAreaView style={styles.safeArea}>
            <View style={styles.container}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.iconButton}>
                        <ChevronLeft size={28} color={COLORS.textPrimary} />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>{sessionName}</Text>
                    <TouchableOpacity onPress={handleEndSession} style={styles.iconButton}>
                        <Power size={24} color="red" />
                    </TouchableOpacity>
                </View>

                <View style={styles.actionBar}>
                    <TouchableOpacity style={styles.playNextBtn} onPress={handleNextTrack}>
                        <Play size={20} color="white" fill="white" />
                        <Text style={styles.playNextText}>Play Next Track</Text>
                    </TouchableOpacity>
                </View>

                <View style={styles.searchContainer}>
                    <Search size={20} color={COLORS.textMuted} />
                    <TextInput
                        value={searchQuery}
                        onChangeText={handleSearch}
                        placeholder="Suggest a track for the Live Session..."
                        placeholderTextColor={COLORS.textMuted}
                        style={styles.searchInput}
                    />
                </View>

                <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
                    {searchQuery.length > 0 ? (
                        <View style={styles.list}>
                            {isSearching ? <ActivityIndicator size="small" color={COLORS.primary} style={{ marginTop: 20 }} /> : null}
                            {searchResults.map(track => (
                                <View key={track.id} style={styles.trackCard}>
                                    <Image source={{ uri: track.thumbnail }} style={styles.trackImage} />
                                    <View style={styles.trackInfo}>
                                        <Text style={styles.trackTitle} numberOfLines={1}>{track.title}</Text>
                                        <Text style={styles.trackArtist} numberOfLines={1}>{track.artist}</Text>
                                    </View>
                                    <TouchableOpacity style={styles.addBtn} onPress={() => handleAddTrack(track)}>
                                        <Plus size={20} color="white" />
                                    </TouchableOpacity>
                                </View>
                            ))}
                        </View>
                    ) : (
                        <View style={styles.list}>
                            <Text style={styles.sectionTitle}>Up Next ({tracks.length})</Text>
                            {tracks.map(item => (
                                <View key={item.trackId} style={styles.trackCard}>
                                    {/* Reconstruction de la miniature avec l'ID de la source au lieu du champ thumbnail inexistant */}
                                    <Image 
                                        source={{ uri: item.track?.sourceId ? `https://i.ytimg.com/vi/${item.track.sourceId}/hqdefault.jpg` : "https://picsum.photos/100" }} 
                                        style={styles.trackImage} 
                                    />
                                    <View style={styles.trackInfo}>
                                        <Text style={styles.trackTitle} numberOfLines={1}>{item.track?.title}</Text>
                                        <Text style={styles.trackArtist} numberOfLines={1}>{item.track?.artist}</Text>
                                    </View>
                                    <TouchableOpacity style={styles.voteBtn} onPress={() => handleVote(item.trackId)}>
                                        <ThumbsUp size={16} color="white" />
                                        <Text style={styles.voteText}>{item.votes?.length || 0}</Text>
                                    </TouchableOpacity>
                                </View>
                            ))}
                            {tracks.length === 0 && (
                                <Text style={styles.emptyText}>No tracks in queue. Search above to suggest one!</Text>
                            )}
                        </View>
                    )}
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
        paddingHorizontal: 24,
    },
    header: {
        height: 60,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
    },
    iconButton: {
        width: 40,
        height: 40,
        justifyContent: "center",
        alignItems: "center",
    },
    headerTitle: {
        fontFamily: FONTS.bold,
        fontSize: 20,
        color: COLORS.textPrimary,
    },
    actionBar: {
        flexDirection: "row",
        justifyContent: "center",
        marginVertical: 10,
    },
    playNextBtn: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: COLORS.primary,
        paddingHorizontal: 20,
        paddingVertical: 12,
        borderRadius: 25,
        gap: 8,
    },
    playNextText: {
        fontFamily: FONTS.semiBold,
        color: "white",
        fontSize: 16,
    },
    searchContainer: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#F5F5F5",
        borderRadius: 16,
        paddingHorizontal: 16,
        height: 50,
        borderWidth: 1,
        borderColor: "#EAEAEA",
        marginBottom: 16,
    },
    searchInput: {
        flex: 1,
        marginLeft: 10,
        fontFamily: FONTS.regular,
        fontSize: 15,
        color: COLORS.textPrimary,
    },
    scrollContent: {
        paddingBottom: 100,
    },
    list: {
        gap: 12,
    },
    sectionTitle: {
        fontFamily: FONTS.semiBold,
        fontSize: 16,
        color: COLORS.textPrimary,
        marginBottom: 8,
    },
    trackCard: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "white",
        padding: 10,
        borderRadius: 12,
        elevation: 1,
    },
    trackImage: {
        width: 50,
        height: 50,
        borderRadius: 8,
    },
    trackInfo: {
        flex: 1,
        marginLeft: 12,
    },
    trackTitle: {
        fontFamily: FONTS.semiBold,
        fontSize: 14,
        color: COLORS.textPrimary,
        marginBottom: 2,
    },
    trackArtist: {
        fontFamily: FONTS.regular,
        fontSize: 12,
        color: COLORS.textMuted,
    },
    voteBtn: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: COLORS.primary,
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 16,
        gap: 6,
    },
    voteText: {
        fontFamily: FONTS.bold,
        color: "white",
        fontSize: 14,
    },
    addBtn: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: "#E7A500",
        justifyContent: "center",
        alignItems: "center",
    },
    emptyText: {
        fontFamily: FONTS.regular,
        color: COLORS.textMuted,
        textAlign: "center",
        marginTop: 20,
    }
});