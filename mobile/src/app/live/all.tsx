import { View, ScrollView, Text, TouchableOpacity, StyleSheet, Platform } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ChevronLeft } from "lucide-react-native";
import { COLORS, FONTS } from "@/constants";
import { useState, useCallback } from "react";
import { useFocusEffect, useRouter } from "expo-router";
import * as SecureStore from "expo-secure-store";

async function getToken() {
	if (Platform.OS === "web") return localStorage.getItem("userToken");
	return await SecureStore.getItemAsync("userToken");
}

export default function AllLiveEvents() {
	const router = useRouter();
	const apiUrl = Platform.OS === "android" ? "http://10.0.2.2:3000" : "http://localhost:3000";
	const [liveSessions, setLiveSessions] = useState<any[]>([]);

	const fetchLiveSessions = useCallback(async () => {
		try {
			const token = await getToken();
			if (!token) return;

			const response = await fetch(`${apiUrl}/live_session/available/all`, {
				method: 'GET',
				headers: { Authorization: `Bearer ${token}` },
			});
			if (response.ok) {
				const data = await response.json();
				setLiveSessions(data);
			}
		} catch (error) {
			console.error(error);
		}
	}, []);

	useFocusEffect(
		useCallback(() => {
			fetchLiveSessions();
		}, [fetchLiveSessions])
	);

	return (
		<SafeAreaView style={styles.safeArea}>
			<View style={styles.header}>
				<TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
					<ChevronLeft size={28} color={COLORS.textPrimary} />
				</TouchableOpacity>
				<Text style={styles.headerTitle}>All Active Events</Text>
				<View style={styles.placeholder} />
			</View>

			<ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
				{liveSessions.map((session) => (
					<TouchableOpacity
						key={session.id}
						style={styles.liveCard}
						onPress={() => router.push(`/live/${session.id}`)}
						activeOpacity={0.8}
					>
						<View style={styles.liveInfo}>
							<Text style={styles.liveTitle} numberOfLines={1}>{session.name}</Text>
							<Text style={styles.liveVisibility}>
								{session.isPublic ? "🌍 Public Event" : "🔒 Private Event"} • {session.license === 'OPEN' ? 'Open Voting' : 'Restricted Voting'}
							</Text>
						</View>
						<View style={styles.joinButton}>
							<Text style={styles.joinButtonText}>Join</Text>
						</View>
					</TouchableOpacity>
				))}
				
				{liveSessions.length === 0 && (
					<Text style={styles.emptyText}>No active events available right now.</Text>
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
	header: {
		height: 60,
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "space-between",
		paddingHorizontal: 24,
	},
	backButton: {
		width: 40,
		height: 40,
		justifyContent: "center",
		alignItems: "flex-start",
	},
	headerTitle: {
		fontFamily: FONTS.bold,
		fontSize: 20,
		color: COLORS.textPrimary,
	},
	placeholder: {
		width: 40,
	},
	scrollContent: {
		paddingHorizontal: 24,
		paddingBottom: 40,
		paddingTop: 16,
	},
	liveCard: {
		backgroundColor: COLORS.white,
		padding: 16,
		borderRadius: 16,
		marginBottom: 12,
		borderWidth: 1,
		borderColor: COLORS.cardBorder,
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
		shadowColor: '#000',
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.05,
		shadowRadius: 4,
		elevation: 2,
	},
	liveInfo: {
		flex: 1,
		marginRight: 12,
	},
	liveTitle: {
		fontFamily: FONTS.semiBold,
		fontSize: 18,
		color: COLORS.textPrimary,
		marginBottom: 4,
	},
	liveVisibility: {
		fontFamily: FONTS.regular,
		fontSize: 13,
		color: COLORS.textMuted,
	},
	joinButton: {
		backgroundColor: COLORS.primary,
		paddingHorizontal: 16,
		paddingVertical: 8,
		borderRadius: 20,
	},
	joinButtonText: {
		fontFamily: FONTS.semiBold,
		color: COLORS.white,
		fontSize: 14,
	},
	emptyText: {
		fontFamily: FONTS.regular,
		fontSize: 14,
		color: COLORS.textMuted,
		textAlign: "center",
		marginTop: 40,
	},
});