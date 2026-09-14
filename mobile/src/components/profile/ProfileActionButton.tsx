import { TouchableOpacity, Text, StyleSheet } from "react-native";
import { COLORS, FONTS } from "@/constants";

interface ProfileActionButtonProps {
	title: string,
	icon: React.ReactNode,
	isPrimary: boolean,
	onPress?: () => void
}

export function ProfileActionButton({ title, icon, isPrimary, onPress }: ProfileActionButtonProps) {
	return (
		<TouchableOpacity 
			style={[styles.button, isPrimary ? styles.primaryBg : styles.secondaryBg]}
			onPress={onPress}
		>
			{icon}
			<Text style={[styles.text, isPrimary ? styles.primaryText : styles.secondaryText]}>{title}</Text>
		</TouchableOpacity>
	)
}

const styles = StyleSheet.create({
	button: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'center',
		height: 50,
		borderRadius: 25,
		marginBottom: 12
	},
	primaryBg: {
		backgroundColor: COLORS.secondary
	},
	secondaryBg: {
		backgroundColor: COLORS.button_secondary
	},
	text: {
		fontFamily: FONTS.semiBold,
		fontSize: 15,
		marginLeft: 8
	},
	primaryText: {
		color: COLORS.primary
	},
	secondaryText: {
		color: COLORS.textPrimary
	}
})