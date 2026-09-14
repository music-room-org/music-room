import { View, ScrollView, Text, ActivityIndicator, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useState } from "react";
import { COLORS, FONTS, API_BASE_URL } from "@/constants";
import { SearchBar, CategoryTabs, TrackListItem, PlaylistItem } from "@/components";
import { usePlayer, Track } from "@/context/PlayerContext";

export default function Research() {
	const [activeTab, setActiveTab] = useState('Titles');
	const [searchQuery, setSearchQuery] = useState('');
	const [searchResults, setSearchResults] = useState<Track[]>([]);
	const [isSearching, setIsSearching] = useState(false);
	const { playTrack, currentTrack, isPlaying } = usePlayer();

	const handleSearch = async (query: string) => {
		setSearchQuery(query);
		if (!query.trim()) {
			setSearchResults([]);
			return;
		}

		try {
			setIsSearching(true);
			const res = await fetch(`${API_BASE_URL}/player/search?q=${encodeURIComponent(query)}`);
			if (res.ok) {
				const data = await res.json();
				setSearchResults(data);
			} else {
				console.error('Search request failed with status:', res.status);
			}
		} catch (err) {
			console.error('Search error:', err);
		} finally {
			setIsSearching(false);
		}
	};

	return (
		<SafeAreaView style={styles.safeArea}>
			<ScrollView
				style={styles.scrollContent}
				showsVerticalScrollIndicator={false}
			>
				<SearchBar
					value={searchQuery}
					onChangeText={(text) => handleSearch(text)}
					onSubmitEditing={() => handleSearch(searchQuery)}
				/>
				<CategoryTabs
					activeTab={activeTab}
					onTabChange={setActiveTab}
				/>

				{isSearching && (
					<View style={styles.loaderContainer}>
						<ActivityIndicator size="large" color={COLORS.primary} />
					</View>
				)}

				{!isSearching && searchResults.length > 0 && (
					<View style={styles.sectionContainer}>
						<Text style={styles.sectionTitle}>Search Results</Text>
						{searchResults.map((track) => (
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

				{!isSearching && searchResults.length === 0 && (
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
	)
}

const styles = StyleSheet.create({
	safeArea: {
		flex: 1,
		backgroundColor: COLORS.background
	},
	scrollContent: {
		paddingHorizontal: 24,
		paddingTop: 20,
		paddingBottom: 120
	},
	loaderContainer: {
		marginTop: 32,
		alignItems: 'center',
	},
	sectionContainer: {
		marginTop: 32
	},
	sectionTitle: {
		fontFamily: FONTS.semiBold,
		fontSize: 22,
		color: COLORS.textPrimary,
		marginBottom: 16
	}
});