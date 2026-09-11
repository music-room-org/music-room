import { View, TextInput, StyleSheet } from "react-native";
import { Search } from "lucide-react-native";
import { COLORS } from "@/constants";
import { FONTS } from "@/constants";

interface SearchBarProps {
	value: string;
	onChangeText: (text: string) => void;
}

export function SearchBar({ value, onChangeText }: SearchBarProps) {
	return (
		<View style={styles.container}>
			<Search size={22} color={COLORS.inputIcon} />
			<TextInput
				style={styles.input}
				placeholder="Search for a title, an artist, or a playlist"
				placeholderTextColor={COLORS.placeholder}
				value={value}
				onChangeText={onChangeText}
			/>
		</View>
	)
}

const styles = StyleSheet.create({
	container: {
		flexDirection: 'row',
		alignItems: 'center',
		backgroundColor: COLORS.white,
		borderRadius: 30,
		paddingHorizontal: 16,
		height: 56,
		borderWidth: 1,
		borderColor: COLORS.inputBackground
	},
	input: {
		flex: 1,
		marginLeft: 12,
		fontFamily: FONTS.regular,
		fontSize: 16,
		color: COLORS.inputText
	}
})