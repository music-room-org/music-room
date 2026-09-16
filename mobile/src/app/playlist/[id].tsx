import { View, Text, StyleSheet, TouchableOpacity, Image, Platform, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ChevronLeft, Plus } from "lucide-react-native";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import { COLORS, FONTS } from "@/constants";
import { useEffect, useState, useCallback } from "react";
import * as SecureStore from "expo-secure-store";
import { usePlayer } from "@/context/PlayerContext";

const mockRecommendedTitles = [
	{
		id: "1",
		title: "Title 1",
		artist: "Artist 1",
		imageUrl:
			"https://blog.landr.com/wp-content/uploads/2017/07/how-to-get-on-a-playlist-feature.png",
	},
	{
		id: "5",
		title: "Title 5",
		artist: "Artist 5",
		imageUrl:
			"https://blog.landr.com/wp-content/uploads/2017/07/how-to-get-on-a-playlist-feature.png",
	},
];

async function getToken() {
	if (Platform.OS === "web")
		return localStorage.getItem("userToken");
	return await SecureStore.getItemAsync("userToken");
}

export default function Playlist() {
	const { id } = useLocalSearchParams();
	const router = useRouter();
	const { playTrack } = usePlayer();

	const [playlistName, setPlaylistName] = useState("");
	const [playlistTracks, setPlaylistTracks] = useState<any[]>([]);
	const [addedTrackIds, setAddedTrackIds] = useState<string[]>([]);
	const [playlistImage, setPlaylistImage] = useState("");

	const apiUrl = Platform.OS === "android" ? "http://10.0.2.2:3000" : "http://localhost:3000";

	useFocusEffect(
		useCallback(() => {
			const fetchPlaylist = async () => {
				try {
					
					const token = await getToken();

					if (!token) return;

					const response = await fetch(`${apiUrl}/playlists/${id}`, {
						method: "GET",
						headers: {
							Authorization: `Bearer ${token}`,
						},
					});

					console.log("STATUS:", response.status);
					const data = await response.json();

					console.log("PLAYLIST DATA:", data);
					setPlaylistName(data.name);
					setPlaylistImage(data.imageUrl);

					if (data.tracks) {
						setPlaylistTracks(data.tracks);
					}
				} catch (error) {
					console.error(error);
				}
			};
		fetchPlaylist();
	}, [id]));

	const handleAddTrack = async (track: typeof mockRecommendedTitles[0]) => {
		try {
			const response = await fetch(
				`${apiUrl}/playlists/${id}/tracks`,
				{
					method: "POST",
					headers: {
						"Content-Type": "application/json",
					},
					body: JSON.stringify({
						trackId: track.id,
					}),
				}
			);

			if (response.ok) {
				setPlaylistTracks((current) => [
					...current,
					track,
				]);

				setAddedTrackIds((current) => [
					...current,
					track.id,
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

					<View style={styles.playlistInfo}>
						<Image
							source={{ uri: playlistImage || "https://blog.landr.com/wp-content/uploads/2017/07/how-to-get-on-a-playlist-feature.png" }}
							style={styles.cover}
						/>

						<View style={styles.playlistDetails}>
							<Text style={styles.playlistTitle}>
								{playlistName}
							</Text>

							<Text style={styles.playlistAuthor}>
								Playlist by Faustoche
							</Text>
						</View>
					</View>

					<View style={styles.buttonsContainer}>
						<TouchableOpacity style={styles.infoButton}>
							<Text style={styles.infoButtonText}>
								Edit informations
							</Text>
						</TouchableOpacity>

						{playlistTracks.length > 0 && (
							<TouchableOpacity 
								style={styles.infoButton}
								onPress={() => { router.push(`/playlist/search?id=${id}`)}}
							>
								<Text style={styles.infoButtonText}>
									+ Add titles
								</Text>
							</TouchableOpacity>
						)}
					</View>

					<View style={styles.divider} />

					{playlistTracks.map((track) => (
						<TouchableOpacity
							key={track.id}
							style={styles.trackItem}
							onPress={() => playTrack(track)}
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
						</TouchableOpacity>
					))}

					{playlistTracks.length === 0 && (
						<View style={styles.emptyState}>
							<Text style={styles.emptyText}>
								No titles yet
							</Text>
						</View>
					)}

					{playlistTracks.length === 0 && (
						<TouchableOpacity
							style={styles.addTitlesButton}
							onPress={() => router.push(`/playlist/search?id=${id}`)}
						>
							<Text style={styles.addTitlesText}>
								Add new titles
							</Text>
						</TouchableOpacity>
					)}

					<Text style={styles.sectionTitle}>
						Recommanded titles
					</Text>

					<View style={styles.tracksList}>
						{mockRecommendedTitles.map((track) => {
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
											handleAddTrack(track)
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
		marginBottom: 20,
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
		marginBottom: 10,
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
});