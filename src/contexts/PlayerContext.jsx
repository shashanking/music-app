import { createContext, useContext, useRef, useState, useCallback, useEffect } from 'react';

const PlayerContext = createContext(null);

export function PlayerProvider({ children }) {
  const audioRef = useRef((() => {
    const a = new Audio();
    a.crossOrigin = 'anonymous';
    return a;
  })());
  const [queue, setQueue] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(-1);
  const [isPlaying, setIsPlaying] = useState(false);
  const [position, setPosition] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolumeState] = useState(0.8);
  const [shuffle, setShuffle] = useState(false);
  const [repeat, setRepeat] = useState(false);

  const currentSong = currentIndex >= 0 && currentIndex < queue.length ? queue[currentIndex] : null;

  // Time update
  useEffect(() => {
    const audio = audioRef.current;
    const onTimeUpdate = () => setPosition(audio.currentTime);
    const onDurationChange = () => setDuration(audio.duration || 0);
    const onPlay = () => setIsPlaying(true);
    const onPause = () => setIsPlaying(false);
    const onEnded = () => {
      if (repeat) {
        audio.currentTime = 0;
        audio.play();
      } else {
        nextTrack();
      }
    };
    const onError = () => {
      console.warn('Audio playback error, skipping...');
      setTimeout(() => nextTrack(), 1000);
    };

    audio.addEventListener('timeupdate', onTimeUpdate);
    audio.addEventListener('durationchange', onDurationChange);
    audio.addEventListener('play', onPlay);
    audio.addEventListener('pause', onPause);
    audio.addEventListener('ended', onEnded);
    audio.addEventListener('error', onError);

    return () => {
      audio.removeEventListener('timeupdate', onTimeUpdate);
      audio.removeEventListener('durationchange', onDurationChange);
      audio.removeEventListener('play', onPlay);
      audio.removeEventListener('pause', onPause);
      audio.removeEventListener('ended', onEnded);
      audio.removeEventListener('error', onError);
    };
  }, [repeat, queue, currentIndex]);

  const loadAndPlay = useCallback((song) => {
    if (!song?.audioUrl) return;
    const audio = audioRef.current;
    audio.pause();
    audio.src = song.audioUrl;
    audio.volume = volume;
    audio.load();
    setPosition(0);
    setDuration(0);
    audio.play().catch(() => {});
  }, [volume]);

  const playSong = useCallback((song, songQueue) => {
    const q = songQueue || [song];
    setQueue(q);
    const idx = q.findIndex(s => s.id === song.id);
    setCurrentIndex(idx >= 0 ? idx : 0);
    loadAndPlay(song);
  }, [loadAndPlay]);

  const togglePlayPause = useCallback(() => {
    const audio = audioRef.current;
    if (audio.paused) {
      audio.play().catch(() => {});
    } else {
      audio.pause();
    }
  }, []);

  const seek = useCallback((time) => {
    audioRef.current.currentTime = time;
    setPosition(time);
  }, []);

  const nextTrack = useCallback(() => {
    if (queue.length === 0) return;
    const next = (currentIndex + 1) % queue.length;
    setCurrentIndex(next);
    loadAndPlay(queue[next]);
  }, [queue, currentIndex, loadAndPlay]);

  const prevTrack = useCallback(() => {
    if (queue.length === 0) return;
    if (audioRef.current.currentTime > 3) {
      seek(0);
      return;
    }
    const prev = (currentIndex - 1 + queue.length) % queue.length;
    setCurrentIndex(prev);
    loadAndPlay(queue[prev]);
  }, [queue, currentIndex, loadAndPlay, seek]);

  const changeVolume = useCallback((v) => {
    const val = Math.max(0, Math.min(1, v));
    audioRef.current.volume = val;
    setVolumeState(val);
  }, []);

  const toggleShuffle = useCallback(() => setShuffle(s => !s), []);
  const toggleRepeat = useCallback(() => setRepeat(r => !r), []);

  const value = {
    audioRef, queue, currentSong, currentIndex, isPlaying, position, duration,
    volume, shuffle, repeat,
    playSong, togglePlayPause, seek, nextTrack, prevTrack,
    changeVolume, toggleShuffle, toggleRepeat, setQueue,
  };

  return <PlayerContext.Provider value={value}>{children}</PlayerContext.Provider>;
}

export const usePlayer = () => useContext(PlayerContext);
