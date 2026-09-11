import { View, ScrollView, Text, TouchableOpacity, StyleSheet, Platform, Modal, TextInput } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Search, PlusCircle } from "lucide-react-native";
import { COLORS, FONTS } from "@/constants";
import { LibraryPlaylistItem } from "@/components";
import { useState, useCallback } from "react";
import { useFocusEffect } from "expo-router";
import * as SecureStore from "expo-secure-store";

export default function Library() {
	
	const apiUrl = Platform.OS === "android" ? "http://10.0.2.2:3000" : "http://localhost:3000";
	const [isCreateModalVisible, setIsCreateModalVisible] = useState(false);
	const [newPlaylistName, setNewPlaylistName] = useState("");
	const [myPlaylists, setMyPlaylists] = useState([]);

	const handleCreatePlaylist = async () => {
		try {
			const token = await SecureStore.getItemAsync("userToken");

			if (!token)
				return;

			await fetch(`${apiUrl}/playlists`, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					Authorization: `Bearer ${token}`,
				},
				body: JSON.stringify({
					name: newPlaylistName,
				}),
			});

			setIsCreateModalVisible(false);
			setNewPlaylistName("");
		} catch (error) {
			console.error(error);
		}
	};

	useFocusEffect(
		useCallback(() => {
			const fetchPlaylists = async () => {
				try {
					const token = await SecureStore.getItemAsync("userToken");

					if (!token)
						return;

					const response = await fetch(`${apiUrl}/playlists/mine`, {
						method: "GET",
						headers: {
							Authorization: `Bearer ${token}`,
						},
					});

					const data = await response.json();
					setMyPlaylists(data);
				} catch (error) {
					console.error(error);
				}
			};

			fetchPlaylists();
		}, [])
	);


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
							<TouchableOpacity style={styles.actionIcon} onPress={() => setIsCreateModalVisible(true)}>
								<PlusCircle size={26} color={COLORS.textMuted}/>
							</TouchableOpacity>
						</View>
					</View>
					<View style={styles.yellowLine}></View>
				</View>
				<View style={styles.listContainer}>
					{myPlaylists.map((playlist: any) => (
						<LibraryPlaylistItem
							key={playlist.id}
							title={playlist.name}
							author="me"
							imageUrl="https://m.media-amazon.com/images/I/91nZ-EThngL._SL1500_.jpg"
						/>
					))}
				</View>
			</ScrollView>
			<Modal
				visible={isCreateModalVisible}
				transparent={true}
				animationType="fade"
			>
				<View
					style={{
						flex: 1,
						backgroundColor: "rgba(0,0,0,0.5)",
						justifyContent: "center",
						alignItems: "center",
					}}
				>
					<View
						style={{
							width: "80%",
							backgroundColor: "white",
							borderRadius: 12,
							padding: 20,
						}}
					>
						<TextInput
							value={newPlaylistName}
							onChangeText={setNewPlaylistName}
							placeholder="Playlist name"
							style={{
								borderWidth: 1,
								borderColor: "#ddd",
								borderRadius: 8,
								padding: 12,
								marginBottom: 16,
							}}
						/>

						<View
							style={{
								flexDirection: "row",
								justifyContent: "flex-end",
							}}
						>
							<TouchableOpacity
								onPress={() => setIsCreateModalVisible(false)}
								style={{ marginRight: 16 }}
							>
								<Text>Cancel</Text>
							</TouchableOpacity>

							<TouchableOpacity onPress={handleCreatePlaylist}>
								<Text>Create</Text>
							</TouchableOpacity>
						</View>
					</View>
				</View>
			</Modal>
		</SafeAreaView>
	)
}

const styles = StyleSheet.create({
	safeArea: {
		flex: 1,
		backgroundColor: COLORS.background,
	},
	scrollContent: {
		paddingHorizontal: 24,
		paddingTop: 20,
		paddingBottom: 100
	},
	headerContainer: {
		marginBottom: 24
	},
	headerTopRow: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
		width: '100%'
	},
	headerTitle: {
		fontFamily: FONTS.semiBold,
		fontSize: 28,
		color: COLORS.textPrimary
	},
	headerActions: {
		flexDirection: 'row',
		alignItems: 'center'
	},
	actionIcon: {
		marginLeft: 16
	},
	yellowLine: {
		height: 4,
		backgroundColor: COLORS.primary,
		width: '100%',
		borderRadius: 2,
		marginTop: 16
	},
	listContainer: {
		marginTop: 8
	}
})