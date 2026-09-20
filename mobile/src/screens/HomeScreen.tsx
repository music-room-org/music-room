import { useState, useCallback } from 'react';
import { SafeAreaView } from "react-native-safe-area-context";
import { ScrollView, View, Text, StyleSheet, TouchableOpacity, Platform, Image } from "react-native";
import { CurrentlyPlayingCard } from "@/components";
import { COLORS } from "@/constants/colors";
import { FONTS } from "@/constants/fonts";
import * as SecureStore from 'expo-secure-store';
import { useFocusEffect, useRouter } from 'expo-router';

async function getToken() {
    if (Platform.OS === "web") return localStorage.getItem("userToken");
    return await SecureStore.getItemAsync("userToken");
}

export function HomeScreen() {
    const router = useRouter();
    const [username, setUsername] = useState("");
    const [publicPlaylists, setPublicPlaylists] = useState<any[]>([]);
    const [liveSessions, setLiveSessions] = useState<any[]>([]);
    const [recommendedPlaylists, setRecommendedPlaylists] = useState<any[]>([]);

    const apiUrl = Platform.OS === 'android' ? 'http://10.0.2.2:3000' : 'http://localhost:3000';

    const fetchProfile = useCallback(async () => {
        try {
            const token = await getToken();
            if (!token) {
                router.replace('/login');
                return;
            }
            const response = await fetch(`${apiUrl}/auth/profil`, {
                method: 'GET',
                headers: { Authorization: `Bearer ${token}` },
            });
            if (response.ok) {
                const data = await response.json();
                setUsername(data.username);
            }
        } catch (error) {
            console.error(error);
        }
    }, []);

    const fetchPublicPlaylists = useCallback(async () => {
        try {
            const token = await getToken();
            if (!token) return;
            const response = await fetch(`${apiUrl}/playlists`, {
                method: 'GET',
                headers: { Authorization: `Bearer ${token}` },
            });
            if (response.ok) {
                const data = await response.json();
                setPublicPlaylists(data);
            }
        } catch (error) {
            console.error(error);
        }
    }, []);

    const fetchRecommendedPlaylists = useCallback(async () => {
        try {
            const response = await fetch(`${apiUrl}/playlists/recommended`, {
                method: 'GET',
            });
            if (response.ok) {
                const data = await response.json();
                setRecommendedPlaylists(data);
            }
        } catch (error) {
            console.error(error);
        }
    }, []);

    const fetchLiveSessions = useCallback(async () => {
        try {
            const token = await getToken();
            if (!token) return;
            const response = await fetch(`${apiUrl}/live_session/available/all`, {
                method: 'GET',
                headers: { Authorization: `Bearer ${token}` },
            });
            if (response.ok) {
                const data = await response.json();
                setLiveSessions(data);
            }
        } catch (error) {
            console.error(error);
        }
    }, []);

    useFocusEffect(
        useCallback(() => {
            fetchProfile();
            fetchPublicPlaylists();
            fetchLiveSessions();
            fetchRecommendedPlaylists();
        }, [fetchProfile, fetchPublicPlaylists, fetchLiveSessions, fetchRecommendedPlaylists])
    );

    return (
        <SafeAreaView style={styles.safeArea}>
            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                <View style={styles.headerContainer}>
                    <Text style={styles.mainTitle}>Hello {username}</Text>
                    <Text style={styles.subTitle}>Ready to share some music?</Text>
                    <View style={styles.yellowLine} />
                </View>

                {/* Section des Live Sessions limitées à 4 */}
                <View style={styles.sectionContainer}>
                    <View style={styles.headerRow}>
                        <Text style={styles.sectionTitleRow}>Active Live Events</Text>
                        {liveSessions.length > 4 && (
                            <TouchableOpacity onPress={() => router.push('/live/all')}>
                                <Text style={styles.seeMoreText}>See more</Text>
                            </TouchableOpacity>
                        )}
                    </View>
                    
                    {liveSessions.length === 0 && (
                        <Text style={styles.emptyText}>No active events available right now.</Text>
                    )}
                    
                    {liveSessions.slice(0, 4).map((session) => (
                        <TouchableOpacity 
                            key={session.id} 
                            style={styles.liveCard} 
                            onPress={() => router.push(`/live/${session.id}`)}
                            activeOpacity={0.8}
                        >
                            <View style={styles.liveInfo}>
                                <Text style={styles.liveTitle} numberOfLines={1}>{session.name}</Text>
                                <Text style={styles.liveVisibility}>
                                    {session.isPublic ? "🌍 Public Event" : "🔒 Private Event"} • {session.license === 'OPEN' ? 'Open Voting' : 'Restricted Voting'}
                                </Text>
                            </View>
                            <View style={styles.joinButton}>
                                <Text style={styles.joinButtonText}>Join</Text>
                            </View>
                        </TouchableOpacity>
                    ))}
                </View>

                {/* Section des Playlists recommandées par Music-Room */}
                <View style={styles.sectionContainer}>
                    <Text style={styles.sectionTitle}>Recommanded playlists by Music-Room</Text>
                    <View style={styles.gridContainer}>
                        {recommendedPlaylists.map((playlist) => (
                            <TouchableOpacity 
                                key={playlist.id} 
                                style={styles.playlistCardContainer} 
                                onPress={() => router.push(`/playlist/${playlist.id}`)}
                                activeOpacity={0.8}
                            >
                                <Image 
                                    source={{ uri: playlist.imageUrl || "https://blog.landr.com/wp-content/uploads/2017/07/how-to-get-on-a-playlist-feature.png" }} 
                                    style={styles.playlistImage} 
                                />
                                <Text style={styles.playlistName} numberOfLines={1}>
                                    {playlist.name}
                                </Text>
                                <Text style={styles.playlistOwner} numberOfLines={1}>
                                    By {playlist.owner?.username || "Unknown"}
                                </Text>
                            </TouchableOpacity>
                        ))}
                        {recommendedPlaylists.length === 0 && (
                            <Text style={styles.emptyText}>More playlists coming soon.</Text>
                        )}
                    </View>
                </View>

                {/* Section des Playlists Publiques limitées à 4 */}
                <View style={styles.sectionContainer}>
                    <View style={styles.headerRow}>
                        <Text style={styles.sectionTitleRow}>Public playlists by members</Text>
                        {publicPlaylists.length > 4 && (
                            <TouchableOpacity onPress={() => router.push('/playlist/all')}>
                                <Text style={styles.seeMoreText}>See more</Text>
                            </TouchableOpacity>
                        )}
                    </View>
                    <View style={styles.gridContainer}>
                        {publicPlaylists.slice(0, 4).map((playlist) => (
                            <TouchableOpacity 
                                key={playlist.id} 
                                style={styles.playlistCardContainer} 
                                onPress={() => router.push(`/playlist/${playlist.id}`)}
                                activeOpacity={0.8}
                            >
                                <Image 
                                    source={{ uri: playlist.imageUrl || "https://blog.landr.com/wp-content/uploads/2017/07/how-to-get-on-a-playlist-feature.png" }} 
                                    style={styles.playlistImage} 
                                />
                                <Text style={styles.playlistName} numberOfLines={1}>
                                    {playlist.name}
                                </Text>
                                <Text style={styles.playlistOwner} numberOfLines={1}>
                                    By {playlist.owner?.username || "Unknown"}
                                </Text>
                            </TouchableOpacity>
                        ))}
                        {publicPlaylists.length === 0 && (
                            <Text style={styles.emptyText}>No public playlists yet.</Text>
                        )}
                    </View>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: COLORS.background || '#F9F9F9',
    },
    scrollContent: {
        paddingHorizontal: 24,
        paddingBottom: 170,
        paddingTop: 20,
    },
    headerContainer: {
        marginBottom: 32,
    },
    mainTitle: {
        fontFamily: FONTS.semiBold,
        fontSize: 32,
        color: COLORS.textPrimary || '#000',
        marginBottom: 8,
    },
    subTitle: {
        fontFamily: FONTS.medium,
        fontSize: 14,
        color: COLORS.textDescription,
    },
    yellowLine: {
        height: 4,
        backgroundColor: COLORS.primary,
        width: '100%',
        borderRadius: 2,
        marginTop: 20,
        marginBottom: -14,
    },
    sectionContainer: {
        marginBottom: 24,
    },
    sectionTitle: {
        fontFamily: FONTS.semiBold,
        fontSize: 16,
        color: COLORS.textPrimary || '#000',
        marginBottom: 16,
    },
    sectionTitleRow: {
        fontFamily: FONTS.semiBold,
        fontSize: 16,
        color: COLORS.textPrimary || '#000',
    },
    headerRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    seeMoreText: {
        fontFamily: FONTS.medium,
        fontSize: 14,
        color: COLORS.primary,
    },
    gridContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
    },
    playlistCardContainer: {
        width: '48%',
        marginBottom: 24,
        alignItems: 'center',
    },
    playlistImage: {
        width: '100%',
        aspectRatio: 1,
        borderRadius: 20,
        marginBottom: 12,
        backgroundColor: '#EAEAEA',
    },
    playlistName: {
        fontFamily: FONTS.semiBold,
        fontSize: 15,
        color: COLORS.textPrimary,
        textAlign: 'center',
    },
    playlistOwner: {
        fontFamily: FONTS.regular,
        fontSize: 13,
        color: COLORS.textMuted,
        textAlign: 'center',
        marginTop: 4,
    },
    emptyText: {
        fontFamily: FONTS.regular,
        fontSize: 14,
        color: COLORS.textMuted,
    },
    liveCard: {
        backgroundColor: COLORS.white,
        padding: 16,
        borderRadius: 16,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: COLORS.cardBorder,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    liveInfo: {
        flex: 1,
        marginRight: 12,
    },
    liveTitle: {
        fontFamily: FONTS.semiBold,
        fontSize: 18,
        color: COLORS.textPrimary,
        marginBottom: 4,
    },
    liveVisibility: {
        fontFamily: FONTS.regular,
        fontSize: 13,
        color: COLORS.textMuted,
    },
    joinButton: {
        backgroundColor: COLORS.primary,
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
    },
    joinButtonText: {
        fontFamily: FONTS.semiBold,
        color: COLORS.white,
        fontSize: 14,
    },
});