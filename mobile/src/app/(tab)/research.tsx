import { View, ScrollView, Text, StyleSheet, Platform } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useEffect, useState } from "react";
import * as SecureStore from "expo-secure-store";

import { COLORS, FONTS } from "@/constants";
import { SearchBar, PrimaryButton } from "@/components";

export default function Research() {
	const [activeTab, setActiveTab] = useState('Titles');
	const [searchQuery, setSearchQuery] = useState('');
	const [searchResults, setSearchResults] = useState<any[]>([]);
	const [pendingRequests, setPendingRequests] = useState<string[]>([]);

	const sendRequest = async (targetId: string) => {
		const token = await SecureStore.getItemAsync("userToken");

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

			const token = await SecureStore.getItemAsync("userToken");

			if (!token) return;

			const apiUrl =
				Platform.OS === "android"
					? "http://10.0.2.2:3000"
					: "http://localhost:3000";

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
				style={styles.scrollContent}
				showsVerticalScrollIndicator={false}
			>
				<SearchBar
					value={searchQuery}
					onChangeText={setSearchQuery}
				/>

				<View style={styles.sectionContainer}>
					{searchResults.map((user: any) => (
						<View
							key={user.id}
							style={styles.userCard}
						>
							<Text style={styles.username}>
								{user.username}
							</Text>

							<PrimaryButton
								title={ pendingRequests.includes(user.id) ? "En attente" : "Ajouter" }
								buttonStyle={ pendingRequests.includes(user.id) ? { backgroundColor: COLORS.button_secondary } : undefined }
								disabled={pendingRequests.includes(user.id)}
								onPress={() => sendRequest(user.id)}
							/>
						</View>
					))}
				</View>
			</ScrollView>
		</SafeAreaView>
	);
}

const styles = StyleSheet.create({
	safeArea: {
		flex: 1,
		backgroundColor: COLORS.background
	},

	scrollContent: {
		paddingHorizontal: 24,
		paddingTop: 20,
		paddingBottom: 100
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
	}
});