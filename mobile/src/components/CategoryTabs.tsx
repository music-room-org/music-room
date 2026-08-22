import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { COLORS, FONTS } from "@/constants";

interface CategoryTabsProps {
	activeTab: string,
	onTabChange: (tab: string) => void;
}

export function CategoryTabs({ activeTab, onTabChange }: CategoryTabsProps) {
	const tabs = ['All', 'Titles', 'Artists', 'Playlists'];

	return (
		<View style={styles.container}>
			{tabs.map((tab) => (
				<TouchableOpacity
					key={tab}
					onPress={() => onTabChange(tab)}
					style={[styles.tab, tab === activeTab && styles.activeTab]}
				>
					<Text
						style={[
							styles.tabText,
							tab === activeTab && styles.activeTabText
						]}
					>
						{tab}
					</Text>
				</TouchableOpacity>
			))}
		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		marginTop: 24,
		marginBottom: 24
	},
	tab: {
		paddingBottom: 8,
		borderBottomWidth: 2,
		borderBottomColor: 'transparent'
	},
	activeTab: {
		borderBottomColor: COLORS.primary
	},
	tabText: {
		fontFamily: FONTS.regular,
		fontSize: 16,
		color: COLORS.tabInactive
	},
	activeTabText: {
		fontFamily: FONTS.semiBold,
		color: COLORS.primary
	}
});