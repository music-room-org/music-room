import { Tabs } from "expo-router";
import { Home, Search, Disc, User } from "lucide-react-native";
import { StyleSheet, View, TouchableOpacity } from "react-native";
import { BottomTabBarProps } from "expo-router/build/react-navigation/bottom-tabs";
import { COLORS } from "@/constants";
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

function CustomTabBar({ state, descriptors, navigation, hasNotification }: BottomTabBarProps & { hasNotification: boolean }) {
	return (
		<View style={styles.tabBar}>
			{state.routes.map((route, index) => {
				const focused = state.index === index;
				const color = focused ? COLORS.primary : COLORS.tabInactive;
				const Icon = ICONS[route.name as keyof typeof ICONS];

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
	);
}

export default function TabsLayout() {

	const [hasNotification, setHasNotification] = useState(false);

	useEffect(() => {
		let socket: ReturnType<typeof io>;

		const connectSocket = async () => {
			const token = await SecureStore.getItemAsync("userToken");

			if (!token)
				return;

			const apiUrl = Platform.OS === 'android' ? 'http://10.0.2.2:3000' : 'http://localhost:3000';

			const response = await fetch(`${apiUrl}/friends/pending`, {
				headers: {
					Authorization: `Bearer ${token}`,
				},
			});

			if (response.ok) {
				const pendingRequests = await response.json();
				if (pendingRequests.length > 0)
					setHasNotification(true);
			}

			socket = io(apiUrl, {
				extraHeaders: {
					Authorization: `Bearer ${token}`,
				},
			});

			socket.on("newRequest", () => {
				setHasNotification(true);
				Alert.alert("New friend request!");
			});
			socket.on("friendAccepted", () => {
				Alert.alert("Friend request accepted!");
			});
		};

		const subscription = DeviceEventEmitter.addListener(
			"clearNotification", () => {setHasNotification(false);}
		);

		connectSocket();
		return () => {
			socket?.disconnect();
		};
	}, []);

	return (
		<Tabs
			tabBar={(props) => <CustomTabBar {...props} hasNotification={hasNotification} />}
			screenOptions={{
				headerShown: false,
			}}
		>
			<Tabs.Screen name='index' />
			<Tabs.Screen name='research' />
			<Tabs.Screen name='library' />
			<Tabs.Screen name='profile' />
		</Tabs>
	)
}

const styles = StyleSheet.create({
	tabBar: {
		flexDirection: 'row',
		alignItems: 'center',
		marginHorizontal: 10,
		backgroundColor: COLORS.white,
		borderRadius: 40,
		height: 70,
		borderWidth: 1,
		borderColor: COLORS.cardBorder,
		elevation: 5, // android
		shadowOpacity: 0.05, // ios
		position: 'absolute',
		bottom: 20,
		left: 0,
		right: 0,
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