import { Tabs } from "expo-router";
import { Home, Search, Disc, User } from "lucide-react-native";
import { StyleSheet, View, TouchableOpacity } from "react-native";
import { BottomTabBarProps } from "expo-router/build/react-navigation/bottom-tabs";
import { COLORS } from "@/constants";
import { PlayerBar } from "@/components/PlayerBar";
import { useEffect, useState } from "react";
import * as SecureStore from "expo-secure-store";
import { io } from "socket.io-client";
import { Platform, Alert, DeviceEventEmitter } from "react-native";

const ICONS = {
	index: Home,
	research: Search,
	library: Disc,
	profile: User,
};

function CustomTabBar({ state, navigation, hasNotification }: BottomTabBarProps & { hasNotification: boolean }) {
	return (
		<View style={styles.tabBarContainer}>
			<View style={styles.tabBar}>
				{state.routes.map((route, index) => {
					const activeRouteName = state.routes[state.index].name;
					const focused = state.index === index || (route.name === 'library' && activeRouteName.startsWith('playlist'));
					const color = focused ? COLORS.primary : COLORS.tabInactive;

					const Icon = ICONS[route.name as keyof typeof ICONS];
					if (!Icon) return null;

					const onPress = () => {
						const event = navigation.emit({
							type: 'tabPress',
							target: route.key,
							canPreventDefault: true,
						});

						if (!focused && !event.defaultPrevented) {
							navigation.navigate(route.name);
						}
					};

					return (
						<TouchableOpacity
							key={route.key}
							onPress={onPress}
							style={styles.tabItem}
							activeOpacity={0.7}
						>
							<View style={[styles.iconContainer, focused && styles.activeIconContainer]}>
								<Icon color={color} size={26} />
								{route.name === 'profile' && hasNotification && (
									<View style={styles.notificationBadge} />
								)}
							</View>
						</TouchableOpacity>
					);
				})}
			</View>
		</View>
	);
}

async function getToken() {
	if (Platform.OS === "web") {
		return localStorage.getItem("userToken");
	}
	return await SecureStore.getItemAsync("userToken");
}

export default function TabsLayout() {
	const [hasNotification, setHasNotification] = useState(false);

	useEffect(() => {
		let socket: ReturnType<typeof io>;

		const connectSocket = async () => {
			const token = await getToken();
			if (!token) return;

			const apiUrl = Platform.OS === 'android' ? 'http://10.0.2.2:3000' : 'http://localhost:3000';

			// Vérification des requêtes d'amis
			const response = await fetch(`${apiUrl}/friends/pending`, {
				headers: { Authorization: `Bearer ${token}` },
			});
			if (response.ok) {
				const pendingRequests = await response.json();
				if (pendingRequests.length > 0) setHasNotification(true);
			}

			const collabResponse = await fetch(`${apiUrl}/playlists/collaborators/pending`, {
				headers: { Authorization: `Bearer ${token}` },
			});
			if (collabResponse.ok) {
				const pendingCollabs = await collabResponse.json();
				if (pendingCollabs.length > 0) setHasNotification(true);
			}

			socket = io(apiUrl, {
				extraHeaders: { Authorization: `Bearer ${token}` },
			});

			socket.on("newRequest", () => {
				setHasNotification(true);
				Alert.alert("New friend request!");
				DeviceEventEmitter.emit("refreshProfile");
			});

			socket.on("newCollabRequest", () => {
				setHasNotification(true);
				Alert.alert("New collaboration request!");
				DeviceEventEmitter.emit("refreshProfile");
			});

			socket.on("friendAccepted", () => {
				Alert.alert("Friend request accepted!");
			});
		};

		const subscription = DeviceEventEmitter.addListener(
			"clearNotification",
			() => { setHasNotification(false); }
		);

		connectSocket();

		return () => {
			socket?.disconnect();
			subscription.remove();
		};
	}, []);

	return (
		<Tabs tabBar={(props) => <CustomTabBar {...props} hasNotification={hasNotification} />} screenOptions={{ headerShown: false }}>
			<Tabs.Screen name='index' />
			<Tabs.Screen name='research' />
			<Tabs.Screen name='library' />
			<Tabs.Screen name='profile' />
		</Tabs>
	);
}

const styles = StyleSheet.create({
	tabBarContainer: {
		position: 'absolute',
		bottom: 0,
		left: 0,
		right: 0,
	},
	tabBar: {
		flexDirection: 'row',
		alignItems: 'center',
		marginHorizontal: 10,
		backgroundColor: COLORS.white,
		borderRadius: 40,
		height: 70,
		borderWidth: 1,
		borderColor: COLORS.cardBorder,
		elevation: 5,
		shadowOpacity: 0.05,
		marginBottom: 20,
	},
	tabItem: {
		flex: 1,
		height: '100%',
		justifyContent: 'center',
		alignItems: 'center',
	},
	notificationBadge: {
		position: 'absolute',
		top: 8,
		right: 8,
		width: 12,
		height: 12,
		borderRadius: 6,
		backgroundColor: 'red'
	},
	iconContainer: {
		width: 50,
		height: 50,
		borderRadius: 25,
		justifyContent: 'center',
		alignItems: 'center'
	},
	activeIconContainer: {
		backgroundColor: COLORS.secondary
	}
});