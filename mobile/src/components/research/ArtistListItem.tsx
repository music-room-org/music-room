import React from "react";
import { View, Text, Image, TouchableOpacity, StyleSheet } from "react-native";
import { ChevronRight, Music2 } from "lucide-react-native";
import { COLORS, FONTS } from "@/constants";

export interface ArtistItem {
	id: string;
	name: string;
	channelTitle: string;
	thumbnail: string;
	description?: string;
}

interface ArtistListItemProps {
	artist: ArtistItem;
	onPress?: () => void;
}

export function ArtistListItem({ artist, onPress }: ArtistListItemProps) {
	return (
		<TouchableOpacity style={styles.container} onPress={onPress} activeOpacity={0.7}>
			{artist.thumbnail ? (
				<Image source={{ uri: artist.thumbnail }} style={styles.avatar} />
			) : (
				<View style={[styles.avatar, styles.fallbackAvatar]}>
					<Music2 size={24} color={COLORS.primary} />
				</View>
			)}
			<View style={styles.textContainer}>
				<Text style={styles.name} numberOfLines={1}>
					{artist.name}
				</Text>
				<Text style={styles.channelTitle} numberOfLines={1}>
					{artist.channelTitle || `${artist.name} - Topic`}
				</Text>
			</View>
			<View style={styles.badge}>
				<Text style={styles.badgeText}>Topic</Text>
			</View>
			<ChevronRight size={20} color={COLORS.textMuted} />
		</TouchableOpacity>
	);
}

const styles = StyleSheet.create({
	container: {
		flexDirection: "row",
		alignItems: "center",
		paddingVertical: 12,
		paddingHorizontal: 4,
		marginBottom: 8,
	},
	avatar: {
		width: 56,
		height: 56,
		borderRadius: 28,
		backgroundColor: COLORS.secondary,
	},
	fallbackAvatar: {
		justifyContent: "center",
		alignItems: "center",
	},
	textContainer: {
		flex: 1,
		marginLeft: 14,
		justifyContent: "center",
	},
	name: {
		fontFamily: FONTS.semiBold,
		fontSize: 16,
		color: COLORS.textPrimary,
		marginBottom: 3,
	},
	channelTitle: {
		fontFamily: FONTS.regular,
		fontSize: 13,
		color: COLORS.textMuted,
	},
	badge: {
		backgroundColor: COLORS.secondary,
		paddingHorizontal: 8,
		paddingVertical: 3,
		borderRadius: 12,
		marginRight: 8,
	},
	badgeText: {
		fontFamily: FONTS.medium,
		fontSize: 11,
		color: COLORS.primary,
	},
});
