import { View, Text, StyleSheet, TouchableOpacity, TextInput, Platform } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ChevronLeft, Plus, Check } from "lucide-react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { COLORS, FONTS, API_BASE_URL } from "@/constants";
import { useState } from "react";
import * as SecureStore from "expo-secure-store";
import { TrackListItem } from "@/components";

export default function PlaylistSearch() {
	const { id } = useLocalSearchParams();
	const router = useRouter();

	const [searchQuery, setSearchQuery] = useState("");
	const [addedTrackIds, setAddedTrackIds] = useState<string[]>([]);
	const [trackResults, setTrackResults] = useState<any[]>([]);
	const [isSearching, setIsSearching] = useState(false);

	const apiUrl = Platform.OS === "android" ? "http://10.0.2.2:3000" : "http://localhost:3000";

	const handleAddTitle = async (trackId: string) => {
		try {
			const token = await SecureStore.getItemAsync("token");

			const response = await fetch(
				`${apiUrl}/playlists/${id}/tracks`,
				{
					method: "POST",
					headers: {
						"Content-Type": "application/json",
						Authorization: `Bearer ${token}`,
					},
					body: JSON.stringify({
						trackId: trackId,
					}),
				}
			);

			if (response.ok) {
				setAddedTrackIds((prev) => [...prev, trackId]);
			}

		} catch (error) {
			console.error(error);
		}
	};

	const handleSearch = async (query: string) => {
		setSearchQuery(query);
		if (!query.trim()) {
			setTrackResults([]);
			return;
		}

		try {
			setIsSearching(true);

			const res = await fetch(`${API_BASE_URL}/player/artists?q=${encodeURIComponent(query)}`);
				
			if (res.ok) {
				const data = await res.json();
				setTrackResults(data);
			}

		} catch (err) {
			console.error('Search error:', err);
		} finally {
			setIsSearching(false);
		}
	};

	return (
		<SafeAreaView style={styles.safeArea}>
			<View style={styles.container}>

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

					<Text style={styles.headerTitle}>
						Add to the playlist
					</Text>

					<View style={styles.headerSpacer} />
				</View>

				<View style={styles.searchContainer}>
					<TextInput
						value={searchQuery}
						onChangeText={setSearchQuery}
						onSubmitEditing={() => handleSearch(searchQuery)}
						placeholder="Search for a title or an artist"
						placeholderTextColor={COLORS.textMuted}
						style={styles.searchInput}
					/>
				</View>

				<View style={styles.resultsList}>
					{trackResults.map((track) => (
						<View key={track.id} style={styles.trackItem}>
							<TrackListItem
								title={track.title}
								subtitle={track.artist}
								imageUrl={track.thumbnail}
							/>

							<TouchableOpacity
								onPress={() => handleAddTitle(track)}
								disabled={addedTrackIds.includes(track.id)}
							>
								{addedTrackIds.includes(track.id) ? (
									<Check
										size={24}
										color="green"
									/>
								) : (
									<Plus
										size={24}
										color={COLORS.textPrimary}
									/>
								)}
							</TouchableOpacity>
						</View>
					))}
				</View>

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
		height: 55,
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "space-between",
	},

	backButton: {
		width: 40,
		height: 40,
		justifyContent: "center",
		alignItems: "flex-start",
	},

	headerTitle: {
		fontFamily: FONTS.semiBold,
		fontSize: 20,
		color: COLORS.textPrimary,
	},

	headerSpacer: {
		width: 40,
	},

	searchContainer: {
		marginTop: 20,
	},

	searchInput: {
		height: 48,
		borderRadius: 24,
		backgroundColor: "#F5F5F5",
		paddingHorizontal: 20,
		fontFamily: FONTS.regular,
		fontSize: 14,
		color: COLORS.textPrimary,
	},

	resultsList: {
		marginTop: 24,
		gap: 10,
	},

	trackItem: {
		minHeight: 56,
		justifyContent: "center",
	},

	trackInfo: {
		flex: 1,
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
});