import { Text, View, StyleSheet } from "react-native";
import { COLORS, FONTS } from "@/constants";

interface ProfileStatProps {
    value: string,
    label: string
}

export function ProfileStat({ value, label }: ProfileStatProps) {
    return (
        <View style={styles.container}>
            <Text style={styles.valueText}>{value}</Text>
            <Text style={styles.labelText}>{label}</Text>
        </View>
    )
}

const styles = StyleSheet.create({
    container: {
        alignItems: 'center'
    },
    valueText: {
        fontFamily: FONTS.semiBold,
        fontSize: 18,
        color: COLORS.textPrimary
    },
    labelText: {
        fontFamily: FONTS.regular,
        fontSize: 14,
        color: COLORS.textPrimary
    }
})