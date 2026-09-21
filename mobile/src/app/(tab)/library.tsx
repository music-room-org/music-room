import { View, ScrollView, Text, TouchableOpacity, StyleSheet, Platform, Modal, TextInput, Switch } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Search, PlusCircle, List, User, X, Radio } from "lucide-react-native";
import { COLORS, FONTS } from "@/constants";
import { LibraryPlaylistItem } from "@/components";
import { useState, useCallback } from "react";
import { useFocusEffect, useRouter } from "expo-router";
import * as SecureStore from "expo-secure-store";
import MapView, { Marker } from 'react-native-maps';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as Location from 'expo-location';

async function getToken() {
	if (Platform.OS === "web")  return localStorage.getItem("userToken");
	return await SecureStore.getItemAsync("userToken");
}

export default function Library() {
	const router = useRouter();
	const apiUrl = Platform.OS === "android" ? "http://10.0.2.2:3000" : "http://localhost:3000";

	const [isCreateModalVisible, setIsCreateModalVisible] = useState(false);
	const [newPlaylistName, setNewPlaylistName] = useState("");
	const [myPlaylists, setMyPlaylists] = useState<any[]>([]);
	const [myLiveSessions, setMyLiveSessions] = useState<any[]>([]);
	const [isTypeMenuVisible, setIsTypeMenuVisible] = useState(false);
	const [friendSearchQuery, setFriendSearchQuery] = useState("");
	
	const [selectedFriends, setSelectedFriends] = useState<{id: string, username: string}[]>([]);
	const [friendsList, setFriendsList] = useState<any[]>([]);
	const [myUsername, setMyUsername] = useState("");
	const [myUserId, setMyUserId] = useState("");
	
	const [isCollabMode, setIsCollabMode] = useState(false);
	const [isLiveMode, setIsLiveMode] = useState(false);
	const [isPublic, setIsPublic] = useState(true);
	const [license, setLicense] = useState('OPEN'); 

	// Recherche et Coordonnées GPS
	const [addressQuery, setAddressQuery] = useState("");
	const [location, setLocation] = useState({ latitude: 48.8566, longitude: 2.3522 });
	
	// Heures
	const [startTime, setStartTime] = useState(new Date());
	const [endTime, setEndTime] = useState(new Date(Date.now() + 2 * 60 * 60 * 1000));
	const [showStartPicker, setShowStartPicker] = useState(false);
	const [showEndPicker, setShowEndPicker] = useState(false);

	const geocodeAddress = async () => {
		if (!addressQuery.trim()) return;
		try {
			const result = await Location.geocodeAsync(addressQuery);
			if (result.length > 0) {
				setLocation({ latitude: result[0].latitude, longitude: result[0].longitude });
			} else {
				alert("Adresse introuvable");
			}
		} catch (e) {
			console.error(e);
			alert("Erreur lors de la recherche de l'adresse.");
		}
	};

	const handleCreatePlaylist = async () => {
		if (!newPlaylistName.trim()) {
			alert("Please enter a name.");
			return;
		}

		try {
			const token = await getToken();
			if (!token) return;

			if (isLiveMode) {
				const response = await fetch(`${apiUrl}/live_session`, {
					method: "POST",
					headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
					body: JSON.stringify({ 
						name: newPlaylistName, 
						isPublic, 
						license,
						latitude: license === 'LOCATION_TIME' ? location.latitude : null,
						longitude: license === 'LOCATION_TIME' ? location.longitude : null,
						startTime: license === 'LOCATION_TIME' ? startTime.toISOString() : null,
						endTime: license === 'LOCATION_TIME' ? endTime.toISOString() : null,
						invitedUsers: selectedFriends.map(f => f.id)
					}),
				});
				const newLive = await response.json();
				
				setIsCreateModalVisible(false);
				setNewPlaylistName("");
				setFriendSearchQuery("");
				setSelectedFriends([]);
				setAddressQuery("");
				setIsLiveMode(false);
				router.push(`/live/${newLive.id}`);
				return;
			}

			if (isCollabMode && selectedFriends.length === 0) {
				alert("Please select at least one friend for a collaborative playlist.");
				return;
			}

			const response = await fetch(`${apiUrl}/playlists`, {
				method: "POST",
				headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
				body: JSON.stringify({ name: newPlaylistName }),
			});
			const newPlaylist = await response.json();

			if (isCollabMode && selectedFriends.length > 0) {
				for (const friend of selectedFriends) {
					await fetch(`${apiUrl}/playlists/${newPlaylist.id}/collaborators`, {
						method: "POST",
						headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
						body: JSON.stringify({ userId: friend.id }),
					});
				}
			}

			setIsCreateModalVisible(false);
			setNewPlaylistName("");
			setFriendSearchQuery("");
			setSelectedFriends([]);
			router.push(`/playlist/${newPlaylist.id}`);
		} catch (error) {
			console.error(error);
		}
	};

	useFocusEffect(
		useCallback(() => {
			const fetchData = async () => {
				try {
					const token = await getToken();
					if (!token) return;

					let currentUserId = myUserId;

					const profileRes = await fetch(`${apiUrl}/auth/profil`, {
						method: "GET",
						headers: { Authorization: `Bearer ${token}` }
					});
					if (profileRes.ok) {
						const profileData = await profileRes.json();
						setMyUsername(profileData.username);
						setMyUserId(profileData.id);
						currentUserId = profileData.id; // Assure que le filtre en dessous a le bon ID
					}

					const playlistRes = await fetch(`${apiUrl}/playlists/mine`, {
						method: "GET",
						headers: { Authorization: `Bearer ${token}` },
					});
					if (playlistRes.ok) {
						const pData = await playlistRes.json();
						setMyPlaylists(Array.isArray(pData) ? pData : []);
					} else {
						setMyPlaylists([]);
					}

					const liveRes = await fetch(`${apiUrl}/live_session/available/all`, {
						method: "GET",
						headers: { Authorization: `Bearer ${token}` },
					});
					if (liveRes.ok) {
						const allLives = await liveRes.json();
						if (Array.isArray(allLives)) {
							const myEvents = allLives.filter((s: any) => 
								s.hostUserId === currentUserId || s.invitedUsers?.some((u: any) => u.id === currentUserId)
							);
							setMyLiveSessions(myEvents);
						} else {
							setMyLiveSessions([]);
						}
					} else {
						setMyLiveSessions([]);
					}

					const friendsResponse = await fetch(`${apiUrl}/friends/list`, {
						method: "GET",
						headers: { Authorization: `Bearer ${token}` },
					});
					if (friendsResponse.ok) {
						const fData = await friendsResponse.json();
						setFriendsList(Array.isArray(fData) ? fData : []);
					} else {
						setFriendsList([]);
					}
				} catch (error) {
					console.error(error);
				}
			};

			fetchData();
		}, [myUserId])
	);

	const filteredFriends = friendSearchQuery.trim() === "" 
		? [] 
		: friendsList.filter((friend: any) => {
			const friendUser = friend.sender?.username === myUsername ? friend.receiver : friend.sender;
			return friendUser?.username?.toLowerCase().includes(friendSearchQuery.toLowerCase());
		});

	return (
		<SafeAreaView style={styles.safeArea}>
			<ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
				<View style={styles.headerContainer}>
					<View style={styles.headerTopRow}>
						<Text style={styles.headerTitle}>My library</Text>
						<View style={styles.headerActions}>
							<TouchableOpacity>
								<Search size={26} color={COLORS.textMuted}/>
							</TouchableOpacity>
							<TouchableOpacity style={styles.actionIcon} onPress={() => setIsTypeMenuVisible(true)}>
								<PlusCircle size={26} color={COLORS.textMuted}/>
							</TouchableOpacity>
						</View>
					</View>
					<View style={styles.yellowLine}></View>
				</View>

				<View style={styles.listContainer}>
					{myLiveSessions?.map((session: any) => (
						<TouchableOpacity key={session.id} onPress={() => router.push(`/live/${session.id}`)}>
							<LibraryPlaylistItem 
								title={session.name} 
								author={session.hostUserId === myUserId ? "Live Event hosted by me" : "Invited Live Event"} 
								imageUrl="https://blog.landr.com/wp-content/uploads/2017/07/how-to-get-on-a-playlist-feature.png" 
							/>
						</TouchableOpacity>
					))}

					{myPlaylists?.map((playlist: any) => (
						<TouchableOpacity key={playlist.id} onPress={() => router.push(`/playlist/${playlist.id}`)}>
							<LibraryPlaylistItem 
								title={playlist.name} 
								author={playlist.collaborators?.length > 0 ? `Collaborative playlist by ${playlist.owner?.username || myUsername}` : `Playlist by ${playlist.owner?.username || myUsername}`} 
								imageUrl={playlist.imageUrl || "https://blog.landr.com/wp-content/uploads/2017/07/how-to-get-on-a-playlist-feature.png"} 
							/>
						</TouchableOpacity>
					))}
				</View>
			</ScrollView>

			<Modal visible={isTypeMenuVisible} transparent={true} animationType="slide" onRequestClose={() => setIsTypeMenuVisible(false)}>
                <View style={styles.typeMenuOverlay}>
                    <View style={styles.typeMenu}>
                        <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginBottom: 8 }}>
                            <TouchableOpacity onPress={() => setIsTypeMenuVisible(false)}>
                                <X size={24} color={COLORS.textPrimary} />
                            </TouchableOpacity>
                        </View>
                        
                        {/* L'option Playlist Classique que j'avais effacée */}
                        <TouchableOpacity style={styles.typeMenuItem} onPress={() => { setIsCollabMode(false); setIsLiveMode(false); setIsTypeMenuVisible(false); setIsCreateModalVisible(true); }}>
                            <List size={24} color={COLORS.textPrimary} />
                            <Text style={styles.typeMenuText}> Playlist classique </Text>
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.typeMenuItem} onPress={() => { setIsCollabMode(true); setIsLiveMode(false); setIsTypeMenuVisible(false); setIsCreateModalVisible(true); }}>
                            <User size={24} color={COLORS.textPrimary} />
                            <Text style={styles.typeMenuText}> Playlist collaborative </Text>
                        </TouchableOpacity>
                        
                        <TouchableOpacity style={styles.typeMenuItem} onPress={() => { setIsCollabMode(false); setIsLiveMode(true); setIsTypeMenuVisible(false); setIsCreateModalVisible(true); }}>
                            <Radio size={24} color={COLORS.primary} />
                            <Text style={[styles.typeMenuText, { color: COLORS.primary }]}> Live Session Event </Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

			<Modal visible={isCreateModalVisible} transparent={true} animationType="fade">
				<View style={styles.modalBackdrop}>
					<View style={styles.modalBox}>
						<View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginBottom: 16 }}>
							<TouchableOpacity onPress={() => {
								setIsCreateModalVisible(false);
								setNewPlaylistName("");
								setFriendSearchQuery("");
								setSelectedFriends([]);
								setAddressQuery("");
								setIsLiveMode(false);
							}}>
								<X size={24} color={COLORS.textMuted} />
							</TouchableOpacity>
						</View>
						<ScrollView showsVerticalScrollIndicator={false}>
							<TextInput 
								value={newPlaylistName} 
								onChangeText={setNewPlaylistName} 
								placeholder={isLiveMode ? "Event Name" : "Playlist name"} 
								style={styles.modalInput} 
								maxLength={15}
							/>

							{isLiveMode && (
								<>
									<View style={styles.toggleRow}>
										<Text style={styles.toggleLabel}>Visibility: Public</Text>
										<Switch value={isPublic} onValueChange={setIsPublic} />
									</View>
									
									<Text style={styles.licenseTitle}>Voting License</Text>
									<View style={styles.licenseRow}>
										<TouchableOpacity style={[styles.licenseBtn, license === 'OPEN' && styles.licenseBtnActive]} onPress={() => setLicense('OPEN')}>
											<Text style={[styles.licenseBtnText, license === 'OPEN' && styles.licenseBtnTextActive]}>Open</Text>
										</TouchableOpacity>
										<TouchableOpacity style={[styles.licenseBtn, license === 'INVITED_ONLY' && styles.licenseBtnActive]} onPress={() => setLicense('INVITED_ONLY')}>
											<Text style={[styles.licenseBtnText, license === 'INVITED_ONLY' && styles.licenseBtnTextActive]}>Invited</Text>
										</TouchableOpacity>
										<TouchableOpacity style={[styles.licenseBtn, license === 'LOCATION_TIME' && styles.licenseBtnActive]} onPress={() => setLicense('LOCATION_TIME')}>
											<Text style={[styles.licenseBtnText, license === 'LOCATION_TIME' && styles.licenseBtnTextActive]}>Loc/Time</Text>
										</TouchableOpacity>
									</View>

									{license === 'LOCATION_TIME' && (
										<View style={styles.locTimeContainer}>
											<Text style={styles.inputLabel}>Lieu de l'événement</Text>
											
											<View style={styles.addressSearchRow}>
												<TextInput 
													value={addressQuery}
													onChangeText={setAddressQuery}
													placeholder="Ville, rue, adresse..."
													placeholderTextColor={COLORS.textMuted}
													style={styles.addressInput}
													onSubmitEditing={geocodeAddress}
												/>
												<TouchableOpacity style={styles.addressSearchBtn} onPress={geocodeAddress}>
													<Search size={20} color="white" />
												</TouchableOpacity>
											</View>

											<View style={styles.mapContainer}>
												<MapView 
													style={styles.map}
													region={{
														latitude: location.latitude,
														longitude: location.longitude,
														latitudeDelta: 0.05,
														longitudeDelta: 0.05,
													}}
												>
													<Marker 
														coordinate={location} 
														draggable 
														onDragEnd={(e) => setLocation(e.nativeEvent.coordinate)}
													/>
												</MapView>
											</View>

											<Text style={styles.inputLabel}>Créneau de l'événement</Text>
											<View style={styles.timeRow}>
												<TouchableOpacity style={styles.timeBtn} onPress={() => setShowStartPicker(true)}>
													<Text style={styles.timeBtnText}>Début: {startTime.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</Text>
												</TouchableOpacity>
												<TouchableOpacity style={styles.timeBtn} onPress={() => setShowEndPicker(true)}>
													<Text style={styles.timeBtnText}>Fin: {endTime.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</Text>
												</TouchableOpacity>
											</View>

											{showStartPicker && (
												<DateTimePicker
													value={startTime}
													mode="time"
													display="default"
													onChange={(event, date) => {
														setShowStartPicker(false);
														if (date) setStartTime(date);
													}}
												/>
											)}
											{showEndPicker && (
												<DateTimePicker
													value={endTime}
													mode="time"
													display="default"
													onChange={(event, date) => {
														setShowEndPicker(false);
														if (date) setEndTime(date);
													}}
												/>
											)}
										</View>
									)}
								</>
							)}

							{(isCollabMode || (isLiveMode && (!isPublic || license === 'INVITED_ONLY'))) && (
								<>
									<View style={styles.friendsContainer}>
										{selectedFriends.map((friend) => (
											<View key={friend.id} style={styles.friendBadge}>
												<Text style={styles.friendBadgeText}>{friend.username}</Text>
												<TouchableOpacity onPress={() => setSelectedFriends(prev => prev.filter(f => f.id !== friend.id))}>
													<X size={14} color="white" />
												</TouchableOpacity>
											</View>
										))}
									</View>

									<TextInput 
										value={friendSearchQuery} 
										onChangeText={setFriendSearchQuery} 
										placeholder={isLiveMode ? "Invite friends to event..." : "Search for a friend"} 
										autoCapitalize="none" 
										style={styles.modalInputMargin} 
									/>
									
									{filteredFriends.map((friend: any) => {
										const friendUser = friend.sender?.username === myUsername ? friend.receiver : friend.sender;
										
										if (selectedFriends.some(f => f.id === friendUser.id)) return null;

										return (
											<TouchableOpacity 
												key={friendUser.id} 
												onPress={() => { 
													setSelectedFriends(prev => [...prev, { id: friendUser.id, username: friendUser.username }]);
													setFriendSearchQuery(""); 
												}} 
												style={styles.friendSelectBtn}
											>
												<Text style={styles.friendSelectBtnText}>{friendUser.username}</Text>
											</TouchableOpacity>
										);
									})}
								</>
							)}

							<View style={styles.modalActions}>
								<TouchableOpacity onPress={() => {
									setIsCreateModalVisible(false);
									setNewPlaylistName("");
									setFriendSearchQuery("");
									setSelectedFriends([]);
									setAddressQuery("");
									setIsLiveMode(false);
								}} style={styles.cancelBtn}>
									<Text style={styles.cancelBtnText}>Cancel</Text>
								</TouchableOpacity>
								<TouchableOpacity onPress={handleCreatePlaylist} style={styles.saveBtn}>
									<Text style={styles.saveBtnText}>Create</Text>
								</TouchableOpacity>
							</View>
						</ScrollView>
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
	scrollContent: {
		paddingHorizontal: 24,
		paddingTop: 20,
		paddingBottom: 100,
	},
	headerContainer: {
		marginBottom: 24,
	},
	headerTopRow: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
		width: '100%',
	},
	headerTitle: {
		fontFamily: FONTS.semiBold,
		fontSize: 28,
		color: COLORS.textPrimary,
	},
	headerActions: {
		flexDirection: 'row',
		alignItems: 'center',
	},
	actionIcon: {
		marginLeft: 16,
	},
	yellowLine: {
		height: 4,
		backgroundColor: COLORS.primary,
		width: '100%',
		borderRadius: 2,
		marginTop: 16,
	},
	typeMenuOverlay: {
		flex: 1,
		backgroundColor: "rgba(0,0,0,0.5)",
		justifyContent: "flex-end",
	},
	typeMenu: {
		backgroundColor: COLORS.background,
		borderTopLeftRadius: 20,
		borderTopRightRadius: 20,
		padding: 24,
		paddingBottom: 40,
	},
	typeMenuItem: {
		flexDirection: "row",
		alignItems: "center",
		paddingVertical: 18,
	},
	typeMenuText: {
		marginLeft: 16,
		fontFamily: FONTS.semiBold,
		fontSize: 17,
		color: COLORS.textPrimary,
	},
	listContainer: {
		marginTop: 8,
	},
	modalBackdrop: {
		flex: 1,
		backgroundColor: "rgba(0,0,0,0.5)",
		justifyContent: "center",
		alignItems: "center",
	},
	modalBox: {
		width: "85%",
		maxHeight: "85%",
		backgroundColor: "white",
		borderRadius: 12,
		padding: 20,
	},
	modalInput: {
		borderWidth: 1,
		borderColor: "#ddd",
		color: COLORS.textPrimary,
		borderRadius: 8,
		padding: 12,
		marginBottom: 16,
		fontFamily: FONTS.regular,
	},
	modalInputMargin: {
		borderWidth: 1,
		borderColor: "#ddd",
		color: COLORS.textPrimary,
		borderRadius: 8,
		padding: 12,
		marginBottom: 12,
		fontFamily: FONTS.regular,
	},
	toggleRow: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "space-between",
		marginBottom: 16,
	},
	toggleLabel: {
		fontFamily: FONTS.medium,
		color: COLORS.textPrimary,
	},
	licenseTitle: {
		fontFamily: FONTS.medium,
		color: COLORS.textPrimary,
		marginBottom: 8,
	},
	licenseRow: {
		flexDirection: "row",
		justifyContent: "space-between",
		gap: 6,
	},
	licenseBtn: {
		flex: 1,
		paddingVertical: 8,
		alignItems: "center",
		borderRadius: 8,
		backgroundColor: "#EAEAEA",
	},
	licenseBtnActive: {
		backgroundColor: COLORS.primary,
	},
	licenseBtnText: {
		fontFamily: FONTS.semiBold,
		fontSize: 12,
		color: COLORS.textMuted,
	},
	licenseBtnTextActive: {
		color: COLORS.white,
	},
	locTimeContainer: {
		marginTop: 16,
		paddingTop: 16,
		borderTopWidth: 1,
		borderColor: "#EAEAEA",
	},
	inputLabel: {
		fontFamily: FONTS.medium,
		color: COLORS.textPrimary,
		marginBottom: 8,
		fontSize: 13,
	},
	addressSearchRow: {
		flexDirection: "row",
		alignItems: "center",
		marginBottom: 12,
		gap: 8,
	},
	addressInput: {
		flex: 1,
		borderWidth: 1,
		borderColor: "#ddd",
		borderRadius: 8,
		padding: 12,
		color: COLORS.textPrimary,
		fontFamily: FONTS.regular,
	},
	addressSearchBtn: {
		backgroundColor: COLORS.primary,
		width: 48,
		height: 48,
		borderRadius: 8,
		justifyContent: "center",
		alignItems: "center",
	},
	mapContainer: {
		height: 180,
		width: '100%',
		borderRadius: 8,
		overflow: 'hidden',
		marginBottom: 16,
		borderWidth: 1,
		borderColor: '#EAEAEA',
	},
	map: {
		flex: 1,
	},
	timeRow: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		gap: 10,
		marginBottom: 16,
	},
	timeBtn: {
		flex: 1,
		borderWidth: 1,
		borderColor: '#ddd',
		borderRadius: 8,
		paddingVertical: 12,
		alignItems: 'center',
		backgroundColor: '#FAFAFA',
	},
	timeBtnText: {
		fontFamily: FONTS.regular,
		color: COLORS.textPrimary,
		fontSize: 14,
	},
	friendsContainer: {
		flexDirection: 'row',
		flexWrap: 'wrap',
		gap: 8,
		marginBottom: 12,
		marginTop: 16,
	},
	friendBadge: {
		flexDirection: 'row',
		alignItems: 'center',
		backgroundColor: COLORS.primary,
		paddingHorizontal: 12,
		paddingVertical: 6,
		borderRadius: 16,
	},
	friendBadgeText: {
		color: 'white',
		marginRight: 6,
		fontFamily: FONTS.medium,
	},
	friendSelectBtn: {
		paddingVertical: 10,
		paddingHorizontal: 12,
		borderRadius: 8,
		marginBottom: 6,
		backgroundColor: "#f5f5f5",
	},
	friendSelectBtnText: {
		fontFamily: FONTS.regular,
		color: COLORS.textPrimary,
	},
	modalActions: {
		flexDirection: "row",
		justifyContent: "flex-end",
		marginTop: 10,
	},
	cancelBtn: {
		marginRight: 16,
		paddingVertical: 10,
		paddingHorizontal: 16,
	},
	cancelBtnText: {
		fontFamily: FONTS.medium,
		color: COLORS.textMuted,
	},
	saveBtn: {
		backgroundColor: COLORS.primary,
		paddingVertical: 10,
		paddingHorizontal: 20,
		borderRadius: 20,
	},
	saveBtnText: {
		fontFamily: FONTS.semiBold,
		color: COLORS.white,
	},
});