import { Tabs } from "expo-router";
import { Home, Search, Disc, User } from "lucide-react-native";
import { StyleSheet, View, TouchableOpacity } from "react-native";
import { BottomTabBarProps } from "expo-router/build/react-navigation/bottom-tabs";
import { COLORS } from "@/constants";

const ICONS = {
	index: Home,
	research: Search,
	library: Disc,
	profile: User,
};

function CustomTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
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
						</View>
					</TouchableOpacity>
				);
			})}
		</View>
	);
}

export default function TabsLayout() {
	return (
		<Tabs
			tabBar={(props) => <CustomTabBar {...props} />}
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