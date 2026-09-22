import { View, Text, StyleSheet, TouchableOpacity, TextInput, Platform, ScrollView, Image, ActivityIndicator, Modal, Switch } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ChevronLeft, ThumbsUp, Play, Plus, Search, Power, Pencil, X, MoreVertical } from "lucide-react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { COLORS, FONTS, API_BASE_URL } from "@/constants";
import { useState, useCallback, useEffect, useRef } from "react";
import * as SecureStore from "expo-secure-store";
import { usePlayer } from "@/context/PlayerContext";

import DateTimePicker from '@react-native-community/datetimepicker';
import * as Location from 'expo-location';

let MapView: any;
let Marker: any;

if (Platform.OS !== 'web') {
    const Maps = require('react-native-maps');
    MapView = Maps.default;
    Marker = Maps.Marker;
}

async function getToken() {
	if (Platform.OS === "web") return localStorage.getItem("userToken");
	return await SecureStore.getItemAsync("userToken");
}

export default function LiveSession() {
	const { id } = useLocalSearchParams();
	const router = useRouter();
	const { playTrack } = usePlayer();

	const isClosing = useRef(false);
	const shouldRedirectRef = useRef(false);

	const [sessionName, setSessionName] = useState("Loading Session...");
	const [tracks, setTracks] = useState<any[]>([]);
	const [searchQuery, setSearchQuery] = useState("");
	const [searchResults, setSearchResults] = useState<any[]>([]);
	const [isSearching, setIsSearching] = useState(false);

	const [hostUserId, setHostUserId] = useState("");
	const [myUserId, setMyUserId] = useState("");
	const [isPublic, setIsPublic] = useState(true);
	const [license, setLicense] = useState("OPEN");
	const [invitedUsers, setInvitedUsers] = useState<any[]>([]);

	const [isEditModalVisible, setIsEditModalVisible] = useState(false);
	const [editName, setEditName] = useState("");
	const [editIsPublic, setEditIsPublic] = useState(true);
	const [editLicense, setEditLicense] = useState("OPEN");
	
	const [editAddressQuery, setEditAddressQuery] = useState("");
	const [editLocation, setEditLocation] = useState({ latitude: 48.8566, longitude: 2.3522 });
	
	const [editStartTime, setEditStartTime] = useState(new Date());
	const [editEndTime, setEditEndTime] = useState(new Date(Date.now() + 2 * 60 * 60 * 1000));
	const [showStartDatePicker, setShowStartDatePicker] = useState(false);
	const [showStartTimePicker, setShowStartTimePicker] = useState(false);
	const [showEndDatePicker, setShowEndDatePicker] = useState(false);
	const [showEndTimePicker, setShowEndTimePicker] = useState(false);

	const [newCollaborators, setNewCollaborators] = useState<{id: string, username: string}[]>([]);
	const [friendSearchQuery, setFriendSearchQuery] = useState("");
	const [friendsList, setFriendsList] = useState<any[]>([]);
	const [myUsername, setMyUsername] = useState("");

	// Modales personnalisées pour remplacer les alerts
	const [errorModalVisible, setErrorModalVisible] = useState(false);
	const [errorMessage, setErrorMessage] = useState("");
	
	const [isDeleteModalVisible, setIsDeleteModalVisible] = useState(false);
	const [trackToDelete, setTrackToDelete] = useState<string | null>(null);

	const apiUrl = Platform.OS === "android" ? "http://10.0.2.2:3000" : "http://localhost:3000";

	const showError = (msg: string, redirect = false) => {
		shouldRedirectRef.current = redirect;
		setErrorMessage(msg);
		setErrorModalVisible(true);
	};

	const fetchSession = useCallback(async () => {
		if (isClosing.current) return;

		try {
			const token = await getToken();
			
			if (!myUserId) {
				const profileRes = await fetch(`${apiUrl}/auth/profil`, { headers: { Authorization: `Bearer ${token}` } });
				if (profileRes.ok) {
					const profileData = await profileRes.json();
					setMyUserId(profileData.id);
					setMyUsername(profileData.username);
				}
				const friendsRes = await fetch(`${apiUrl}/friends/list`, { headers: { Authorization: `Bearer ${token}` } });
				if (friendsRes.ok) {
					setFriendsList(await friendsRes.json());
				}
			}

			const response = await fetch(`${apiUrl}/live_session/${id}`, {
				headers: { Authorization: `Bearer ${token}` }
			});

			if (response.ok) {
				const data = await response.json();
				setSessionName(data.name);
				setHostUserId(data.hostUserId);
				setIsPublic(data.isPublic);
				setLicense(data.license);
				setInvitedUsers(data.invitedUsers || []);
				
				if (data.latitude && data.longitude) {
					setEditLocation({ latitude: data.latitude, longitude: data.longitude });
				}
				if (data.startTime) setEditStartTime(new Date(data.startTime));
				if (data.endTime) setEditEndTime(new Date(data.endTime));
				
				if (data.liveSessionTracks) {
					setTracks(data.liveSessionTracks);
				}
			} else if (response.status === 404) {
				isClosing.current = true;
				showError("This event has finished.", true);
			} else {
				isClosing.current = true;
				const err = await response.json();
				showError(`Access error: ${err.message}`, true);
			}
		} catch (error) {
			console.error(error);
		}
	}, [id, myUserId]);

	useEffect(() => {
		fetchSession();
		const interval = setInterval(fetchSession, 3000);
		return () => clearInterval(interval);
	}, [fetchSession]);

	const geocodeEditAddress = async () => {
		if (!editAddressQuery.trim()) return;
		try {
			const result = await Location.geocodeAsync(editAddressQuery);
			if (result.length > 0) {
				setEditLocation({ latitude: result[0].latitude, longitude: result[0].longitude });
			} else {
				showError("Cannot find address");
			}
		} catch (e) {
			console.error(e);
			showError("Error while searching for the address.");
		}
	};

	const handleVote = async (trackId: string) => {
		try {
			let userLat: number | undefined;
			let userLon: number | undefined;

			// Seuls les invités doivent fournir leur localisation
			if (license === 'LOCATION_TIME' && myUserId !== hostUserId) {
				const { status } = await Location.requestForegroundPermissionsAsync();
				
				if (status !== 'granted') {
					showError("You have to accept GPS tracking to participate to this event.");
					return;
				}

				const location = await Location.getCurrentPositionAsync({
					accuracy: Location.Accuracy.Highest
				});
				
				userLat = location.coords.latitude;
				userLon = location.coords.longitude;
			}

			const token = await getToken();
			const response = await fetch(`${apiUrl}/live_session/vote`, {
				method: "POST",
				headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
				body: JSON.stringify({ 
					sessionId: id, 
					trackId,
					latitude: userLat,
					longitude: userLon
				})
			});

			if (!response.ok) {
				const errorData = await response.json().catch(() => ({ message: "Unknown error" }));
				showError(errorData.message || "Impossible to vote");
				return;
			}
			
			fetchSession();
		} catch (err) {
			console.error(err);
			showError("Error while retrieving GPS tracking or sending vote.");
		}
	};

	const handleNextTrack = async () => {
		try {
			const token = await getToken();
			const response = await fetch(`${apiUrl}/live_session/track/${id}`, {
				headers: { Authorization: `Bearer ${token}` }
			});
			if (response.ok) {
				const nextTrackData = await response.json();
				playTrack(nextTrackData.track);
				fetchSession();
			} else {
				showError("No tracks in queue!");
			}
		} catch (err) {
			console.error(err);
		}
	};

	const handleSearch = async (text: string) => {
		setSearchQuery(text);
		if (!text.trim()) {
			setSearchResults([]);
			return;
		}
		try {
			setIsSearching(true);
			const res = await fetch(`${API_BASE_URL}/player/search?q=${encodeURIComponent(text)}`);
			if (res.ok) setSearchResults(await res.json());
		} catch (err) {} finally {
			setIsSearching(false);
		}
	};

	const handleAddTrack = async (track: any) => {
		try {
			let userLat: number | undefined;
			let userLon: number | undefined;

			// Seuls les invités doivent fournir leur localisation
			if (license === 'LOCATION_TIME' && myUserId !== hostUserId) {
				const { status } = await Location.requestForegroundPermissionsAsync();
				
				if (status !== 'granted') {
					showError("You have to accept GPS tracking to add a title to this event");
					return;
				}

				const location = await Location.getCurrentPositionAsync({
					accuracy: Location.Accuracy.Highest
				});
				
				userLat = location.coords.latitude;
				userLon = location.coords.longitude;
			}

			const token = await getToken();
			const response = await fetch(`${apiUrl}/live_session/${id}/tracks`, {
				method: "POST",
				headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
				body: JSON.stringify({ 
					title: track.title, 
					artist: track.artist || "Unknown Artist", 
					sourceId: track.id,
					latitude: userLat,
					longitude: userLon
				})
			});

			if (!response.ok) {
				const errorData = await response.json().catch(() => ({ message: "Unknown error" }));
				showError(`Cannot add : ${errorData.message || response.status}`);
				return;
			}
			setSearchQuery("");
			setSearchResults([]);
			fetchSession();
		} catch (err) {
			showError("Error connecting to the serveur or GPS tracking.");
		}
	};

	const confirmDeleteTrack = async () => {
		if (!trackToDelete) return;
		try {
			const token = await getToken();
			await fetch(`${apiUrl}/live_session/${id}/tracks/${trackToDelete}`, {
				method: "DELETE",
				headers: { Authorization: `Bearer ${token}` }
			});
			fetchSession();
			setIsDeleteModalVisible(false);
			setTrackToDelete(null);
		} catch (err) {
			console.error("Delete track error:", err);
		}
	};

	const handleSaveSettings = async () => {
		try {
			const token = await getToken();
			const response = await fetch(`${apiUrl}/live_session/${id}`, {
				method: "PATCH",
				headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
				body: JSON.stringify({ 
					name: editName, 
					isPublic: editIsPublic, 
					license: editLicense,
					latitude: editLicense === 'LOCATION_TIME' ? editLocation.latitude : null,
					longitude: editLicense === 'LOCATION_TIME' ? editLocation.longitude : null,
					startTime: editLicense === 'LOCATION_TIME' ? editStartTime.toISOString() : null,
					endTime: editLicense === 'LOCATION_TIME' ? editEndTime.toISOString() : null,
					invitedUsers: newCollaborators.map(f => f.id)
				}),
			});

			if (response.ok) {
				setIsEditModalVisible(false);
				setNewCollaborators([]);
				setFriendSearchQuery("");
				setEditAddressQuery("");
				fetchSession();
			} else {
				showError("Failed to update session");
			}
		} catch (err) {
			console.error(err);
		}
	};

	const handleEndSession = async () => {
		try {
			isClosing.current = true;
			const token = await getToken();
			await fetch(`${apiUrl}/live_session/${id}`, {
				method: "DELETE",
				headers: { Authorization: `Bearer ${token}` }
			});
			router.replace("/library");
		} catch (err) {
			isClosing.current = false;
		}
	};

	const isOwner = hostUserId === myUserId;
	const isInvited = invitedUsers.some(u => u.id === myUserId);
	const canModifyTracks = isOwner || license === 'OPEN' || isInvited;

	const filteredFriends = friendSearchQuery.trim() === "" 
		? [] 
		: friendsList.filter((friend: any) => {
			const friendUser = friend.sender?.username === myUsername ? friend.receiver : friend.sender;
			return friendUser?.username?.toLowerCase().includes(friendSearchQuery.toLowerCase());
		});

	return (
		<SafeAreaView style={styles.safeArea}>
			<View style={styles.container}>
				<View style={styles.header}>
					<TouchableOpacity onPress={() => router.back()} style={styles.iconButton}>
						<ChevronLeft size={28} color={COLORS.textPrimary} />
					</TouchableOpacity>
					
					<View style={styles.headerTitleContainer}>
						<Text style={styles.headerTitle}>{sessionName}</Text>
						<Text style={styles.headerSubtitle}>
							{isPublic ? "🌍 Public" : "🔒 Private"} • {license === 'OPEN' ? 'Open Voting' : license === 'INVITED_ONLY' ? 'Invited Only' : 'Loc/Time Rules'}
						</Text>
					</View>

					<View style={styles.headerRightActions}>
						{isOwner && (
							<TouchableOpacity onPress={() => {
								setEditName(sessionName);
								setEditIsPublic(isPublic);
								setEditLicense(license);
								setIsEditModalVisible(true);
							}} style={styles.iconButton}>
								<Pencil size={20} color={COLORS.primary} />
							</TouchableOpacity>
						)}
						{isOwner && (
							<TouchableOpacity onPress={handleEndSession} style={styles.iconButton}>
								<Power size={22} color="red" />
							</TouchableOpacity>
						)}
					</View>
				</View>

				{isOwner && (
					<View style={styles.actionBar}>
						<TouchableOpacity style={styles.playNextBtn} onPress={handleNextTrack}>
							<Play size={20} color="white" fill="white" />
							<Text style={styles.playNextText}>Play Next Track</Text>
						</TouchableOpacity>
					</View>
				)}

				{canModifyTracks && (
					<View style={styles.searchContainer}>
						<Search size={20} color={COLORS.textMuted} />
						<TextInput
							value={searchQuery}
							onChangeText={handleSearch}
							placeholder="Suggest a track for the Live Session..."
							placeholderTextColor={COLORS.textMuted}
							style={styles.searchInput}
						/>
					</View>
				)}

				<ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
					{searchQuery.length > 0 ? (
						<View style={styles.list}>
							{isSearching ? <ActivityIndicator size="small" color={COLORS.primary} style={{ marginTop: 20 }} /> : null}
							{searchResults.map(track => (
								<View key={track.id} style={styles.trackCard}>
									<Image source={{ uri: track.thumbnail }} style={styles.trackImage} />
									<View style={styles.trackInfo}>
										<Text style={styles.trackTitle} numberOfLines={1}>{track.title}</Text>
										<Text style={styles.trackArtist} numberOfLines={1}>{track.artist}</Text>
									</View>
									<TouchableOpacity style={styles.addBtn} onPress={() => handleAddTrack(track)}>
										<Plus size={20} color="white" />
									</TouchableOpacity>
								</View>
							))}
						</View>
					) : (
						<View style={styles.list}>
							<Text style={styles.sectionTitle}>Up Next ({tracks.length})</Text>
							{tracks.map((item, index) => (
								<View key={item.trackId} style={styles.trackCard}>
									<Text style={styles.rankText}>#{index + 1}</Text>
									<Image 
										source={{ uri: item.track?.sourceId ? `https://i.ytimg.com/vi/${item.track.sourceId}/hqdefault.jpg` : "https://picsum.photos/100" }} 
										style={styles.trackImage} 
									/>
									<View style={styles.trackInfo}>
										<Text style={styles.trackTitle} numberOfLines={1}>{item.track?.title}</Text>
										<Text style={styles.trackArtist} numberOfLines={1}>{item.track?.artist}</Text>
									</View>
									<TouchableOpacity style={styles.voteBtn} onPress={() => handleVote(item.trackId)}>
										<ThumbsUp size={16} color="white" />
										<Text style={styles.voteText}>{item.votes?.length || 0}</Text>
									</TouchableOpacity>

									{canModifyTracks && (
										<TouchableOpacity 
											onPress={() => {
												setTrackToDelete(item.trackId);
												setIsDeleteModalVisible(true);
											}}
											style={styles.moreOptionsBtn}
										>
											<MoreVertical size={20} color={COLORS.textMuted} />
										</TouchableOpacity>
									)}
								</View>
							))}
							{tracks.length === 0 && (
								<Text style={styles.emptyText}>No tracks in queue. Search above to suggest one!</Text>
							)}
						</View>
					)}
				</ScrollView>
			</View>

			{/* Modale d'Erreur */}
			<Modal visible={errorModalVisible} animationType="fade" transparent onRequestClose={() => setErrorModalVisible(false)}>
				<View style={styles.modalOverlay}>
					<View style={styles.compactModalContent}>
						<View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
							<Text style={[styles.modalTitle, { marginBottom: 0 }]}>Attention</Text>
							<TouchableOpacity onPress={() => {
								setErrorModalVisible(false);
								if (shouldRedirectRef.current) router.replace("/library");
							}}>
								<X size={20} color={COLORS.textMuted} />
							</TouchableOpacity>
						</View>
						<Text style={styles.modalText}>{errorMessage}</Text>
						<View style={styles.modalButtons}>
							<TouchableOpacity style={styles.saveButton} onPress={() => {
								setErrorModalVisible(false);
								if (shouldRedirectRef.current) router.replace("/library");
							}}>
								<Text style={styles.saveButtonText}>OK</Text>
							</TouchableOpacity>
						</View>
					</View>
				</View>
			</Modal>

			{/* Modale de Suppression */}
			<Modal visible={isDeleteModalVisible} animationType="fade" transparent onRequestClose={() => setIsDeleteModalVisible(false)}>
				<View style={styles.modalOverlay}>
					<View style={styles.compactModalContent}>
						<View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
							<Text style={[styles.modalTitle, { marginBottom: 0 }]}>Delete title</Text>
							<TouchableOpacity onPress={() => setIsDeleteModalVisible(false)}>
								<X size={20} color={COLORS.textMuted} />
							</TouchableOpacity>
						</View>
						<Text style={styles.modalText}>Do you really want to delete this title from the event ?</Text>
						<View style={styles.modalButtons}>
							<TouchableOpacity style={styles.cancelButton} onPress={() => setIsDeleteModalVisible(false)}>
								<Text style={styles.cancelButtonText}>Cancel</Text>
							</TouchableOpacity>
							<TouchableOpacity style={styles.deleteButton} onPress={confirmDeleteTrack}>
								<Text style={styles.saveButtonText}>Delete</Text>
							</TouchableOpacity>
						</View>
					</View>
				</View>
			</Modal>

			{/* Modale d'Édition */}
			<Modal visible={isEditModalVisible} animationType="fade" transparent onRequestClose={() => setIsEditModalVisible(false)}>
				<View style={styles.modalOverlay}>
					<View style={styles.modalContent}>
						<View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
							<Text style={[styles.modalTitle, { marginBottom: 0 }]}> Event Settings </Text>
							<TouchableOpacity onPress={() => setIsEditModalVisible(false)}>
								<X size={24} color={COLORS.textPrimary} />
							</TouchableOpacity>
						</View>

						<ScrollView showsVerticalScrollIndicator={false}>
							<TextInput
								value={editName}
								onChangeText={setEditName}
								placeholder="Event name"
								placeholderTextColor={COLORS.textMuted}
								style={styles.modalInput}
								maxLength={15}
							/>

							<View style={styles.toggleRow}>
								<Text style={styles.toggleLabel}>Visibility: Public</Text>
								<Switch value={editIsPublic} onValueChange={setEditIsPublic} />
							</View>

							<Text style={styles.licenseTitle}>Voting License</Text>
							<View style={styles.licenseRow}>
								<TouchableOpacity style={[styles.licenseBtn, editLicense === 'OPEN' && styles.licenseBtnActive]} onPress={() => setEditLicense('OPEN')}>
									<Text style={[styles.licenseBtnText, editLicense === 'OPEN' && styles.licenseBtnTextActive]}>Open</Text>
								</TouchableOpacity>
								<TouchableOpacity style={[styles.licenseBtn, editLicense === 'INVITED_ONLY' && styles.licenseBtnActive]} onPress={() => setEditLicense('INVITED_ONLY')}>
									<Text style={[styles.licenseBtnText, editLicense === 'INVITED_ONLY' && styles.licenseBtnTextActive]}>Invited</Text>
								</TouchableOpacity>
								<TouchableOpacity style={[styles.licenseBtn, editLicense === 'LOCATION_TIME' && styles.licenseBtnActive]} onPress={() => setEditLicense('LOCATION_TIME')}>
									<Text style={[styles.licenseBtnText, editLicense === 'LOCATION_TIME' && styles.licenseBtnTextActive]}>Loc/Time</Text>
								</TouchableOpacity>
							</View>

							{editLicense === 'LOCATION_TIME' && (
								<View style={styles.locTimeContainer}>
									<Text style={styles.inputLabel}>Place of event</Text>
									
									<View style={styles.addressSearchRow}>
										<TextInput 
											value={editAddressQuery}
											onChangeText={setEditAddressQuery}
											placeholder="City, street, address..."
											placeholderTextColor={COLORS.textMuted}
											style={styles.addressInput}
											onSubmitEditing={geocodeEditAddress}
										/>
										<TouchableOpacity style={styles.addressSearchBtn} onPress={geocodeEditAddress}>
											<Search size={20} color="white" />
										</TouchableOpacity>
									</View>

									<View style={styles.mapContainer}>
										{Platform.OS === 'web' ? (
											<iframe
												src={`https://www.openstreetmap.org/export/embed.html?bbox=${editLocation.longitude - 0.01},${editLocation.latitude - 0.01},${editLocation.longitude + 0.01},${editLocation.latitude + 0.01}&layer=mapnik&marker=${editLocation.latitude},${editLocation.longitude}`}
												style={{ width: '100%', height: '100%', border: 'none' }}
												title="Map de l'événement"
											/>
										) : (
											<MapView 
												style={styles.map}
												region={{
													latitude: editLocation.latitude,
													longitude: editLocation.longitude,
													latitudeDelta: 0.05,
													longitudeDelta: 0.05,
												}}
											>
												<Marker 
													coordinate={editLocation} 
													draggable 
													onDragEnd={(e) => setEditLocation(e.nativeEvent.coordinate)}
												/>
											</MapView>
										)}
									</View>

									<Text style={styles.inputLabel}>Beginning of the event</Text>
									<View style={styles.timeRow}>
										<TouchableOpacity style={styles.timeBtn} onPress={() => setShowStartDatePicker(true)}>
											<Text style={styles.timeBtnText}>{editStartTime.toLocaleDateString()}</Text>
										</TouchableOpacity>
										<TouchableOpacity style={styles.timeBtn} onPress={() => setShowStartTimePicker(true)}>
											<Text style={styles.timeBtnText}>{editStartTime.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</Text>
										</TouchableOpacity>
									</View>

									<Text style={styles.inputLabel}>End of the event</Text>
									<View style={styles.timeRow}>
										<TouchableOpacity style={styles.timeBtn} onPress={() => setShowEndDatePicker(true)}>
											<Text style={styles.timeBtnText}>{editEndTime.toLocaleDateString()}</Text>
										</TouchableOpacity>
										<TouchableOpacity style={styles.timeBtn} onPress={() => setShowEndTimePicker(true)}>
											<Text style={styles.timeBtnText}>{editEndTime.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</Text>
										</TouchableOpacity>
									</View>

									{showStartDatePicker && (
										<DateTimePicker
											value={editStartTime}
											mode="date"
											display="default"
											onChange={(event, date) => {
												setShowStartDatePicker(false);
												if (date) {
													const newDate = new Date(editStartTime);
													newDate.setFullYear(date.getFullYear(), date.getMonth(), date.getDate());
													setEditStartTime(newDate);
												}
											}}
										/>
									)}
									{showStartTimePicker && (
										<DateTimePicker
											value={editStartTime}
											mode="time"
											display="default"
											onChange={(event, date) => {
												setShowStartTimePicker(false);
												if (date) {
													const newDate = new Date(editStartTime);
													newDate.setHours(date.getHours(), date.getMinutes(), 0);
													setEditStartTime(newDate);
												}
											}}
										/>
									)}

									{showEndDatePicker && (
										<DateTimePicker
											value={editEndTime}
											mode="date"
											display="default"
											onChange={(event, date) => {
												setShowEndDatePicker(false);
												if (date) {
													const newDate = new Date(editEndTime);
													newDate.setFullYear(date.getFullYear(), date.getMonth(), date.getDate());
													setEditEndTime(newDate);
												}
											}}
										/>
									)}
									{showEndTimePicker && (
										<DateTimePicker
											value={editEndTime}
											mode="time"
											display="default"
											onChange={(event, date) => {
												setShowEndTimePicker(false);
												if (date) {
													const newDate = new Date(editEndTime);
													newDate.setHours(date.getHours(), date.getMinutes(), 0);
													setEditEndTime(newDate);
												}
											}}
										/>
									)}
								</View>
							)}

							{(!editIsPublic || editLicense === 'INVITED_ONLY') && (
								<View style={styles.friendsSection}>
									<Text style={styles.friendsSectionTitle}>
										Invite more friends
									</Text>

									<View style={styles.friendsContainer}>
										{newCollaborators.map((friend) => (
											<View key={friend.id} style={styles.friendBadge}>
												<Text style={styles.friendBadgeText}>{friend.username}</Text>
												<TouchableOpacity onPress={() => setNewCollaborators(prev => prev.filter(f => f.id !== friend.id))}>
													<X size={14} color="white" />
												</TouchableOpacity>
											</View>
										))}
									</View>

									<TextInput 
										value={friendSearchQuery} 
										onChangeText={setFriendSearchQuery} 
										placeholder="Search for a friend..." 
										placeholderTextColor={COLORS.textMuted}
										autoCapitalize="none" 
										style={styles.modalInput} 
									/>
									
									{filteredFriends.map((friend: any) => {
										const friendUser = friend.sender?.username === myUsername ? friend.receiver : friend.sender;
										
										if (invitedUsers.some(u => u.id === friendUser.id)) return null; 
										if (newCollaborators.some(f => f.id === friendUser.id)) return null;

										return (
											<TouchableOpacity 
												key={friendUser.id} 
												onPress={() => { 
													setNewCollaborators(prev => [...prev, { id: friendUser.id, username: friendUser.username }]);
													setFriendSearchQuery(""); 
												}} 
												style={styles.friendSelectBtn}
											>
												<Text style={styles.friendSelectBtnText}>{friendUser.username}</Text>
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
									setEditAddressQuery("");
								}}>
									<Text style={styles.cancelButtonText}> Cancel </Text>
								</TouchableOpacity>

								<TouchableOpacity style={styles.saveButton} onPress={handleSaveSettings}>
									<Text style={styles.saveButtonText}> Save </Text>
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
	container: {
		flex: 1,
		paddingHorizontal: 24,
	},
	header: {
		height: 65,
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "space-between",
	},
	iconButton: {
		width: 36,
		height: 36,
		justifyContent: "center",
		alignItems: "center",
	},
	headerTitleContainer: {
		flex: 1,
		alignItems: "center",
	},
	headerTitle: {
		fontFamily: FONTS.bold,
		fontSize: 18,
		color: COLORS.textPrimary,
	},
	headerSubtitle: {
		fontFamily: FONTS.regular,
		fontSize: 12,
		color: COLORS.textMuted,
		marginTop: 2,
	},
	headerRightActions: {
		flexDirection: "row",
		alignItems: "center",
	},
	actionBar: {
		flexDirection: "row",
		justifyContent: "center",
		marginVertical: 10,
	},
	playNextBtn: {
		flexDirection: "row",
		alignItems: "center",
		backgroundColor: COLORS.primary,
		paddingHorizontal: 20,
		paddingVertical: 12,
		borderRadius: 25,
		gap: 8,
	},
	playNextText: {
		fontFamily: FONTS.semiBold,
		color: "white",
		fontSize: 16,
	},
	searchContainer: {
		flexDirection: "row",
		alignItems: "center",
		backgroundColor: "#F5F5F5",
		borderRadius: 16,
		paddingHorizontal: 16,
		height: 50,
		borderWidth: 1,
		borderColor: "#EAEAEA",
		marginBottom: 16,
	},
	searchInput: {
		flex: 1,
		marginLeft: 10,
		fontFamily: FONTS.regular,
		fontSize: 15,
		color: COLORS.textPrimary,
	},
	scrollContent: {
		paddingBottom: 100,
	},
	list: {
		gap: 12,
	},
	sectionTitle: {
		fontFamily: FONTS.semiBold,
		fontSize: 16,
		color: COLORS.textPrimary,
		marginBottom: 8,
	},
	trackCard: {
		flexDirection: "row",
		alignItems: "center",
		backgroundColor: "white",
		padding: 10,
		borderRadius: 12,
		elevation: 1,
	},
	rankText: {
		fontFamily: FONTS.bold,
		color: COLORS.textMuted,
		marginRight: 10,
		fontSize: 14,
	},
	trackImage: {
		width: 50,
		height: 50,
		borderRadius: 8,
	},
	trackInfo: {
		flex: 1,
		marginLeft: 12,
	},
	trackTitle: {
		fontFamily: FONTS.semiBold,
		fontSize: 14,
		color: COLORS.textPrimary,
		marginBottom: 2,
	},
	trackArtist: {
		fontFamily: FONTS.regular,
		fontSize: 12,
		color: COLORS.textMuted,
	},
	voteBtn: {
		flexDirection: "row",
		alignItems: "center",
		backgroundColor: COLORS.primary,
		paddingHorizontal: 12,
		paddingVertical: 8,
		borderRadius: 16,
		gap: 6,
	},
	voteText: {
		fontFamily: FONTS.bold,
		color: "white",
		fontSize: 14,
	},
	moreOptionsBtn: {
		padding: 8,
		marginLeft: 4,
	},
	addBtn: {
		width: 36,
		height: 36,
		borderRadius: 18,
		backgroundColor: "#E7A500",
		justifyContent: "center",
		alignItems: "center",
	},
	emptyText: {
		fontFamily: FONTS.regular,
		color: COLORS.textMuted,
		textAlign: "center",
		marginTop: 20,
	},
	modalOverlay: {
		flex: 1,
		justifyContent: "center",
		alignItems: "center",
		backgroundColor: "rgba(0,0,0,0.4)",
		padding: 24,
	},
	modalContent: {
		backgroundColor: COLORS.background,
		borderRadius: 20,
		padding: 20,
		maxHeight: "85%",
		width: "100%",
	},
	compactModalContent: {
		backgroundColor: COLORS.background,
		borderRadius: 16,
		padding: 20,
		width: "100%",
		maxWidth: 320,
	},
	modalTitle: {
		fontFamily: FONTS.semiBold,
		fontSize: 17,
		color: COLORS.textPrimary,
		marginBottom: 8,
	},
	modalText: {
		fontFamily: FONTS.regular,
		fontSize: 14,
		color: COLORS.textDescription,
		marginBottom: 20,
		lineHeight: 20,
	},
	modalInput: {
		height: 48,
		borderRadius: 12,
		backgroundColor: "#F5F5F5",
		paddingHorizontal: 16,
		color: COLORS.textPrimary,
		fontFamily: FONTS.regular,
		marginBottom: 16,
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
	friendsSection: {
		marginTop: 20,
	},
	friendsSectionTitle: {
		fontFamily: FONTS.medium,
		fontSize: 14,
		color: COLORS.textPrimary,
		marginBottom: 12,
	},
	friendsContainer: {
		flexDirection: 'row',
		flexWrap: 'wrap',
		gap: 8,
		marginBottom: 12,
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
	modalButtons: {
		flexDirection: "row",
		gap: 10,
		marginTop: 24,
	},
	cancelButton: {
		flex: 1,
		height: 40,
		borderRadius: 20,
		justifyContent: "center",
		alignItems: "center",
		backgroundColor: "#EAEAEA",
	},
	saveButton: {
		flex: 1,
		height: 40,
		borderRadius: 20,
		justifyContent: "center",
		alignItems: "center",
		backgroundColor: COLORS.primary,
	},
	deleteButton: {
		flex: 1,
		height: 40,
		borderRadius: 20,
		justifyContent: "center",
		alignItems: "center",
		backgroundColor: "red",
	},
	cancelButtonText: {
		fontFamily: FONTS.semiBold,
		fontSize: 13,
		color: COLORS.textPrimary,
	},
	saveButtonText: {
		fontFamily: FONTS.semiBold,
		fontSize: 13,
		color: COLORS.white,
	},
});