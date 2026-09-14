import {
	View,
	Text,
	StyleSheet,
	TouchableOpacity,
	TextInput,
	Platform,
} from "react-native";

import { SafeAreaView } from "react-native-safe-area-context";
import { ChevronLeft } from "lucide-react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { COLORS, FONTS } from "@/constants";
import { useState } from "react";
import * as SecureStore from "expo-secure-store";

const mockSearchResults = [
	{
		id: "1",
		title: "Title 1",
		artist: "Artist 1",
	},
	{
		id: "2",
		title: "Title 2",
		artist: "Artist 2",
	},
	{
		id: "3",
		title: "Title 3",
		artist: "Artist 3",
	},
	{
		id: "4",
		title: "Title 4",
		artist: "Artist 4",
	},
	{
		id: "5",
		title: "Title 5",
		artist: "Artist 5",
	},
];

export default function PlaylistSearch() {
	const { id } = useLocalSearchParams();
	const router = useRouter();

	const [searchQuery, setSearchQuery] = useState("");
	const [searchResults, setSearchResults] = useState(
		mockSearchResults
	);

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
				router.back();
			}
		} catch (error) {
			console.error(error);
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
						placeholder="Search for a title or an artist"
						placeholderTextColor={COLORS.textMuted}
						style={styles.searchInput}
					/>
				</View>

				<View style={styles.resultsList}>
					{searchResults.map((track) => (
						<TouchableOpacity
							key={track.id}
							style={styles.trackItem}
							onPress={() =>
								handleAddTitle(track.id)
							}
						>
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