import { View, ScrollView, Text, ActivityIndicator, StyleSheet, Platform, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useState } from "react";
import * as SecureStore from "expo-secure-store";
import { COLORS, FONTS, API_BASE_URL } from "@/constants";
import { SearchBar, ArtistListItem, ArtistItem, CategoryTabs, TrackListItem, LibraryPlaylistItem } from "@/components";
import { usePlayer, Track } from "@/context/PlayerContext";
import { useRouter } from "expo-router";

async function getToken() {
	if (Platform.OS === "web") {
		return localStorage.getItem("userToken");
	}
	return await SecureStore.getItemAsync("userToken");
}

export default function Research() {
	const router = useRouter();
	const { playTrack, currentTrack, isPlaying } = usePlayer();

	const [activeTab, setActiveTab] = useState('Artists');
	const [searchQuery, setSearchQuery] = useState('');
	const [isSearching, setIsSearching] = useState(false);

	const [trackResults, setTrackResults] = useState<Track[]>([]);
	const [artistResults, setArtistResults] = useState<ArtistItem[]>([]);
	const [playlistResults, setPlaylistResults] = useState<any[]>([]);

	const handleSearch = async (query: string, tab = activeTab) => {
		setSearchQuery(query);
		
		if (!query.trim()) {
			setTrackResults([]);
			setArtistResults([]);
			setPlaylistResults([]);
			return;
		}

		try {
			setIsSearching(true);
			
			if (tab === 'Artists') {
				const res = await fetch(`${API_BASE_URL}/player/artists?q=${encodeURIComponent(query)}`);
				if (res.ok) setArtistResults(await res.json());
				setTrackResults([]);
				setPlaylistResults([]);
			} else if (tab === 'Titles') {
				const res = await fetch(`${API_BASE_URL}/player/search?q=${encodeURIComponent(query)}`);
				if (res.ok) setTrackResults(await res.json());
				setArtistResults([]);
				setPlaylistResults([]);
			} else if (tab === 'Playlists') {
				const token = await getToken();
				const res = await fetch(`${API_BASE_URL}/playlists/search?q=${encodeURIComponent(query)}`, {
					headers: { Authorization: `Bearer ${token}` }
				});
				if (res.ok) setPlaylistResults(await res.json());
				setArtistResults([]);
				setTrackResults([]);
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

	const isSearchEmpty = searchQuery.trim().length === 0;

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
					tabs={['Artists', 'Titles', 'Playlists']}
				/>

				{isSearching && (
					<View style={styles.loaderContainer}>
						<ActivityIndicator size="large" color={COLORS.primary} />
					</View>
				)}

				{/* État vide : Tant qu'on n'a rien écrit */}
				{!isSearching && isSearchEmpty && (
					<View style={styles.emptyStateContainer}>
						<Text style={styles.emptyText}>Start typing to search...</Text>
					</View>
				)}

				{/* ONGLET ARTISTS */}
				{!isSearching && !isSearchEmpty && activeTab === 'Artists' && (
					<View style={styles.sectionContainer}>
						<Text style={styles.sectionTitle}>Artists</Text>
						{artistResults.map((artist) => (
							<ArtistListItem 
								key={artist.id} 
								artist={artist} 
								onPress={() => handleArtistPress(artist)} 
							/>
						))}
						{artistResults.length === 0 && (
							<View style={styles.emptyStateContainer}>
								<Text style={styles.emptyText}>No artists found.</Text>
							</View>
						)}
					</View>
				)}

				{/* ONGLET TITLES */}
				{!isSearching && !isSearchEmpty && activeTab === 'Titles' && (
					<View style={styles.sectionContainer}>
						<Text style={styles.sectionTitle}>Titles</Text>
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
						{trackResults.length === 0 && (
							<View style={styles.emptyStateContainer}>
								<Text style={styles.emptyText}>No titles found.</Text>
							</View>
						)}
					</View>
				)}

				{/* ONGLET PLAYLISTS */}
				{!isSearching && !isSearchEmpty && activeTab === 'Playlists' && (
					<View style={styles.sectionContainer}>
						<Text style={styles.sectionTitle}>Playlists</Text>
						{playlistResults.map((playlist) => (
							<TouchableOpacity key={playlist.id} onPress={() => router.push(`/playlist/${playlist.id}`)}>
								<LibraryPlaylistItem 
									title={playlist.name} 
									author={`By ${playlist.owner?.username || 'Unknown'}`} 
									imageUrl={playlist.imageUrl || "https://blog.landr.com/wp-content/uploads/2017/07/how-to-get-on-a-playlist-feature.png"} 
								/>
							</TouchableOpacity>
						))}
						{playlistResults.length === 0 && (
							<View style={styles.emptyStateContainer}>
								<Text style={styles.emptyText}>No playlists found.</Text>
							</View>
						)}
					</View>
				)}

			</ScrollView>
		</SafeAreaView>
	);
}

const styles = StyleSheet.create({
	safeArea: {
		flex: 1,
		backgroundColor: COLORS.background,
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
		marginTop: 24,
	},
	sectionTitle: {
		fontFamily: FONTS.semiBold,
		fontSize: 22,
		color: COLORS.textPrimary,
		marginBottom: 16,
	},
	emptyStateContainer: {
		marginTop: 40,
		alignItems: 'center',
		paddingHorizontal: 20,
	},
	emptyText: {
		fontFamily: FONTS.regular,
		fontSize: 15,
		color: COLORS.textMuted,
		textAlign: 'center',
	},
});