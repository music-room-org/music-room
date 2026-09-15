import { useState, useEffect, useCallback } from 'react';
import { SafeAreaView } from "react-native-safe-area-context";
import { ScrollView, View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { CurrentlyPlayingCard, PlaylistCard } from "@/components";
import { COLORS } from "@/constants/colors";
import { FONTS } from "@/constants/fonts";
import * as SecureStore from 'expo-secure-store';
import { Platform } from "react-native";
import { useFocusEffect, useRouter } from 'expo-router';

export function HomeScreen() {

const router = useRouter();
const [username, setUsername] = useState("");

const fetchProfile = useCallback(async () => {
    try {
        const token =
            Platform.OS === 'web'
                ? localStorage.getItem('userToken')
                : await SecureStore.getItemAsync('userToken');

        if (!token) {
            router.replace('/login');
            return;
        }

        const apiUrl =
            Platform.OS === 'android'
                ? 'http://10.0.2.2:3000/auth/profil'
                : 'http://localhost:3000/auth/profil';

        const response = await fetch(apiUrl, {
            method: 'GET',
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });

        const data = await response.json();

        setUsername(data.username);
    } catch (error) {
        console.error(error);
    }
}, []);

useFocusEffect(
    useCallback(() => {
        fetchProfile();
    }, [fetchProfile])
);

const mockFriendsPlaying = [
        {
            id: '1',
            title: 'Psycho shit',
            artist: 'The Strokes',
            friendName: 'Octave',
            imageUrl: 'https://picsum.photos/200' 
        },
        {
            id: '2',
            title: 'I will survive',
            artist: 'Gloria Gaynor',
            friendName: 'Antonin',
            imageUrl: 'https://picsum.photos/201'
        }
    ];

const mockPlaylists = [
        'https://picsum.photos/400',
        'https://picsum.photos/401',
        'https://picsum.photos/402',
        'https://picsum.photos/403'
    ];

    return (
        <SafeAreaView style={styles.safeArea}>
            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                <View style={styles.headerContainer}>
                    <Text style={styles.mainTitle}>Hello {username}</Text>
                    <Text style={styles.subTitle}>Ready to share some music?</Text>
                    <View style={styles.yellowLine} />
                </View>
                <View style={styles.sectionContainer}>
                    <Text style={styles.sectionTitle}>What your friends are listening to</Text>
                    {mockFriendsPlaying.map((item) => (
                        <CurrentlyPlayingCard 
                            key={item.id}
                            title={item.title}
                            artist={item.artist}
                            friendName={item.friendName}
                            imageUrl={item.imageUrl}
                        />
                    ))}
                </View>
                <View style={styles.sectionContainer}>
                    <View style={styles.headerRow}>
                        <Text style={styles.sectionTitleRow}>Recommanded playlists</Text> 
                        <TouchableOpacity onPress={() => console.log('Click on See More')}>
                            <Text style={styles.seeMoreText}>See more</Text>
                        </TouchableOpacity>
                    </View>
                    <View style={styles.gridContainer}>
                        {mockPlaylists.map((url, index) => (
                            <PlaylistCard key={index} imageUrl={url} />
                        ))}
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
        paddingBottom: 40,
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
    }

});