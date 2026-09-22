import { View, ScrollView, Text, ActivityIndicator, StyleSheet, Platform } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useEffect, useState } from "react";
import * as SecureStore from "expo-secure-store";
import { COLORS, FONTS, API_BASE_URL } from "@/constants";
import { SearchBar, PrimaryButton, ArtistListItem, ArtistItem, CategoryTabs, TrackListItem, PlaylistItem } from "@/components";
import { usePlayer, Track } from "@/context/PlayerContext";

async function getToken() {
	if (Platform.OS === "web") {
		return localStorage.getItem("userToken");
	}

	return await SecureStore.getItemAsync("userToken");
}

export default function Research() {
	const [activeTab, setActiveTab] = useState('Titles');
	const [searchQuery, setSearchQuery] = useState('');
	const [trackResults, setTrackResults] = useState<Track[]>([]);
	const [artistResults, setArtistResults] = useState<ArtistItem[]>([]);
	const [isSearching, setIsSearching] = useState(false);
	const { playTrack, currentTrack, isPlaying } = usePlayer();

	const handleSearch = async (query: string, tab = activeTab) => {
		setSearchQuery(query);
		if (!query.trim()) {
			setTrackResults([]);
			setArtistResults([]);
			return;
		}

		try {
			setIsSearching(true);
			if (tab === 'Artists') {
				const res = await fetch(`${API_BASE_URL}/player/artists?q=${encodeURIComponent(query)}`);
				if (res.ok) {
					const data = await res.json();
					setArtistResults(data);
				}
			} else {
				const res = await fetch(`${API_BASE_URL}/player/search?q=${encodeURIComponent(query)}`);
				if (res.ok) {
					const data = await res.json();
					setTrackResults(data);
				}
			}
		} catch (err) {
			console.error('Search error:', err);
		} finally {
			setIsSearching(false);
		}
	};

	const handleTabChange = (tab: string) => {
		setActiveTab(tab);
		if (searchQuery.trim()) {
			handleSearch(searchQuery, tab);
		}
	};

	const handleArtistPress = (artist: ArtistItem) => {
		setActiveTab('Titles');
		handleSearch(artist.name, 'Titles');
	};

	const hasResults = activeTab === 'Artists' ? artistResults.length > 0 : trackResults.length > 0;
	const [searchResults, setSearchResults] = useState<any[]>([]);
	const [pendingRequests, setPendingRequests] = useState<string[]>([]);

	const sendRequest = async (targetId: string) => {
		const token = await getToken();

		if (!token) return;

		const apiUrl =
			Platform.OS === "android"
				? "http://10.0.2.2:3000"
				: "http://localhost:3000";

		const response = await fetch(`${apiUrl}/friends/request`, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				Authorization: `Bearer ${token}`,
			},
			body: JSON.stringify({
				receiverId: targetId,
			}),
		});

		const data = await response.json();
		setPendingRequests((prev) => [...prev, targetId]);
		console.log(data);
	};

	useEffect(() => {
		const searchUsers = async () => {
			if (!searchQuery.trim()) {
				setSearchResults([]);
				return;
			}

			const token = await getToken();
			if (!token) return;

			const apiUrl = Platform.OS === "android" ? "http://10.0.2.2:3000" : "http://localhost:3000";

			const response = await fetch(
				`${apiUrl}/friends/search?q=${encodeURIComponent(searchQuery)}`,
				{
					headers: {
						Authorization: `Bearer ${token}`,
					},
				}
			);

			const data = await response.json();
			setSearchResults(data);
		};

		searchUsers();
	}, [searchQuery]);

	return (
		<SafeAreaView style={styles.safeArea}>
			<ScrollView
				style={styles.scrollView}
				contentContainerStyle={styles.scrollContent}
				showsVerticalScrollIndicator={false}
				keyboardShouldPersistTaps="handled"
			>
				<SearchBar
					value={searchQuery}
					onChangeText={(text) => handleSearch(text)}
					onSubmitEditing={() => handleSearch(searchQuery)}
				/>
				<CategoryTabs
					activeTab={activeTab}
					onTabChange={handleTabChange}
				/>

				{isSearching && (
					<View style={styles.loaderContainer}>
						<ActivityIndicator size="large" color={COLORS.primary} />
					</View>
				)}

				{!isSearching && activeTab === 'Artists' && artistResults.length > 0 && (
					<View style={styles.sectionContainer}>
						<Text style={styles.sectionTitle}>Artists (Topic Channels)</Text>
						{artistResults.map((artist) => (
							<ArtistListItem
								key={artist.id}
								artist={artist}
								onPress={() => handleArtistPress(artist)}
							/>
						))}
					</View>
				)}

				{!isSearching && activeTab !== 'Artists' && trackResults.length > 0 && (
					<View style={styles.sectionContainer}>
						<Text style={styles.sectionTitle}>Search Results</Text>
						{trackResults.map((track) => (
							<TrackListItem
								key={track.id}
								title={track.title}
								subtitle={track.artist}
								imageUrl={track.thumbnail}
								isPlaying={currentTrack?.id === track.id && isPlaying}
								onPress={() => playTrack(track)}
							/>
						))}
					</View>
				)}

				{!isSearching && !hasResults && (
					<>
						<View style={styles.sectionContainer}>
							<Text style={styles.sectionTitle}>Trending now</Text>

							<TrackListItem
								title="Psycho shit"
								subtitle="The Strokes"
								imageUrl="https://m.media-amazon.com/images/I/91nZ-EThngL._SL1500_.jpg"
							/>
							<TrackListItem
								title="NUEVAYoL"
								subtitle="Bad Bunny"
								imageUrl="https://media.pitchfork.com/photos/682b43f9d6a2575d172e91a4/1:1/w_320,c_limit/Bad-Bunny-Debi-Tirar-Mas-Fotos.jpeg"
							/>
							<TrackListItem
								title="Man I need"
								subtitle="Olivia Dean"
								imageUrl="https://static.fnac-static.com/multimedia/Images/FR/NR/98/38/22/19019928/1540-1/tsp20250603153148/The-Art-Of-Loving.jpg"
							/>
							<TrackListItem
								title="Dai dai"
								subtitle="Shakira"
								imageUrl="https://static.fnac-static.com/multimedia/Images/FR/NR/98/38/22/19019928/1540-1/tsp20250603153148/The-Art-Of-Loving.jpg"
							/>
						</View>

						<View style={styles.sectionContainer}>
							<Text style={styles.sectionTitle}>Popular playlist</Text>
							<PlaylistItem
								title="Psycho shit"
								listenersText="3423 monthly listeners"
								imageUrl="https://m.media-amazon.com/images/I/91nZ-EThngL._SL1500_.jpg"
							/>
							<PlaylistItem
								title="NUEVAYoL"
								listenersText="Bad Bunny"
								imageUrl="https://media.pitchfork.com/photos/682b43f9d6a2575d172e91a4/1:1/w_320,c_limit/Bad-Bunny-Debi-Tirar-Mas-Fotos.jpeg"
							/>
							<PlaylistItem
								title="Man I need"
								listenersText="Olivia Dean"
								imageUrl="https://static.fnac-static.com/multimedia/Images/FR/NR/98/38/22/19019928/1540-1/tsp20250603153148/The-Art-Of-Loving.jpg"
							/>
							<PlaylistItem
								title="Dai dai"
								listenersText="Shakira"
								imageUrl="https://static.fnac-static.com/multimedia/Images/FR/NR/98/38/22/19019928/1540-1/tsp20250603153148/The-Art-Of-Loving.jpg"
							/>
						</View>
					</>
				)}
			</ScrollView>
		</SafeAreaView>
	);
}

const styles = StyleSheet.create({
	safeArea: {
		flex: 1,
		backgroundColor: COLORS.background
	},
	scrollView: {
		flex: 1,
	},
	scrollContent: {
		paddingHorizontal: 24,
		paddingTop: 20,
		paddingBottom: 170,
	},
	loaderContainer: {
		marginTop: 32,
		alignItems: 'center',
	},
	sectionContainer: {
		marginTop: 24
	},
	userCard: {
		backgroundColor: COLORS.white,
		borderRadius: 16,
		padding: 16,
		marginBottom: 16
	},
	username: {
		fontFamily: FONTS.semiBold,
		fontSize: 18,
		color: COLORS.textPrimary,
		marginBottom: 12
	},
	sectionTitle: {
		fontFamily: FONTS.semiBold,
		fontSize: 22,
		color: COLORS.textPrimary,
		marginBottom: 16
	}
});