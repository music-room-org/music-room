import { View, Text, ScrollView, StyleSheet, Image, Platform, Modal, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ChevronLeft, Camera, Pencil, UserPlus, ChevronRight, LogOut, Bell } from "lucide-react-native";
import { useRouter } from "expo-router";
import { COLORS, FONTS } from "@/constants";
import { ProfileStat, ProfileActionButton, ActivityItem, FriendAvatar } from "@/components";
import { useState, useCallback } from "react";
import { useFocusEffect } from "expo-router";
import * as SecureStore from "expo-secure-store";

export default function Profile() {

	const router = useRouter();
		const [username, setUsername] = useState("");
		const [profileImage, setProfileImage] = useState("");
		const [friendRequests, setFriendRequests] = useState<any[]>([]);
		const [isModalVisible, setIsModalVisible] = useState(false);

		const apiUrl = Platform.OS === "android" ? "http://10.0.2.2:3000" : "http://localhost:3000";
		
		useFocusEffect(
			useCallback(() => {
				const fetchProfile = async () => {
					try {
						const token =
							Platform.OS === "web"
								? localStorage.getItem("userToken")
								: await SecureStore.getItemAsync("userToken");

						if (!token) {
							router.replace('/login');
							return;
						}

						const response = await fetch(`${apiUrl}/auth/profil`, {
							method: "GET",
							headers: {
								Authorization: `Bearer ${token}`,
							},
						});

						const data = await response.json();

						setUsername(data.username);
						setProfileImage(data.profileImage);

						const requestsResponse = await fetch(
							`${apiUrl}/friends/pending`,
							{
								method: "GET",
								headers: {
									Authorization: `Bearer ${token}`,
								},
							}
						);

						const requestsData = await requestsResponse.json();

						setFriendRequests(requestsData);
					} catch (error) {
						console.error(error);
					}
				};

				fetchProfile();
			}, [])
		);

	// async function handleLogout() {
	// 	await SecureStore.deleteItemAsync('userToken');
	// 	router.replace('/login');
	// }

	async function handleLogout() {
		if (Platform.OS === "web") {
			localStorage.removeItem("userToken");
		} else {
			await SecureStore.deleteItemAsync("userToken");
		}

		router.replace("/login");
	}

	const handleRequest = async (
		requestId: string,
		status: "ACCEPTED" | "REJECTED"
	) => {
		const token =
			Platform.OS === "web"
				? localStorage.getItem("userToken")
				: await SecureStore.getItemAsync("userToken");

		if (!token) return;

		await fetch(`${apiUrl}/friends/manage`, {
			method: "PATCH",
			headers: {
				"Content-Type": "application/json",
				Authorization: `Bearer ${token}`,
			},
			body: JSON.stringify({
				friendshipId: requestId,
				status,
			}),
		});

		setFriendRequests((prev) =>
			prev.filter((request) => request.id !== requestId)
		);
	};

	return (
		<SafeAreaView style={styles.safeArea}>
			<ScrollView style={styles.scrollContent}>
				<View style={styles.header}>
					<View
						style={{
							flexDirection: "row",
							justifyContent: "space-between",
							alignItems: "center",
							marginBottom: 20,
						}}
					>
						<ChevronLeft />

						<TouchableOpacity
							onPress={() => setIsModalVisible(true)}
							style={{ position: "relative" }}
						>
							<Bell size={24} />

							{friendRequests.length > 0 && (
								<View
									style={{
										position: "absolute",
										top: 0,
										right: 0,
										width: 10,
										height: 10,
										borderRadius: 5,
										backgroundColor: "red",
									}}
								/>
							)}
						</TouchableOpacity>
					</View>

					

					<View style={styles.avatarWrapper}>
						{profileImage ? (
							<Image
							source={{ uri: profileImage }}
							style={styles.avatar}
							/>
						) : (
							<View style={styles.avatar} />
						)}
						</View>

					<Text style={styles.handleText}>@{username}</Text>

					<View style={styles.statsRow}>
						<ProfileStat value="46" label="playlists" />
						<ProfileStat value="348" label="liked titles" />
						<ProfileStat value="24" label="friends" />
					</View>

					<View style={styles.buttonsContainer}>
						<ProfileActionButton
							title="Modify my profile"
							isPrimary={true}
							icon={<Pencil color={COLORS.primary} />}
							onPress={() => router.push("/edit-profile")}
						/>
						<ProfileActionButton
							title="Log out"
							isPrimary={false}
							icon={<LogOut color='black' />}
							onPress={() => handleLogout()}
						/>
					</View>

					<View style={styles.divider}></View>

					<View style={styles.sectionHeader}>
						<Text style={styles.sectionTitle}>Recent activity</Text>
						<ChevronRight />
					</View>

					<View style={styles.activityContainer}>
						<ActivityItem
							title="Roadtrip"
							description="blablabla"
							time="August 2026"
							imageUrl="https://m.media-amazon.com/images/I/91nZ-EThngL._SL1500_.jpg"
						/>
						<ActivityItem
							title="Tanti auguri"
							description="blablabla"
							time="August 2026"
							imageUrl="https://m.media-amazon.com/images/I/91nZ-EThngL._SL1500_.jpg"
						/>
						<ActivityItem
							title="Roadtrip"
							description="blablabla"
							time="August 2026"
							imageUrl="https://m.media-amazon.com/images/I/91nZ-EThngL._SL1500_.jpg"
						/>
					</View>

					<View style={styles.divider}></View>
					<View style={styles.sectionHeader}>
						<Text style={styles.sectionTitle}>Friends</Text>
						<ChevronRight />
					</View>
				</View>

				<ScrollView
					horizontal
					showsHorizontalScrollIndicator={false}
					contentContainerStyle={styles.friendsScroll}
				>
					<FriendAvatar
						name="Joëlle"
						bgColor="#E5F2EE"
					/>
					<FriendAvatar
						name="Antonin"
						bgColor="#EBE6F3"
					/>
					<FriendAvatar
						name="Octave"
						bgColor="#FBECEE"
					/>
					<FriendAvatar
						isMore={true}
						name=""
						moreCount="+21"
						bgColor="#FDF0DF"
					/>
				</ScrollView>
			</ScrollView>


			<Modal
				visible={isModalVisible}
				animationType="slide"
				transparent={true}
			>
				<View
					style={{
						flex: 1,
						backgroundColor: "rgba(0,0,0,0.5)",
						justifyContent: "center",
						padding: 20,
					}}
				>
					<View
						style={{
							backgroundColor: "white",
							borderRadius: 20,
							padding: 20,
							maxHeight: "80%",
						}}
					>
						<TouchableOpacity
							onPress={() => setIsModalVisible(false)}
							style={{ marginBottom: 20 }}
						>
							<Text>Close</Text>
						</TouchableOpacity>

						<View style={styles.sectionHeader}>
							<Text style={styles.sectionTitle}>
								Friends request
							</Text>
							<ChevronRight />
						</View>

						<View style={styles.activityContainer}>
							{friendRequests.map((request: any) => (
								<View key={request.id}>
									<ActivityItem
										title={request.sender.username}
										description="Friend request"
										time=""
										imageUrl={request.sender.profileImage}
									/>

									<View
										style={{
											flexDirection: "row",
											gap: 16,
											marginBottom: 20,
										}}
									>
										<TouchableOpacity
											onPress={() =>
												handleRequest(
													request.id,
													"ACCEPTED"
												)
											}
										>
											<Text style={{ color: "green" }}>
												Accept
											</Text>
										</TouchableOpacity>

										<TouchableOpacity
											onPress={() =>
												handleRequest(
													request.id,
													"REJECTED"
												)
											}
										>
											<Text style={{ color: "red" }}>
												Refuse
											</Text>
										</TouchableOpacity>
									</View>
								</View>
							))}
						</View>

						<View style={styles.divider}></View>
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

	scrollContent: {
		paddingBottom: 100,
		paddingTop: 20,
	},

	header: {
		paddingHorizontal: 24,
		marginBottom: 16,
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

	cameraBadge: {
		position: "absolute",
		bottom: 0,
		right: 0,
		backgroundColor: COLORS.white,
		borderRadius: 12,
		padding: 4,
		borderWidth: 1,
		borderColor: COLORS.cardBorder,
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
		justifyContent: 'space-between'
	},
	divider: {
		height: 1,
		backgroundColor: COLORS.cardBorder,
		marginHorizontal: 24,
		marginVertical: 12
	}
});