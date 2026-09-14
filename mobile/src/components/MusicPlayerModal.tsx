import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  PanResponder,
  Dimensions,
} from 'react-native';
import {
  ChevronDown,
  Play,
  Pause,
  RotateCcw,
  RotateCw,
} from 'lucide-react-native';
import { usePlayer } from '@/context/PlayerContext';
import { COLORS, FONTS } from '@/constants';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const SLIDER_WIDTH = SCREEN_WIDTH - 64;

function formatTime(millis: number): string {
  if (!millis || isNaN(millis) || millis < 0) return '00:00';
  const totalSeconds = Math.floor(millis / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  const pad = (n: number) => (n < 10 ? `0${n}` : `${n}`);
  return `${pad(minutes)}:${pad(seconds)}`;
}

export function MusicPlayerModal() {
  const {
    currentTrack,
    isPlaying,
    isLoading,
    positionMillis,
    durationMillis,
    isModalOpen,
    closeModal,
    togglePlayPause,
    seekTo,
    seekBy,
  } = usePlayer();

  const [isSeeking, setIsSeeking] = useState(false);
  const [seekPositionMs, setSeekPositionMs] = useState(0);

  if (!currentTrack) return null;

  const effectiveDuration = durationMillis > 0 ? durationMillis : 180000;
  const currentPos = isSeeking ? seekPositionMs : positionMillis;
  const progressPercent = Math.min(100, Math.max(0, (currentPos / effectiveDuration) * 100));

  const handleSeekFromTouchX = (touchX: number) => {
    const clampedX = Math.max(0, Math.min(SLIDER_WIDTH, touchX));
    const ratio = clampedX / SLIDER_WIDTH;
    const targetMs = ratio * effectiveDuration;
    return targetMs;
  };

  const panResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: () => true,
    onPanResponderGrant: (evt) => {
      setIsSeeking(true);
      const targetMs = handleSeekFromTouchX(evt.nativeEvent.locationX);
      setSeekPositionMs(targetMs);
    },
    onPanResponderMove: (evt) => {
      const targetMs = handleSeekFromTouchX(evt.nativeEvent.locationX);
      setSeekPositionMs(targetMs);
    },
    onPanResponderRelease: async (evt) => {
      const targetMs = handleSeekFromTouchX(evt.nativeEvent.locationX);
      setIsSeeking(false);
      await seekTo(targetMs);
    },
  });

  return (
    <Modal
      visible={isModalOpen}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={closeModal}
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={closeModal} style={styles.headerButton}>
            <ChevronDown size={28} color={COLORS.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>NOW PLAYING</Text>
          <View style={styles.headerButtonPlaceholder} />
        </View>

        {/* Artwork Card */}
        <View style={styles.artworkContainer}>
          <Image source={{ uri: currentTrack.thumbnail }} style={styles.artworkImage} />
        </View>

        {/* Track Metadata */}
        <View style={styles.metaContainer}>
          <Text style={styles.title} numberOfLines={2}>
            {currentTrack.title}
          </Text>
          <Text style={styles.artist} numberOfLines={1}>
            {currentTrack.artist}
          </Text>
        </View>

        {/* Timeline Slider */}
        <View style={styles.timelineContainer}>
          <View style={styles.sliderTrackArea} {...panResponder.panHandlers}>
            <View style={styles.sliderTrackBackground}>
              <View style={[styles.sliderTrackFill, { width: `${progressPercent}%` }]} />
            </View>
            <View style={[styles.sliderKnob, { left: Math.max(0, (SLIDER_WIDTH * progressPercent) / 100 - 8) }]} />
          </View>

          <View style={styles.timeLabels}>
            <Text style={styles.timeText}>{formatTime(currentPos)}</Text>
            <Text style={styles.timeText}>{formatTime(effectiveDuration)}</Text>
          </View>
        </View>

        {/* Player Controls */}
        <View style={styles.controlsContainer}>
          <TouchableOpacity onPress={() => seekBy(-10000)} style={styles.seekButton} activeOpacity={0.7}>
            <RotateCcw size={24} color={COLORS.textPrimary} />
            <Text style={styles.seekButtonText}>-10s</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={togglePlayPause} style={styles.mainPlayButton} activeOpacity={0.8} disabled={isLoading}>
            {isLoading ? (
              <ActivityIndicator size="large" color={COLORS.white} />
            ) : isPlaying ? (
              <Pause size={32} color={COLORS.white} fill={COLORS.white} />
            ) : (
              <Play size={32} color={COLORS.white} fill={COLORS.white} style={styles.playIconOffset} />
            )}
          </TouchableOpacity>

          <TouchableOpacity onPress={() => seekBy(10000)} style={styles.seekButton} activeOpacity={0.7}>
            <RotateCw size={24} color={COLORS.textPrimary} />
            <Text style={styles.seekButtonText}>+10s</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    paddingHorizontal: 24,
    justifyContent: 'space-between',
    paddingBottom: 40,
    paddingTop: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerButton: {
    padding: 8,
  },
  headerTitle: {
    fontFamily: FONTS.semiBold,
    fontSize: 14,
    letterSpacing: 1.5,
    color: COLORS.textMuted,
  },
  headerButtonPlaceholder: {
    width: 44,
  },
  artworkContainer: {
    alignItems: 'center',
    marginVertical: 20,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 10,
  },
  artworkImage: {
    width: SCREEN_WIDTH - 80,
    height: SCREEN_WIDTH - 80,
    borderRadius: 24,
    borderWidth: 1.5,
    borderColor: COLORS.cardBorder,
  },
  metaContainer: {
    alignItems: 'center',
    marginHorizontal: 12,
  },
  title: {
    fontFamily: FONTS.bold,
    fontSize: 22,
    color: COLORS.textPrimary,
    textAlign: 'center',
    marginBottom: 6,
  },
  artist: {
    fontFamily: FONTS.medium,
    fontSize: 16,
    color: COLORS.primary,
    textAlign: 'center',
    marginBottom: 12,
  },
  timelineContainer: {
    marginVertical: 12,
  },
  sliderTrackArea: {
    height: 30,
    justifyContent: 'center',
    width: SLIDER_WIDTH,
    alignSelf: 'center',
  },
  sliderTrackBackground: {
    height: 6,
    backgroundColor: '#E0E0E0',
    borderRadius: 3,
    overflow: 'hidden',
  },
  sliderTrackFill: {
    height: '100%',
    backgroundColor: COLORS.primary,
    borderRadius: 3,
  },
  sliderKnob: {
    position: 'absolute',
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: COLORS.primary,
    borderWidth: 2,
    borderColor: COLORS.white,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 4,
  },
  timeLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
    paddingHorizontal: 4,
  },
  timeText: {
    fontFamily: FONTS.regular,
    fontSize: 13,
    color: COLORS.textMuted,
  },
  controlsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 10,
  },
  seekButton: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    marginHorizontal: 16,
  },
  seekButtonText: {
    fontFamily: FONTS.medium,
    fontSize: 11,
    color: COLORS.textMuted,
    marginTop: 4,
  },
  mainPlayButton: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 8,
  },
  playIconOffset: {
    marginLeft: 3,
  },
});
