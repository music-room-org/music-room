import React from 'react';
import { View, Text, Image, StyleSheet } from "react-native";
import { Headphones } from 'lucide-react-native';
import { COLORS } from "@/constants/colors";
import { FONTS } from "@/constants/fonts";

interface CurrentlyPlayingProps {
  title: string;
  artist: string;
  friendName: string;
  imageUrl: string;
}

export function CurrentlyPlayingCard({ title, artist, friendName, imageUrl }: CurrentlyPlayingProps) {
    return (
        <View style={styles.card}>
            <Image 
                source={{ uri: imageUrl }} 
                style={styles.image} 
            />
            <View style={styles.textContainer}>
                <Text style={styles.title} numberOfLines={1}>{title}</Text>
                <Text style={styles.artist} numberOfLines={1}>{artist}</Text>
                <View style={styles.listeningContainer}>
                    <Headphones size={18} strokeWidth={3} color={COLORS.primary} style={styles.headphones} />
                    <Text style={styles.listeningText}>
                        <Text style={styles.friendName}> {friendName}</Text> is listening
                    </Text>
                </View>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    card: {
        flexDirection: 'row',
        backgroundColor: '#FFF9EF',
        borderRadius: 20,
        borderWidth: 1.5,
        borderColor: COLORS.primary,
        padding: 12,
        marginBottom: 16,
        alignItems: 'center',
    },
    image: {
        width: 64,
        height: 64,
        borderRadius: 8,
    },
    textContainer: {
        flex: 1,
        justifyContent: 'center',
        marginLeft: 16,
    },
    title: {
        fontFamily: FONTS.semiBold,
        fontSize: 16,
        color: COLORS.textPrimary,
        marginBottom: 2,
    },
    artist: {
        fontFamily: FONTS.regular,
        fontSize: 14,
        color: COLORS.textSecondary,
        marginBottom: 4,
    },
    listeningContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 2,
    },
    listeningText: {
        fontFamily: FONTS.regular,
        fontSize: 13,
        color: COLORS.textPrimary,
    },
    friendName: {
        fontFamily: FONTS.semiBold,
    },
	headphones: {
		marginRight: 6
	}
});