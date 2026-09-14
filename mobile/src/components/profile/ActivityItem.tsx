import { View, Text, Image, StyleSheet } from "react-native";
import { COLORS, FONTS } from "@/constants";

interface ActivityItemProps {
    title: string,
    description: string,
    time: string,
    imageUrl: string
}

export function ActivityItem({ title, description, time, imageUrl }: ActivityItemProps) {
    return (
        <View style={styles.container}>
            <Image style={styles.image} source={{ uri: imageUrl }} />
            <View style={styles.textContainer}>
                <Text style={styles.title}>{title}</Text>
                <Text style={styles.desc}>{description}</Text>
                <Text style={styles.time}>{time}</Text>
            </View>
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
        borderRadius: 8
    },
    textContainer: {
        flex: 1,
        marginLeft: 12
    },
    title: {
        fontFamily: FONTS.semiBold,
        fontSize: 15
    },
    desc: {
        fontFamily: FONTS.regular,
        fontSize: 14
    },
    time: {
        fontFamily: FONTS.regular,
        fontSize: 12,
        color: COLORS.textMuted
    }
})