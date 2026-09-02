import { View, Text, ScrollView, StyleSheet, Image, Platform } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ChevronLeft, Camera, Pencil, UserPlus, ChevronRight } from "lucide-react-native";
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
		const apiUrl = Platform.OS === "android" ? "http://10.0.2.2:3000" : "http://localhost:3000";
		
		useFocusEffect(
			useCallback(() => {
				const fetchProfile = async () => {
				try {
					const token = await SecureStore.getItemAsync("userToken");

					const response = await fetch(`${apiUrl}/auth/profil`, {
					method: "GET",
					headers: {
						Authorization: `Bearer ${token}`,
					},
					});

					const data = await response.json();

					setUsername(data.username);
					setProfileImage(data.profileImage);
				} catch (error) {
					console.error(error);
				}
				};

				fetchProfile();
			}, [])
		);

	return (
		<SafeAreaView style={styles.safeArea}>
			<ScrollView style={styles.scrollContent}>
				<View style={styles.header}>
					<ChevronLeft />

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
							title="Add new friends"
							isPrimary={false}
							icon={<UserPlus color='black' />}
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