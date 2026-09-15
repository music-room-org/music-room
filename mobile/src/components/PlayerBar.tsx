import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { Play, Pause, X } from 'lucide-react-native';
import { usePlayer } from '@/context/PlayerContext';
import { COLORS, FONTS } from '@/constants';
import { MusicPlayerModal } from './MusicPlayerModal';

export function PlayerBar() {
  const { currentTrack, isPlaying, isLoading, positionMillis, durationMillis, openModal, togglePlayPause, stopTrack } = usePlayer();

  if (!currentTrack) return null;

  const progressPercent = durationMillis > 0 ? (positionMillis / durationMillis) * 100 : 0;

  return (
    <>
      <TouchableOpacity style={styles.container} onPress={openModal} activeOpacity={0.9}>
        {/* Progress Bar Header */}
        <View style={styles.progressBarBackground}>
          <View style={[styles.progressBarFill, { width: `${Math.min(100, Math.max(0, progressPercent))}%` }]} />
        </View>

        <View style={styles.content}>
          <Image source={{ uri: currentTrack.thumbnail }} style={styles.thumbnail} />

          <View style={styles.infoContainer}>
            <Text style={styles.title} numberOfLines={1}>
              {currentTrack.title}
            </Text>
            <Text style={styles.artist} numberOfLines={1}>
              {currentTrack.artist}
            </Text>
          </View>

          <View style={styles.controls}>
            <TouchableOpacity onPress={togglePlayPause} style={styles.playButton} disabled={isLoading}>
              {isLoading ? (
                <ActivityIndicator size="small" color={COLORS.primary} />
              ) : isPlaying ? (
                <Pause color={COLORS.primary} fill={COLORS.primary} size={20} />
              ) : (
                <Play color={COLORS.primary} fill={COLORS.primary} size={20} />
              )}
            </TouchableOpacity>

            <TouchableOpacity onPress={stopTrack} style={styles.closeButton}>
              <X color={COLORS.textSecondary} size={18} />
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>

      <MusicPlayerModal />
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 12,
    marginBottom: 8,
    backgroundColor: COLORS.white,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#EFEFEF',
  },
  progressBarBackground: {
    height: 3,
    backgroundColor: '#E0E0E0',
    width: '100%',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: COLORS.primary,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  thumbnail: {
    width: 44,
    height: 44,
    borderRadius: 8,
  },
  infoContainer: {
    flex: 1,
    marginLeft: 12,
    marginRight: 8,
  },
  title: {
    fontFamily: FONTS.semiBold,
    fontSize: 14,
    color: COLORS.textPrimary,
  },
  artist: {
    fontFamily: FONTS.regular,
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  playButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: COLORS.secondary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  closeButton: {
    padding: 6,
  },
});
