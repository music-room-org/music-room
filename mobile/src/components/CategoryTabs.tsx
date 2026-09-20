import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { COLORS, FONTS } from "@/constants";

interface CategoryTabsProps {
	activeTab: string;
	onTabChange: (tab: string) => void;
	tabs?: string[];
}

export function CategoryTabs({ activeTab, onTabChange, tabs = ['Artists', 'Titles', 'Playlists'] }: CategoryTabsProps) {
	return (
		<View style={styles.container}>
			{tabs.map((tab) => (
				<TouchableOpacity 
					key={tab} 
					onPress={() => onTabChange(tab)} 
					style={[styles.tab, tab === activeTab && styles.activeTab]}
				>
					<Text style={[styles.tabText, tab === activeTab && styles.activeTabText]}>
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
		justifyContent: 'center',
		gap: 24,
		marginTop: 24,
		marginBottom: 24,
	},
	tab: {
		paddingBottom: 8,
		borderBottomWidth: 2,
		borderBottomColor: 'transparent',
	},
	activeTab: {
		borderBottomColor: COLORS.primary,
	},
	tabText: {
		fontFamily: FONTS.regular,
		fontSize: 15,
		color: COLORS.tabInactive,
	},
	activeTabText: {
		fontFamily: FONTS.semiBold,
		color: COLORS.primary,
	},
});