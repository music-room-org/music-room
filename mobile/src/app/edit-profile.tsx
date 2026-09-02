import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Image, Platform } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ChevronLeft, Camera, ChevronRight, Lock } from "lucide-react-native";
import { useRouter } from "expo-router";
import { COLORS, FONTS } from "@/constants";
import { CustomInput, PrimaryButton, ChangePasswordModal } from "@/components";
import * as SecureStore from 'expo-secure-store';
import { useState, useEffect } from "react";
import * as ImagePicker from "expo-image-picker";


export default function EditProfile() {
	const router = useRouter();

	const [email, setEmail] = useState("");
	const [isModalVisible, setModalVisible] = useState(false);
	const [username, setUsername] = useState("");
	const [profileImage, setProfileImage] = useState("");

	const apiUrl = Platform.OS === "android" ? "http://10.0.2.2:3000" : "http://localhost:3000";
	
	useEffect(() => {
		const fetchProfile = async () => {
			try {
				const token = await SecureStore.getItemAsync('userToken');
				const response = await fetch(
					`${apiUrl}/auth/profil`,
					{
						method: 'GET',
						headers: {
							Authorization: `Bearer ${token}`,
						},
					}
				);

				const data = await response.json();
				setUsername(data.username);
				setEmail(data.email);
				setProfileImage(data.profileImage)
			} catch (error) {
				console.error(error);
			}
		};

		fetchProfile();
	}, []);
	
	const handleSaveProfile = async () => {
		try {
			const token = await SecureStore.getItemAsync("userToken");

			const response = await fetch(`${apiUrl}/profile`, {
			method: "PATCH",
			headers: {
				"Content-Type": "application/json",
				Authorization: `Bearer ${token}`,
			},
			body: JSON.stringify({
				username,
				email,
				profileImage,
			}),
			});

			const data = await response.json();

			console.log("PATCH PROFILE:", response.status, data);

			if (!response.ok) {
			throw new Error(data.message || "Profile update failed");
			}

			alert("Profile updated!");
			router.back();
		} catch (error) {
			console.error("ERROR UPDATE PROFILE:", error);
			alert("Failed to update profile");
		}
	};

	const handleSavePassword = async (currentPass: string, newPass: string) => {
		const token = await SecureStore.getItemAsync("userToken");
		await fetch(`${apiUrl}/profile`, {
			method: "PATCH",
			headers: {
				"Content-Type": "application/json",
				Authorization: `Bearer ${token}`,
			},
			body: JSON.stringify({
				currentPassword: currentPass,
				newPassword: newPass,
			}),
		});
		setModalVisible(false);
	};

	const pickImage = async () => {
		const result = await ImagePicker.launchImageLibraryAsync({
			allowsEditing: true,
			aspect: [1, 1],
			quality: 1,
			base64: true,
		});

		if (!result.canceled) {
			setProfileImage(
				`data:image/jpeg;base64,${result.assets[0].base64}`
			);
		}
	}

	return (
		<SafeAreaView style={styles.safeArea}>
			<ScrollView showsVerticalScrollIndicator={false}>
				<View style={styles.header}>
					<TouchableOpacity onPress={() => router.back()}>
						<ChevronLeft color="black" size={28} />
					</TouchableOpacity>
				</View>

				<TouchableOpacity onPress={() => pickImage()}>
					<View style={styles.avatarContainer}>
						<View style={styles.avatarCircle}>
							{profileImage && (
								<Image
									source={{ uri: profileImage }}
									style={{
										width: "100%",
										height: "100%",
										borderRadius: 999,
									}}
								/>
							)}

							<View style={styles.cameraBadge}>
								<Camera color={COLORS.primary} size={16} />
							</View>
						</View>
					</View>
				</TouchableOpacity>

				<View style={styles.formSection}>
					<View style={styles.fieldContainer}>
						<Text style={styles.label}>Username</Text>

						<CustomInput
							placeholder="Faustoche"
							value={username}
							onChangeText={setUsername}
							autoCapitalize="none"
						/>
					</View>

					<View style={styles.fieldContainer}>
						<Text style={styles.label}>Email</Text>

						<CustomInput
							placeholder="faustoche@gmail.com"
							value={email}
							onChangeText={setEmail}
							autoCapitalize="none"
						/>
					</View>

					<View style={styles.fieldContainer}>
						<Text style={styles.label}>Password</Text>

						<TouchableOpacity
							style={styles.passwordTrigger}
							onPress={() => setModalVisible(true)}
						>
							<Lock size={20} color={COLORS.textPrimary} />

							<Text style={styles.passwordTriggerText}>
								Change my password
							</Text>

							<ChevronRight
								size={20}
								color={COLORS.textPrimary}
							/>
						</TouchableOpacity>
					</View>

					<ChangePasswordModal
						visible={isModalVisible}
						onClose={() => setModalVisible(false)}
						onSubmit={handleSavePassword}
					/>

					<View style={styles.saveButtonContainer}>
						<PrimaryButton
							title="Save modifications"
							onPress={handleSaveProfile}
							buttonStyle={{ backgroundColor: "#FDF0DF" }}
							textStyle={{ color: COLORS.primary }}
						/>
					</View>
				</View>
			</ScrollView>
		</SafeAreaView>
	);
}

const styles = StyleSheet.create({
	safeArea: {
		flex: 1,
		backgroundColor: COLORS.background,
	},

	header: {
		paddingHorizontal: 24,
		paddingTop: 20,
		flexDirection: "row",
	},

	avatarContainer: {
		alignSelf: "center",
		alignItems: "center",
		marginTop: 16,
		marginBottom: 40,
	},

	avatarCircle: {
		width: 90,
		height: 90,
		borderRadius: 45,
		backgroundColor: COLORS.secondary,
	},

	cameraBadge: {
		position: "absolute",
		bottom: 0,
		right: -5,
		backgroundColor: COLORS.white,
		borderRadius: 12,
		padding: 4,
		borderWidth: 1,
		borderColor: COLORS.cardBorder,
	},

	changePhotoText: {
		marginTop: 12,
		fontFamily: FONTS.semiBold,
		fontSize: 13,
		textDecorationLine: "underline",
	},

	formSection: {
		paddingHorizontal: 24,
	},

	fieldContainer: {
		marginBottom: 20,
	},

	label: {
		fontFamily: FONTS.semiBold,
		fontSize: 14,
		marginBottom: 8,
		color: COLORS.textPrimary,
	},

	saveButtonContainer: {
		marginTop: 20,
	},

	illustration: {
		alignSelf: "center",
		marginTop: 40,
		width: 150,
		height: 150,
		resizeMode: "contain",
	},

	passwordTrigger: {
		flexDirection: "row",
		alignItems: "center",
		backgroundColor: COLORS.white,
		borderWidth: 1,
		borderColor: COLORS.inputBorder,
		borderRadius: 30,
		height: 56,
		paddingHorizontal: 16,
	},

	passwordTriggerText: {
		flex: 1,
		fontFamily: FONTS.semiBold,
		fontSize: 15,
		color: COLORS.textPrimary,
		marginLeft: 12,
	},
});