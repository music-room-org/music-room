import React, { createContext, useContext, useState, useEffect, useRef, useCallback, ReactNode } from 'react';
import { API_BASE_URL } from '@/constants/api';

export interface Track {
	id: string;
	title: string;
	artist: string;
	thumbnail: string;
	description?: string;
}

interface PlayerContextType {
	currentTrack: Track | null;
	isPlaying: boolean;
	isLoading: boolean;
	positionMillis: number;
	durationMillis: number;
	isModalOpen: boolean;
	openModal: () => void;
	closeModal: () => void;
	playTrack: (track: Track) => Promise<void>;
	togglePlayPause: () => Promise<void>;
	seekTo: (positionMs: number) => Promise<void>;
	seekBy: (offsetMs: number) => Promise<void>;
	stopTrack: () => Promise<void>;
	playQueue: (tracks: Track[], startIndex: number) => Promise<void>; // file d'attente pour les playlists
	playNextTrack: () => Promise<void>;
	playPreviousTrack: () => Promise<void>;
}

const PlayerContext = createContext<PlayerContextType | undefined>(undefined);

// Safely import createAudioPlayer from expo-audio (Expo SDK 57 modern audio library)
let createAudioPlayer: any = null;
try {
	createAudioPlayer = require('expo-audio').createAudioPlayer;
} catch {
	// Ignored - fallback to HTML5 Web Audio if native module is absent
}

export function PlayerProvider({ children }: { children: ReactNode }) {
	const nativePlayerRef = useRef<any>(null);
	const webSoundRef = useRef<HTMLAudioElement | null>(null);
	const currentTrackRef = useRef<Track | null>(null);
	const isTransitioningRef = useRef(false);

	const [currentTrack, setCurrentTrack] = useState<Track | null>(null);
	const [isPlaying, setIsPlaying] = useState(false);
	const [isLoading, setIsLoading] = useState(false);
	const [positionMillis, setPositionMillis] = useState(0);
	const [durationMillis, setDurationMillis] = useState(0);
	const [isModalOpen, setIsModalOpen] = useState(false);

	// Pour la file d'attente
	const queueRef = useRef<Track[]>([]);
	const currentIndexRef = useRef(0);

	const cleanBackendAudio = useCallback((id: string) => {
		if (!id) return;
		fetch(`${API_BASE_URL}/player/clean/${id}`, { method: 'DELETE' }).catch(() => {});
	}, []);

	const stopTrack = useCallback(async () => {
		if (nativePlayerRef.current) {
			try {
				nativePlayerRef.current.pause();
				nativePlayerRef.current.remove?.();
			} catch {}
			nativePlayerRef.current = null;
		}
		if (webSoundRef.current) {
			webSoundRef.current.pause();
			webSoundRef.current = null;
		}

		if (currentTrackRef.current?.id) {
			cleanBackendAudio(currentTrackRef.current.id);
			currentTrackRef.current = null;
		}

		setCurrentTrack(null);
		setIsPlaying(false);
		setPositionMillis(0);
		setDurationMillis(0);
		setIsModalOpen(false);
	}, [cleanBackendAudio]);

	// Cleanup on unmount only
	useEffect(() => {
		return () => {
			if (nativePlayerRef.current) {
				try {
					nativePlayerRef.current.pause();
					nativePlayerRef.current.remove?.();
				} catch {}
			}
			if (webSoundRef.current) {
				webSoundRef.current.pause();
			}
			if (currentTrackRef.current?.id) {
				cleanBackendAudio(currentTrackRef.current.id);
			}
		};
	}, [cleanBackendAudio]);

	// Continuous position & duration updater while playing
	useEffect(() => {
		let interval: ReturnType<typeof setInterval> | null = null;
		if (isPlaying) {
			interval = setInterval(() => {
				const nativePlayer = nativePlayerRef.current;
				const webSound = webSoundRef.current;

				if (nativePlayer) {
					if (typeof nativePlayer.currentTime === 'number' && !isNaN(nativePlayer.currentTime)) {
						setPositionMillis(nativePlayer.currentTime * 1000);
					}
					if (typeof nativePlayer.duration === 'number' && !isNaN(nativePlayer.duration) && nativePlayer.duration > 0) {
						setDurationMillis(nativePlayer.duration * 1000);
					}
				} else if (webSound) {
					if (typeof webSound.currentTime === 'number' && !isNaN(webSound.currentTime)) {
						setPositionMillis(webSound.currentTime * 1000);
					}
					if (typeof webSound.duration === 'number' && !isNaN(webSound.duration) && webSound.duration > 0) {
						setDurationMillis(webSound.duration * 1000);
					}
				}
			}, 300);
		}
		return () => {
			if (interval) clearInterval(interval);
		};
	}, [isPlaying]);

	const openModal = () => setIsModalOpen(true);
	const closeModal = () => setIsModalOpen(false);

	const playNextTrack = async () => {
		if (currentIndexRef.current + 1 < queueRef.current.length) {
			currentIndexRef.current += 1;
			const nextTrack = queueRef.current[currentIndexRef.current];
			await playTrack(nextTrack, true);
		}
	};

	const playPreviousTrack = async () => {
		if (currentIndexRef.current > 0) {
			currentIndexRef.current -= 1;
			const previousTrack = queueRef.current[currentIndexRef.current];
			await playTrack(previousTrack, true);
		}
	};

	const playQueue = async (tracks: Track[], startIndex: number) => {
		queueRef.current = tracks;
		currentIndexRef.current = startIndex;
		await playTrack(tracks[startIndex], true);
	};

	const playTrack = async (track: Track, fromQueue = false) => {
		// Prévention immédiate des ID invalides bloquant l'API sur le Web
		if (!track || !track.id) {
			console.error("Erreur: ID de piste manquant ou invalide.");
			setIsLoading(false);
			return;
		}

		try {
			isTransitioningRef.current = false;
			
			if (!fromQueue) {
				queueRef.current = [];
			}
			
			setIsLoading(true);

			const previousTrackId = currentTrackRef.current?.id;
			currentTrackRef.current = track;
			setCurrentTrack(track);
			setPositionMillis(0);
			setDurationMillis(0);

			// Clean up previous track on backend if switching
			if (previousTrackId && previousTrackId !== track.id) {
				cleanBackendAudio(previousTrackId);
			}

			// Stop existing playback
			if (nativePlayerRef.current) {
				try {
					nativePlayerRef.current.pause();
					nativePlayerRef.current.remove?.();
				} catch {}
				nativePlayerRef.current = null;
			}
			if (webSoundRef.current) {
				webSoundRef.current.pause();
				webSoundRef.current = null;
			}

			const streamUrl = `${API_BASE_URL}/player/stream/${track.id}`;

			// Try Expo SDK 57 expo-audio native player
			if (createAudioPlayer) {
				try {
					const player = createAudioPlayer(streamUrl);
					player.addListener('playbackStatusUpdate', (status: any) => {
						if (status) {
							if (currentTrackRef.current?.id !== track.id) {
								// race condition 
								return; 
							}
							const playing = status.status === 'playing' || status.playing;
							setIsPlaying(playing);
							setIsLoading(status.status === 'loading' || status.isBuffering);
							
							if (typeof status.currentTime === 'number') setPositionMillis(status.currentTime * 1000);
							if (typeof status.duration === 'number' && status.duration > 0) setDurationMillis(status.duration * 1000);

							// If playback finished (duration > 0 and near end)
							if (
								status.didJustFinish || 
								(status.duration > 2 && typeof status.currentTime === 'number' && status.currentTime >= status.duration - 0.5)
							) {
								if (isTransitioningRef.current) return;
								isTransitioningRef.current = true;
								
								// Verification de si c'est une playlist ou pas
								if (queueRef.current.length > 0 && currentIndexRef.current + 1 < queueRef.current.length) {
									playNextTrack();
								} else {
									setIsPlaying(false);
									cleanBackendAudio(track.id);
								}
							}
						}
					});

					player.play();
					nativePlayerRef.current = player;
					setIsPlaying(true);
					setIsLoading(false);
					return;
				} catch (expoErr) {
					console.warn('Expo Native expo-audio failed, attempting Web Audio fallback:', expoErr);
				}
			}

			// Web Audio API Fallback
			if (typeof window !== 'undefined' && (window as any).Audio) {
				const audio = new (window as any).Audio(streamUrl);
				
				audio.play().then(() => {
					setIsPlaying(true);
					setIsLoading(false);
				}).catch((err: any) => {
					console.error('Web Audio playback error:', err);
					setIsLoading(false);
					setIsPlaying(false);
				});

				audio.ontimeupdate = () => {
					setPositionMillis(audio.currentTime * 1000);
					if (audio.duration && !isNaN(audio.duration)) {
						setDurationMillis(audio.duration * 1000);
					}
				};

				audio.onended = () => {
					if (currentTrackRef.current?.id !== track.id) {
						// race condition 
						return; 
					}
					if (isTransitioningRef.current) return;
					isTransitioningRef.current = true;
					
					if (queueRef.current.length > 0 && currentIndexRef.current + 1 < queueRef.current.length) {
						playNextTrack();
					} else {
						setIsPlaying(false);
						setPositionMillis(0);
						cleanBackendAudio(track.id);
					}
				};

				webSoundRef.current = audio;
				return;
			}

			setIsLoading(false);
			setIsPlaying(false);
		} catch (error) {
			console.error('Failed to play track:', error);
			setIsLoading(false);
			setIsPlaying(false);
		}
	};

	const togglePlayPause = async () => {
		const nativePlayer = nativePlayerRef.current;
		const webSound = webSoundRef.current;

		if (nativePlayer) {
			if (isPlaying) {
				nativePlayer.pause();
				setIsPlaying(false);
			} else {
				nativePlayer.play();
				setIsPlaying(true);
			}
		} else if (webSound) {
			if (isPlaying) {
				webSound.pause();
				setIsPlaying(false);
			} else {
				webSound.play();
				setIsPlaying(true);
			}
		}
	};

	const seekTo = async (positionMs: number) => {
		const nativePlayer = nativePlayerRef.current;
		const webSound = webSoundRef.current;

		if (nativePlayer) {
			nativePlayer.seekTo?.(positionMs / 1000);
			setPositionMillis(positionMs);
		} else if (webSound) {
			webSound.currentTime = positionMs / 1000;
			setPositionMillis(positionMs);
		}
	};

	const seekBy = async (offsetMs: number) => {
		const target = Math.max(0, Math.min(durationMillis || 300000, positionMillis + offsetMs));
		await seekTo(target);
	};

	return (
		<PlayerContext.Provider
			value={{
				currentTrack,
				isPlaying,
				isLoading,
				positionMillis,
				durationMillis,
				isModalOpen,
				openModal,
				closeModal,
				playTrack,
				togglePlayPause,
				seekTo,
				seekBy,
				stopTrack,
				playQueue,
				playNextTrack,
				playPreviousTrack
			}}
		>
			{children}
		</PlayerContext.Provider>
	);
}

export function usePlayer() {
	const context = useContext(PlayerContext);
	if (!context) {
		throw new Error('usePlayer must be used within a PlayerProvider');
	}
	return context;
}