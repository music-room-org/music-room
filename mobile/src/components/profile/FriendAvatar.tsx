import { View, Text, StyleSheet } from "react-native";
import { COLORS, FONTS } from "@/constants";
import { User } from "lucide-react-native";

interface FriendAvatarProps {
    name: string,
    bgColor: string,
    isMore?: boolean,
    moreCount?: string
}

export function FriendAvatar({ name, bgColor, isMore, moreCount }: FriendAvatarProps) {
    return (
        <View style={styles.container}>
            <View style={[styles.circle, { backgroundColor: bgColor }]}>
                {isMore ? <Text style={styles.moreText}>{moreCount}</Text> : <User color='#000' />}
                <Text style={styles.nameText}>{name}</Text>
            </View>
        </View>
    )
}

const styles = StyleSheet.create({
    container: {
        alignItems: 'center',
        marginRight: 16
    },
    circle: {
        width: 66,
        height: 66,
        borderRadius: 33,
        justifyContent: 'center',
        alignItems: 'center'
    },
    nameText: {
        fontFamily: FONTS.regular, 
        fontSize: 13,
        marginTop: 8
    },
    moreText: {
        fontFamily: FONTS.semiBold,
        fontSize: 16
    }
})