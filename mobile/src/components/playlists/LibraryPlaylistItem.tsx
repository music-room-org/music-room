import { View, Text, Image, TouchableOpacity, StyleSheet } from "react-native";
import { Play } from "lucide-react-native";
import { COLORS, FONTS } from "@/constants";

interface LibraryPlaylistItemProps {
	title: string,
	author: string,
	imageUrl: string
}

export function LibraryPlaylistItem({ title, author, imageUrl }: LibraryPlaylistItemProps) {
	return (
		<View style={styles.container}>
			<Image style={styles.image} src={imageUrl}></Image>
			<View style={styles.textContainer}>
				<Text style={styles.title}>{title}</Text>
				<Text style={styles.author}>{author}</Text>
			</View>
			<TouchableOpacity style={styles.playButton}>
				<Play color={COLORS.primary} fill={COLORS.primary} size={20} />
			</TouchableOpacity>

		</View>
	)
}

const styles = StyleSheet.create({
	container: {
		flexDirection: 'row',
		alignItems: 'center',
		marginBottom: 16
	},
	image: {
		width: 54,
		height: 54,
		justifyContent: 'center',
		borderRadius: 8,
		overflow: 'hidden'
	},
	textContainer: {
		flex: 1,
		marginLeft: 14,
		justifyContent: 'center'
	},
	title: {
		fontFamily: FONTS.semiBold,
		fontSize: 15,
		color: COLORS.textPrimary,
		marginBottom: 4
	},
	author: {
		fontFamily: FONTS.regular,
		fontSize: 13,
		color: COLORS.textPrimary
	},
	playButton: {
		width: 36,
		height: 36,
		borderRadius: 18,
		backgroundColor: COLORS.secondary,
		justifyContent: 'center',
		alignItems: 'center'
	}
})