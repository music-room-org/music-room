import { View, ScrollView, Text, TouchableOpacity, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Search, PlusCircle } from "lucide-react-native";
import { COLORS, FONTS } from "@/constants";
import { LibraryPlaylistItem } from "@/components";

export default function Library() {
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
							<TouchableOpacity style={styles.actionIcon}>
								<PlusCircle size={26} color={COLORS.textMuted}/>
							</TouchableOpacity>
						</View>
					</View>
					<View style={styles.yellowLine}></View>
				</View>
				<View style={styles.listContainer}>
					<LibraryPlaylistItem 
						title="this is a title"
						author="me"
						imageUrl="https://m.media-amazon.com/images/I/91nZ-EThngL._SL1500_.jpg"
					/>

					<LibraryPlaylistItem 
						title="this is a title"
						author="me"
						imageUrl="https://m.media-amazon.com/images/I/91nZ-EThngL._SL1500_.jpg"
					/>

					<LibraryPlaylistItem 
						title="this is a title"
						author="me"
						imageUrl="https://m.media-amazon.com/images/I/91nZ-EThngL._SL1500_.jpg"
					/>

					<LibraryPlaylistItem 
						title="this is a title"
						author="me"
						imageUrl="https://m.media-amazon.com/images/I/91nZ-EThngL._SL1500_.jpg"
					/>

					<LibraryPlaylistItem 
						title="this is a title"
						author="me"
						imageUrl="https://m.media-amazon.com/images/I/91nZ-EThngL._SL1500_.jpg"
					/>

					<LibraryPlaylistItem 
						title="this is a title"
						author="me"
						imageUrl="https://m.media-amazon.com/images/I/91nZ-EThngL._SL1500_.jpg"
					/>
				</View>
			</ScrollView>
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