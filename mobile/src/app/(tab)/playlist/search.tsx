import { View, Text, StyleSheet, TouchableOpacity, TextInput, Platform } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ChevronLeft, Plus, Check, Search } from "lucide-react-native";
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

	const handleAddTitle = async (track: any) => {
		try {
			const token = Platform.OS === "web" ? localStorage.getItem("userToken") : await SecureStore.getItemAsync("userToken");

			const response = await fetch(
				`${apiUrl}/playlists/${id}/tracks`,
				{
					method: "POST",
					headers: {
						"Content-Type": "application/json",
						Authorization: `Bearer ${token}`,
					},
					body: JSON.stringify({
						title: track.title,
						artist: track.artist,
						sourceId: track.id,
					}),
				}
			);

			if (response.ok) {
				setAddedTrackIds((prev) => [...prev, track.id]);
			}

		} catch (error) {
			console.error(error);
		}
	};

	const handleSearch = async (text: string) => {
		setSearchQuery(text);
		if (!text.trim()) {
			setTrackResults([]);
			return;
		}

		try {
			setIsSearching(true);

			const res = await fetch(`${API_BASE_URL}/player/search?q=${encodeURIComponent(searchQuery)}`);
				
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

					<View style={styles.headerText}>
						<Text style={styles.headerTitle}>
							Add titles
						</Text>

						<Text style={styles.headerSubtitle}>
							Find something for your playlist
						</Text>
					</View>

					<View style={styles.headerSpacer} />

				</View>

				<View style={styles.searchContainer}>

					<Search
						size={20}
						color={COLORS.textMuted}
					/>

					<TextInput
						value={searchQuery}
						onChangeText={handleSearch}
						onSubmitEditing={() => handleSearch(searchQuery)}
						placeholder="Search for a title or an artist"
						placeholderTextColor={COLORS.textMuted}
						style={styles.searchInput}
						returnKeyType="search"
					/>

				</View>

				{searchQuery.length === 0 && (
					<View style={styles.emptyState}>

						<View style={styles.emptyIcon}>
							<Search
								size={30}
								color="#E7A500"
							/>
						</View>

						<Text style={styles.emptyTitle}>
							Find your next favorite
						</Text>

						<Text style={styles.emptyText}>
							Search for a song or an artist to add it to your playlist.
						</Text>

					</View>
				)}

				{searchQuery.length > 0 && trackResults.length === 0 && !isSearching && (
					<View style={styles.emptyState}>

						<View style={styles.emptyIcon}>
							<Search
								size={30}
								color="#E7A500"
							/>
						</View>

						<Text style={styles.emptyTitle}>
							No results
						</Text>

						<Text style={styles.emptyText}>
							Try searching for another title or artist.
						</Text>

					</View>
				)}

				{isSearching && (
					<View style={styles.searchingState}>
						<Text style={styles.searchingText}>
							Searching...
						</Text>
					</View>
				)}

				<View style={styles.resultsList}>

					{trackResults.map((track) => {

						const isAdded = addedTrackIds.includes(track.id);

						return (
							<View
								key={track.id}
								style={[
									styles.trackItem,
									isAdded && styles.trackItemAdded,
								]}
							>
								<View style={styles.track}>
									<TrackListItem
										title={track.title}
										subtitle={track.artist}
										imageUrl={track.thumbnail}
										showPlayButton={false}
									/>
								</View>

								<TouchableOpacity
									onPress={() => handleAddTitle(track)}
									disabled={isAdded}
									style={[
										styles.addButton,
										isAdded && styles.addButtonAdded,
									]}
									activeOpacity={0.7}
								>

									{isAdded ? (
										<Check
											size={19}
											color="#FFFFFF"
											strokeWidth={3}
										/>
									) : (
										<Plus
											size={21}
											color="#FFFFFF"
											strokeWidth={2.5}
										/>
									)}

								</TouchableOpacity>

							</View>
						);

					})}

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
		height: 75,
		flexDirection: "row",
		alignItems: "center",
	},

	backButton: {
		width: 40,
		height: 40,
		justifyContent: "center",
		alignItems: "flex-start",
	},

	headerText: {
		flex: 1,
		marginLeft: 8,
	},

	headerTitle: {
		fontFamily: FONTS.bold,
		fontSize: 24,
		color: COLORS.textPrimary,
		marginBottom: 2,
	},

	headerSubtitle: {
		fontFamily: FONTS.regular,
		fontSize: 13,
		color: COLORS.textMuted,
	},

	headerSpacer: {
		width: 40,
	},

	searchContainer: {
		height: 54,
		flexDirection: "row",
		alignItems: "center",
		paddingHorizontal: 18,
		borderRadius: 18,
		backgroundColor: "#F5F5F5",
		borderWidth: 1,
		borderColor: "#EAEAEA",
		marginTop: 16,
		marginBottom: 22,
	},

	searchInput: {
		flex: 1,
		height: "100%",
		marginLeft: 10,
		paddingVertical: 0,
		fontFamily: FONTS.regular,
		fontSize: 14,
		color: COLORS.textPrimary,
	},

	resultsList: {
		gap: 10,
	},

	trackItem: {
		minHeight: 72,
		flexDirection: "row",
		alignItems: "center",
		paddingHorizontal: 8,
		paddingVertical: 8,
		borderRadius: 16,
		backgroundColor: "#FAFAFA",
		borderWidth: 1,
		borderColor: "#EEEEEE",
	},

	trackItemAdded: {
		backgroundColor: "#FFF9ED",
		borderColor: "#FBEAC7",
	},

	addButton: {
		width: 38,
		height: 38,
		borderRadius: 19,
		backgroundColor: "#E7A500",
		justifyContent: "center",
		alignItems: "center",
		marginLeft: "auto",
		marginRight: 2,
	},

	addButtonAdded: {
		backgroundColor: COLORS.primary,
	},

	emptyState: {
		alignItems: "center",
		justifyContent: "center",
		paddingHorizontal: 35,
		marginTop: 70,
	},

	emptyIcon: {
		width: 70,
		height: 70,
		borderRadius: 35,
		backgroundColor: "#FBEAC7",
		justifyContent: "center",
		alignItems: "center",
		marginBottom: 18,
	},

	emptyTitle: {
		fontFamily: FONTS.bold,
		fontSize: 18,
		color: COLORS.textPrimary,
		marginBottom: 7,
		textAlign: "center",
	},

	emptyText: {
		fontFamily: FONTS.regular,
		fontSize: 13,
		lineHeight: 20,
		color: COLORS.textMuted,
		textAlign: "center",
	},

	searchingState: {
		alignItems: "center",
		marginTop: 30,
	},

	searchingText: {
		fontFamily: FONTS.medium,
		fontSize: 14,
		color: COLORS.textMuted,
	},
	track: {
		flex: 1,
		marginBottom: -16,
	}
});