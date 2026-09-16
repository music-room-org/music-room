import { View, Text, TextInput, ScrollView, StyleSheet, Image, Platform, Modal, TouchableOpacity, DeviceEventEmitter } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ChevronLeft, Check, X, Pencil, UserPlus, ChevronRight, LogOut, Bell } from "lucide-react-native";
import { useRouter, useFocusEffect } from "expo-router";
import { COLORS, FONTS } from "@/constants";
import { ProfileStat, ProfileActionButton, ActivityItem, FriendAvatar } from "@/components";
import { useState, useCallback } from "react";
import * as SecureStore from "expo-secure-store";

export default function Profile() {
	const router = useRouter();
	const [username, setUsername] = useState("");
	const [profileImage, setProfileImage] = useState("");
	const [friendRequests, setFriendRequests] = useState<any[]>([]);
	const [isModalVisible, setIsModalVisible] = useState(false);
	const [friendsList, setFriendsList] = useState<any[]>([]);
	const [isAddFriendModalVisible, setIsAddFriendModalVisible] = useState(false);
	const [userSearchQuery, setUserSearchQuery] = useState("");
	const [userSearchResults, setUserSearchResults] = useState<any[]>([]);
	const [sentRequests, setSentRequests] = useState<any[]>([]);
	const [collabRequests, setCollabRequests] = useState<any[]>([]);

	const apiUrl = Platform.OS === "android" ? "http://10.0.2.2:3000" : "http://localhost:3000";

	useFocusEffect(
		useCallback(() => {
			const fetchProfile = async () => {
				try {
					const token = Platform.OS === "web" ? localStorage.getItem("userToken") : await SecureStore.getItemAsync("userToken");
					if (!token) {
						router.replace('/login');
						return;
					}

					const response = await fetch(`${apiUrl}/auth/profil`, {
						method: "GET",
						headers: { Authorization: `Bearer ${token}` },
					});
					const data = await response.json();
					setUsername(data.username);
					setProfileImage(data.profileImage);

					const requestsResponse = await fetch(`${apiUrl}/friends/pending`, {
						method: "GET",
						headers: { Authorization: `Bearer ${token}` },
					});
					if (requestsResponse.ok) {
						setFriendRequests(await requestsResponse.json());
					}

					const friendsResponse = await fetch(`${apiUrl}/friends/list`, {
						method: 'GET',
						headers: { Authorization: `Bearer ${token}` },
					});
					if (friendsResponse.ok) {
						setFriendsList(await friendsResponse.json());
					}

					const collabResponse = await fetch(`${apiUrl}/playlists/collaborators/pending`, {
						method: "GET",
						headers: { Authorization: `Bearer ${token}` }
					});
					if (collabResponse.ok) {
						setCollabRequests(await collabResponse.json());
					}
				} catch (error) {
					console.error(error);
				}
			};

			fetchProfile();

			const sub = DeviceEventEmitter.addListener("refreshProfile", () => {
				fetchProfile();
			});

			return () => {
				sub.remove();
			};
		}, [])
	);

	async function handleLogout() {
		if (Platform.OS === "web") {
			localStorage.removeItem("userToken");
		} else {
			await SecureStore.deleteItemAsync("userToken");
		}
		router.replace("/login");
	}

	const handleRequest = async (requestId: string, status: "ACCEPTED" | "REJECTED") => {
		const token = Platform.OS === "web" ? localStorage.getItem("userToken") : await SecureStore.getItemAsync("userToken");
		if (!token) return;

		await fetch(`${apiUrl}/friends/manage`, {
			method: "PATCH",
			headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
			body: JSON.stringify({ friendshipId: requestId, status }),
		});

		setFriendRequests((prev) => {
			const updatedRequests = prev.filter((request) => request.id !== requestId);
			if (updatedRequests.length === 0 && collabRequests.length === 0) {
				DeviceEventEmitter.emit("clearNotification");
			}
			return updatedRequests;
		});
	};

	const handleCollabRequest = async (collabId: string, status: "ACCEPTED" | "REJECTED") => {
		const token = Platform.OS === "web" ? localStorage.getItem("userToken") : await SecureStore.getItemAsync("userToken");
		if (!token) return;

		await fetch(`${apiUrl}/playlists/collaborators/${collabId}`, {
			method: "PATCH",
			headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
			body: JSON.stringify({ status }),
		});

		setCollabRequests((prev) => {
			const updatedCollabs = prev.filter((req) => req.id !== collabId);
			if (updatedCollabs.length === 0 && friendRequests.length === 0) {
				DeviceEventEmitter.emit("clearNotification");
			}
			return updatedCollabs;
		});
	};

	const handleUserSearch = async (query: string) => {
		setUserSearchQuery(query);
		if (!query.trim()) {
			setUserSearchResults([]);
			return;
		}
		const token = Platform.OS === "web" ? localStorage.getItem("userToken") : await SecureStore.getItemAsync("userToken");
		if (!token) return;

		try {
			const response = await fetch(`${apiUrl}/friends/search?q=${encodeURIComponent(query)}`, {
				method: "GET",
				headers: { Authorization: `Bearer ${token}` },
			});
			if (response.ok) {
				setUserSearchResults(await response.json());
			}
		} catch (error) {
			console.error(error);
		}
	};

	const sendFriendRequest = async (targetId: string) => {
		const token = Platform.OS === "web" ? localStorage.getItem("userToken") : await SecureStore.getItemAsync("userToken");
		if (!token) return;

		try {
			const response = await fetch(`${apiUrl}/friends/request`, {
				method: "POST",
				headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
				body: JSON.stringify({ receiverId: targetId }),
			});
			if (response.ok) {
				setSentRequests((prev) => [...prev, targetId]);
			}
		} catch (error) {
			console.error(error);
		}
	};

	return (
		<SafeAreaView style={styles.safeArea}>
			<ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
				<View style={styles.header}>
					<View style={styles.headerTopRow}>
						<ChevronLeft color={COLORS.textPrimary} />
						<TouchableOpacity onPress={() => setIsModalVisible(true)} style={styles.bellContainer}>
							<Bell size={24} color={COLORS.textPrimary} />
							{(friendRequests.length > 0 || collabRequests.length > 0) && (
								<View style={styles.notificationDot}></View>
							)}
						</TouchableOpacity>
					</View>

					<View style={styles.avatarWrapper}>
						{profileImage ? (
							<Image source={{ uri: profileImage }} style={styles.avatar} />
						) : (
							<View style={styles.avatar} />
						)}
					</View>
					<Text style={styles.handleText}>@{username}</Text>

					<View style={styles.statsRow}>
						<ProfileStat value="46" label="playlists" />
						<ProfileStat value="348" label="liked titles" />
						<ProfileStat value={friendsList.length.toString()} label="friends" />
					</View>

					<View style={styles.buttonsContainer}>
						<ProfileActionButton title="Modify my profile" isPrimary={true} icon={<Pencil color={COLORS.primary} />} onPress={() => router.push("/edit-profile")} />
						<ProfileActionButton title="Add a friend" isPrimary={false} icon={<UserPlus color="black" />} onPress={() => setIsAddFriendModalVisible(true)} />
						<ProfileActionButton title="Log out" isPrimary={false} icon={<LogOut color='black' />} onPress={() => handleLogout()} />
					</View>

					<View style={styles.divider}></View>

					<View style={styles.sectionHeader}>
						<Text style={styles.sectionTitle}>Recent activity</Text>
						<ChevronRight color={COLORS.textPrimary} />
					</View>

					<View style={styles.activityContainer}>
						<ActivityItem title="Roadtrip" description="blablabla" time="August 2026" imageUrl="https://m.media-amazon.com/images/I/91nZ-EThngL._SL1500_.jpg" />
						<ActivityItem title="Tanti auguri" description="blablabla" time="August 2026" imageUrl="https://m.media-amazon.com/images/I/91nZ-EThngL._SL1500_.jpg" />
						<ActivityItem title="Roadtrip" description="blablabla" time="August 2026" imageUrl="https://m.media-amazon.com/images/I/91nZ-EThngL._SL1500_.jpg" />
					</View>

					<View style={styles.divider}></View>

					<View style={styles.sectionHeader}>
						<Text style={styles.sectionTitle}>Friends</Text>
						<ChevronRight color={COLORS.textPrimary} />
					</View>
				</View>

				<ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.friendsScroll}>
					{friendsList.map((friend) => {
						const friendUser = friend.sender?.username === username ? friend.receiver : friend.sender;
						return (
							<FriendAvatar key={friend.id} name={friendUser?.username} profileImage={friendUser?.profileImage} bgColor="#E5F2EE" />
						);
					})}
				</ScrollView>
			</ScrollView>

			<Modal visible={isModalVisible} animationType="slide" transparent={true}>
				<View style={styles.modalOverlay}>
					<View style={styles.modalContainer}>
						<TouchableOpacity onPress={() => setIsModalVisible(false)} style={styles.closeModalBtn}>
							<X size={24} color="black"/>
						</TouchableOpacity>

						{friendRequests.length > 0 && (
							<>
								<View style={styles.sectionHeaderModal}>
									<Text style={styles.sectionTitle}> Friends request </Text>
								</View>
								<View style={styles.activityContainerModal}>
									{friendRequests.map((request: any) => (
										<View key={request.id}>
											<ActivityItem title={request.sender?.username} description="Friend request" time="" imageUrl={request.sender?.profileImage} />
											<View style={styles.requestActions}>
												<TouchableOpacity onPress={() => handleRequest(request.id, "ACCEPTED")}>
													<Check size={24} color="green"/>
												</TouchableOpacity>
												<TouchableOpacity onPress={() => handleRequest(request.id, "REJECTED")}>
													<X size={24} color="red"/>
												</TouchableOpacity>
											</View>
										</View>
									))}
								</View>
								<View style={styles.dividerModal}></View>
							</>
						)}

						{collabRequests.length > 0 && (
							<>
								<View style={styles.sectionHeaderModal}>
									<Text style={styles.sectionTitle}>Collaboration requests</Text>
								</View>
								<View style={styles.activityContainerModal}>
									{collabRequests.map((req: any) => (
										<View key={req.id}>
											<ActivityItem 
												title={req.playlist?.name} 
												description={`Invited by ${req.playlist?.owner?.username}`} 
												time="" 
												imageUrl={req.playlist?.imageUrl || "https://blog.landr.com/wp-content/uploads/2017/07/how-to-get-on-a-playlist-feature.png"} 
											/>
											<View style={styles.requestActions}>
												<TouchableOpacity onPress={() => handleCollabRequest(req.id, "ACCEPTED")}>
													<Check size={24} color="green" />
												</TouchableOpacity>
												<TouchableOpacity onPress={() => handleCollabRequest(req.id, "REJECTED")}>
													<X size={24} color="red" />
												</TouchableOpacity>
											</View>
										</View>
									))}
								</View>
								<View style={styles.dividerModal}></View>
							</>
						)}
					</View>
				</View>
			</Modal>

			<Modal visible={isAddFriendModalVisible} animationType="slide" transparent={true}>
				<View style={styles.modalOverlay}>
					<View style={styles.modalContainer}>
						<TouchableOpacity onPress={() => setIsAddFriendModalVisible(false)} style={styles.closeModalBtn}>
							<X size={24} color="black" />
						</TouchableOpacity>

						<TextInput
							value={userSearchQuery}
							onChangeText={handleUserSearch}
							placeholder="Search a friend..."
							autoCapitalize="none"
							style={styles.searchInput}
						/>

						{userSearchResults.map((user: any) => (
							<View key={user.id} style={styles.searchResultItem}>
								<View style={styles.searchResultInfo}>
									<Image source={{ uri: user.profileImage }} style={styles.searchResultImage} />
									<Text>{user.username}</Text>
								</View>
								<TouchableOpacity onPress={() => sendFriendRequest(user.id)}>
									{sentRequests.includes(user.id) ? (
										<Check size={22} color="green" />
									) : (
										<UserPlus size={22} color="black" />
									)}
								</TouchableOpacity>
							</View>
						))}
					</View>
				</View>
			</Modal>
		</SafeAreaView>
	);
}

const styles = StyleSheet.create({
	safeArea: {
		flex: 1,
		backgroundColor: "#ffffff",
	},
	scrollView: {
		flex: 1,
	},
	scrollContent: {
		paddingBottom: 170,
		paddingTop: 20,
	},
	header: {
		paddingHorizontal: 24,
		marginBottom: 16,
	},
	headerTopRow: {
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "center",
		marginBottom: 20,
	},
	bellContainer: {
		position: "relative",
	},
	notificationDot: {
		position: "absolute",
		top: 0,
		right: 0,
		width: 10,
		height: 10,
		borderRadius: 5,
		backgroundColor: "red",
	},
	avatarWrapper: {
		alignSelf: "center",
		marginBottom: 16,
		alignItems: "center",
	},
	avatar: {
		width: 100,
		height: 100,
		borderRadius: 50,
		backgroundColor: "#E0E0E0",
	},
	nameTitle: {
		fontFamily: FONTS.semiBold,
		fontSize: 20,
		textAlign: "center",
	},
	handleText: {
		fontFamily: FONTS.regular,
		fontSize: 13,
		color: COLORS.textMuted,
		textAlign: "center",
	},
	statsRow: {
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "center",
		marginVertical: 24,
		paddingHorizontal: 24,
	},
	buttonsContainer: {
		paddingHorizontal: 24,
	},
	sectionHeader: {
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "center",
		paddingHorizontal: 24,
		marginBottom: 16,
	},
	sectionTitle: {
		fontFamily: FONTS.semiBold,
		fontSize: 18,
	},
	activityContainer: {
		paddingHorizontal: 24,
	},
	friendsScroll: {
		paddingHorizontal: 24,
		marginLeft: 25,
		flexGrow: 1,
		justifyContent: 'flex-start',
	},
	divider: {
		height: 1,
		backgroundColor: COLORS.cardBorder,
		marginHorizontal: 24,
		marginVertical: 12,
	},
	modalOverlay: {
		flex: 1,
		backgroundColor: "rgba(0,0,0,0.5)",
		justifyContent: "center",
		padding: 20,
	},
	modalContainer: {
		backgroundColor: "white",
		borderRadius: 20,
		padding: 20,
		maxHeight: "80%",
	},
	closeModalBtn: {
		marginBottom: 20,
	},
	sectionHeaderModal: {
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "center",
		marginBottom: 16,
	},
	activityContainerModal: {
		paddingHorizontal: 0,
	},
	requestActions: {
		flexDirection: "row",
		gap: 16,
		marginBottom: 20,
	},
	dividerModal: {
		height: 1,
		backgroundColor: COLORS.cardBorder,
		marginVertical: 12,
	},
	searchInput: {
		borderWidth: 1,
		borderColor: "#ddd",
		borderRadius: 10,
		padding: 12,
		marginBottom: 20,
	},
	searchResultItem: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "space-between",
		marginBottom: 16,
	},
	searchResultInfo: {
		flexDirection: "row",
		alignItems: "center",
		gap: 12,
	},
	searchResultImage: {
		width: 40,
		height: 40,
		borderRadius: 20,
	}
});