import { View, ScrollView, Text, TouchableOpacity, StyleSheet, Platform, Image } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ChevronLeft } from "lucide-react-native";
import { COLORS, FONTS } from "@/constants";
import { useState, useCallback } from "react";
import { useFocusEffect, useRouter } from "expo-router";
import * as SecureStore from "expo-secure-store";

async function getToken() {
	if (Platform.OS === "web") return localStorage.getItem("userToken");
	return await SecureStore.getItemAsync("userToken");
}

export default function AllPublicPlaylists() {
	const router = useRouter();
	const apiUrl = Platform.OS === "android" ? "http://10.0.2.2:3000" : "http://localhost:3000";
	const [publicPlaylists, setPublicPlaylists] = useState<any[]>([]);

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

	useFocusEffect(
		useCallback(() => {
			fetchPublicPlaylists();
		}, [fetchPublicPlaylists])
	);

	return (
		<SafeAreaView style={styles.safeArea}>
			<View style={styles.header}>
				<TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
					<ChevronLeft size={28} color={COLORS.textPrimary} />
				</TouchableOpacity>
				<Text style={styles.headerTitle}>All Public Playlists</Text>
				<View style={styles.placeholder} />
			</View>

			<ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
				<View style={styles.gridContainer}>
					{publicPlaylists.map((playlist) => (
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
			</ScrollView>
		</SafeAreaView>
	);
}

const styles = StyleSheet.create({
	safeArea: {
		flex: 1,
		backgroundColor: COLORS.background,
	},
	header: {
		height: 60,
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "space-between",
		paddingHorizontal: 24,
	},
	backButton: {
		width: 40,
		height: 40,
		justifyContent: "center",
		alignItems: "flex-start",
	},
	headerTitle: {
		fontFamily: FONTS.bold,
		fontSize: 20,
		color: COLORS.textPrimary,
	},
	placeholder: {
		width: 40,
	},
	scrollContent: {
		paddingHorizontal: 24,
		paddingBottom: 40,
		paddingTop: 16,
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
		textAlign: "center",
		marginTop: 40,
		width: '100%',
	},
});