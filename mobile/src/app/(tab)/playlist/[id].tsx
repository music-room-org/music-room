import { View, Text, StyleSheet, Modal, TextInput, Switch, TouchableOpacity, Image, Platform, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ChevronLeft, Plus, Pencil, X } from "lucide-react-native";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import { COLORS, FONTS } from "@/constants";
import { useState, useCallback } from "react";
import * as SecureStore from "expo-secure-store";
import { usePlayer } from "@/context/PlayerContext";
import * as ImagePicker from "expo-image-picker";

async function getToken() {
	if (Platform.OS === "web") return localStorage.getItem("userToken");
	return await SecureStore.getItemAsync("userToken");
}

export default function Playlist() {
	const { id } = useLocalSearchParams();
	const router = useRouter();
	const { playQueue } = usePlayer();

	const [playlistName, setPlaylistName] = useState("");
	const [playlistTracks, setPlaylistTracks] = useState<any[]>([]);
	const [playlistImage, setPlaylistImage] = useState("");
	const [playlistOwner, setPlaylistOwner] = useState("");

	const [isEditModalVisible, setIsEditModalVisible] = useState(false);
	const [editName, setEditName] = useState("");
	const [editImage, setEditImage] = useState("");
	const [editIsPublic, setEditIsPublic] = useState(true);
	const [isCollaborative, setIsCollaborative] = useState(false);

	const [friendsList, setFriendsList] = useState<any[]>([]);
	const [friendSearchQuery, setFriendSearchQuery] = useState("");
	const [newCollaborators, setNewCollaborators] = useState<{id: string, username: string}[]>([]);
	const [existingCollaborators, setExistingCollaborators] = useState<any[]>([]);
	const [myUsername, setMyUsername] = useState("");

	const apiUrl = Platform.OS === "android" ? "http://10.0.2.2:3000" : "http://localhost:3000";

	useFocusEffect(
		useCallback(() => {
			const fetchPlaylist = async () => {
				try {
					const token = await getToken();
					if (!token) return;

					const profileRes = await fetch(`${apiUrl}/auth/profil`, { headers: { Authorization: `Bearer ${token}` } });
					if (profileRes.ok) {
						const profileData = await profileRes.json();
						setMyUsername(profileData.username);
					}

					const friendsRes = await fetch(`${apiUrl}/friends/list`, { headers: { Authorization: `Bearer ${token}` } });
					if (friendsRes.ok) {
						setFriendsList(await friendsRes.json());
					}

					const response = await fetch(`${apiUrl}/playlists/${id}`, {
						method: "GET",
						headers: { Authorization: `Bearer ${token}` },
					});

					const data = await response.json();
					
					setPlaylistName(data.name);
					setPlaylistImage(data.imageUrl);
					setPlaylistOwner(data.owner?.username || "");
					setIsCollaborative(data.collaborators && data.collaborators.length > 0);
					setExistingCollaborators(data.collaborators || []);
					setEditIsPublic(data.isPublic);

					if (data.tracks) {
						setPlaylistTracks(data.tracks);
					}
				} catch (error) {
					console.error(error);
				}
			};

			fetchPlaylist();
		}, [id])
	);

	const handleSave = async () => {
		try {
			const token = await getToken();
			const response = await fetch(`${apiUrl}/playlists/${id}`, {
				method: "PATCH",
				headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
				body: JSON.stringify({ name: editName, imageUrl: editImage, isPublic: editIsPublic }),
			});

			if (response.ok) {
				setPlaylistName(editName);
				setPlaylistImage(editImage);

				if (isCollaborative && newCollaborators.length > 0) {
					for (const friend of newCollaborators) {
						await fetch(`${apiUrl}/playlists/${id}/collaborators`, {
							method: "POST",
							headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
							body: JSON.stringify({ userId: friend.id }),
						});
					}
				}

				setIsEditModalVisible(false);
				setNewCollaborators([]);
				setFriendSearchQuery("");
			}
		} catch (error) {
			console.error(error);
		}
	};

	const pickImage = async () => {
		const result = await ImagePicker.launchImageLibraryAsync({
			mediaTypes: ["images"],
			quality: 0.8,
			allowsEditing: true,
			aspect: [1, 1],
		});

		if (!result.canceled) {
			setEditImage(result.assets[0].uri);
		}
	};

	const filteredFriends = friendSearchQuery.trim() === "" 
		? [] 
		: friendsList.filter((friend: any) => {
			const friendUser = friend.sender?.username === myUsername ? friend.receiver : friend.sender;
			return friendUser?.username?.toLowerCase().includes(friendSearchQuery.toLowerCase());
		});

	// PERMISSIONS STRICTES :
	const isOwner = playlistOwner === myUsername;
	const canAddTitles = editIsPublic || isOwner || isCollaborative;

	return (
		<SafeAreaView style={styles.safeArea}>
			<View style={styles.container}>
				<ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
					<View style={styles.header}>
						<TouchableOpacity onPress={() => router.push("/library")} style={styles.backButton}>
							<ChevronLeft size={28} color={COLORS.textPrimary} />
						</TouchableOpacity>
					</View>

					<View style={styles.playlistInfo}>
						<Image source={{ uri: playlistImage || "https://blog.landr.com/wp-content/uploads/2017/07/how-to-get-on-a-playlist-feature.png" }} style={styles.cover} />
						<View style={styles.playlistDetails}>
							<Text style={styles.playlistTitle}>{playlistName}</Text>
							<Text style={styles.playlistAuthor}>{isCollaborative ? "Collaborative playlist by" : "Playlist by"} {playlistOwner}</Text>
						</View>
					</View>

					<View style={styles.buttonsContainer}>
						{/* Seul le propriétaire peut éditer la playlist */}
						{isOwner && (
							<TouchableOpacity style={styles.infoButton} onPress={() => {
								setEditName(playlistName);
								setEditImage(playlistImage);
								setIsEditModalVisible(true);
							}}>
								<Pencil size={16} color="#E7A500"/>
								<Text style={styles.infoButtonText}> Edit informations </Text>
							</TouchableOpacity>
						)}

						{/* On peut ajouter des titres si c'est public, ou si on est owner/collab */}
						{canAddTitles && playlistTracks.length > 0 && (
							<TouchableOpacity style={styles.infoButton} onPress={() => { router.push(`/playlist/search?id=${id}`)}}>
								<Plus size={18} color="#E7A500"/>
								<Text style={styles.infoButtonText}> Add titles </Text>
							</TouchableOpacity>
						)}
					</View>

					<View style={styles.divider} />

					{playlistTracks.map((track, index) => (
						<TouchableOpacity key={track.id} style={styles.trackItem} onPress={() => playQueue(playlistTracks, index)}>
							<Image source={{ uri: track.thumbnail }} style={styles.trackImage} />
							<View style={styles.trackInfo}>
								<Text style={styles.trackTitle} numberOfLines={1}>{track.title}</Text>
								<Text style={styles.trackArtist} numberOfLines={1}>{track.artist}</Text>
								<Text style={{ fontSize: 11, color: "#8A8A8A" }} numberOfLines={1}>
									{isCollaborative && track.addedBy?.username ? `added by ${track.addedBy.username}` : ""}
								</Text>
							</View>
						</TouchableOpacity>
					))}

					{playlistTracks.length === 0 && (
						<View style={styles.emptyState}>
							<Text style={styles.emptyText}> No titles yet </Text>
						</View>
					)}

					{canAddTitles && playlistTracks.length === 0 && (
						<TouchableOpacity style={styles.addTitlesButton} onPress={() => router.push(`/playlist/search?id=${id}`)}>
							<Text style={styles.addTitlesText}> Add new titles </Text>
						</TouchableOpacity>
					)}

				</ScrollView>
			</View>

			<Modal visible={isEditModalVisible} animationType="fade" transparent onRequestClose={() => setIsEditModalVisible(false)}>
				<View style={styles.modalOverlay}>
					<View style={styles.modalContent}>
						<Text style={styles.modalTitle}> Edit playlist </Text>

						<View style={styles.editHeader}>
							<TouchableOpacity style={styles.coverPicker} onPress={pickImage} activeOpacity={0.8}>
								<Image source={{ uri: editImage || playlistImage || "https://blog.landr.com/wp-content/uploads/2017/07/how-to-get-on-a-playlist-feature.png" }} style={styles.coverPickerImage} />
								<View style={styles.coverOverlay}>
									<Pencil size={20} color="#FFFFFF" />
								</View>
							</TouchableOpacity>

							<View style={styles.editInfos}>
								<TextInput
									value={editName}
									onChangeText={setEditName}
									placeholder="Playlist name"
									placeholderTextColor={COLORS.textMuted}
									style={styles.playlistNameInput}
								/>
								<View style={styles.publicRow}>
									<Text style={styles.publicText}> Public playlist </Text>
									<Switch value={editIsPublic} onValueChange={setEditIsPublic} />
								</View>
							</View>
						</View>

						{isCollaborative && (
							<View style={{ marginTop: 10, marginBottom: 10 }}>
								<Text style={{ fontFamily: FONTS.medium, fontSize: 14, color: COLORS.textPrimary, marginBottom: 12 }}>
									Add new collaborators
								</Text>

								<View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>
									{newCollaborators.map((friend) => (
										<View key={friend.id} style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.primary, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16 }}>
											<Text style={{ color: 'white', marginRight: 6, fontFamily: FONTS.medium }}>{friend.username}</Text>
											<TouchableOpacity onPress={() => setNewCollaborators(prev => prev.filter(f => f.id !== friend.id))}>
												<X size={14} color="white" />
											</TouchableOpacity>
										</View>
									))}
								</View>

								<TextInput 
									value={friendSearchQuery} 
									onChangeText={setFriendSearchQuery} 
									placeholder="Search for a friend" 
									placeholderTextColor={COLORS.textMuted}
									autoCapitalize="none" 
									style={styles.modalInput} 
								/>
								
								{filteredFriends.map((friend: any) => {
									const friendUser = friend.sender?.username === myUsername ? friend.receiver : friend.sender;
									
									if (existingCollaborators.some(collab => collab.userId === friendUser.id)) return null;
									if (newCollaborators.some(f => f.id === friendUser.id)) return null;

									return (
										<TouchableOpacity 
											key={friendUser.id} 
											onPress={() => { 
												setNewCollaborators(prev => [...prev, { id: friendUser.id, username: friendUser.username }]);
												setFriendSearchQuery(""); 
											}} 
											style={{ paddingVertical: 10, paddingHorizontal: 12, borderRadius: 8, marginBottom: 6, backgroundColor: "#f5f5f5", marginTop: 8 }}
										>
											<Text style={{ fontFamily: FONTS.regular, color: COLORS.textPrimary }}>{friendUser.username}</Text>
										</TouchableOpacity>
									);
								})}
							</View>
						)}

						<View style={styles.modalButtons}>
							<TouchableOpacity style={styles.cancelButton} onPress={() => {
								setIsEditModalVisible(false);
								setNewCollaborators([]);
								setFriendSearchQuery("");
							}}>
								<Text style={styles.cancelButtonText}> Cancel </Text>
							</TouchableOpacity>

							<TouchableOpacity style={styles.saveButton} onPress={handleSave}>
								<Text style={styles.saveButtonText}> Save </Text>
							</TouchableOpacity>
						</View>
					</View>
				</View>
			</Modal>
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
		flexDirection: "row",
		alignItems: "center",
		gap: 6,
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
	modalOverlay: {
		flex: 1,
		justifyContent: "center",
		backgroundColor: "rgba(0,0,0,0.4)",
		padding: 24,
	},
	modalContent: {
		backgroundColor: COLORS.background,
		borderRadius: 20,
		padding: 20,
	},
	modalTitle: {
		fontFamily: FONTS.semiBold,
		fontSize: 18,
		color: COLORS.textPrimary,
		marginBottom: 20,
	},
	modalInput: {
		height: 48,
		borderRadius: 12,
		backgroundColor: "#F5F5F5",
		paddingHorizontal: 16,
		color: COLORS.textPrimary,
		fontFamily: FONTS.regular,
	},
	modalButtons: {
		flexDirection: "row",
		gap: 10,
		marginTop: 24,
	},
	cancelButton: {
		flex: 1,
		height: 48,
		borderRadius: 24,
		justifyContent: "center",
		alignItems: "center",
		backgroundColor: "#EAEAEA",
	},
	saveButton: {
		flex: 1,
		height: 48,
		borderRadius: 24,
		justifyContent: "center",
		alignItems: "center",
		backgroundColor: COLORS.primary,
	},
	cancelButtonText: {
		fontFamily: FONTS.semiBold,
		color: COLORS.textPrimary,
	},
	saveButtonText: {
		fontFamily: FONTS.semiBold,
		color: COLORS.white,
	},
	editHeader: {
		flexDirection: "row",
		alignItems: "center",
		marginBottom: 24,
	},
	coverPicker: {
		position: "relative",
	},
	coverPickerImage: {
		width: 90,
		height: 90,
		borderRadius: 10,
		opacity: 0.75,
	},
	coverOverlay: {
		position: "absolute",
		top: 0,
		left: 0,
		right: 0,
		bottom: 0,
		borderRadius: 10,
		backgroundColor: "rgba(0,0,0,0.35)",
		justifyContent: "center",
		alignItems: "center",
	},
	editInfos: {
		flex: 1,
		marginLeft: 18,
	},
	playlistNameInput: {
		fontFamily: FONTS.semiBold,
		fontSize: 18,
		color: COLORS.textPrimary,
		borderBottomWidth: 1,
		borderBottomColor: "#E5E5E5",
		paddingBottom: 8,
	},
	publicRow: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "space-between",
		marginTop: 16,
	},
	publicText: {
		fontFamily: FONTS.medium,
		fontSize: 14,
		color: COLORS.textPrimary,
	},
});