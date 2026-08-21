import React from 'react';
import { View, Image, StyleSheet } from "react-native";

interface PlaylistProps {
  imageUrl: string;
}

export function PlaylistCard({ imageUrl }: PlaylistProps) {
    return (
        <View style={styles.container}>
            <Image 
                source={{ uri: imageUrl }} 
                style={styles.image} 
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        width: '48%',
        aspectRatio: 1,
        borderRadius: 20,
        overflow: 'hidden',
        marginBottom: 16,
    },
    image: {
        width: '100%',
        height: '100%',
    }
});