import { View, Text, Image, TouchableOpacity, StyleSheet } from "react-native";
import { Play, Pause } from "lucide-react-native";
import { COLORS, FONTS } from "@/constants";

interface TrackListItemProps {
	title: string;
	subtitle: string;
	imageUrl: string;
	onPress?: () => void;
	isPlaying?: boolean;
	showPlayButton?: boolean;
}

export function TrackListItem({ title, subtitle, imageUrl, onPress, isPlaying, showPlayButton = true }: TrackListItemProps) {
	return (
		<TouchableOpacity style={styles.container} onPress={onPress} activeOpacity={0.7}>
			<Image source={{ uri: imageUrl }} style={styles.image} />
			<View style={styles.textContainer}>
				<Text style={styles.title} numberOfLines={1}>{title}</Text>
				<Text style={styles.subtitle} numberOfLines={1}>{subtitle}</Text>
			</View>
			{showPlayButton && (
				<TouchableOpacity style={styles.playButton} onPress={onPress}>
					{isPlaying ? (
						<Pause color={COLORS.primary} fill={COLORS.primary} size={18} />
					) : (
						<Play color={COLORS.primary} fill={COLORS.primary} size={18} />
					)}
				</TouchableOpacity>
			)}
		</TouchableOpacity>
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
		borderRadius: 8
	},
	textContainer: {
		flex: 1,
		marginLeft: 12,
		justifyContent: 'center'
	},
	title: {
		fontFamily: FONTS.semiBold,
		fontSize: 15,
		color: COLORS.textPrimary,
		marginBottom: 4
	},
	subtitle: {
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
	},
});