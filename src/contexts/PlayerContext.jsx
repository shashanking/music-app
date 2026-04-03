import { createContext, useContext, useRef, useState, useCallback, useEffect } from 'react';

const PlayerContext = createContext(null);

// Persist helpers
const loadJSON = (key, fallback) => { try { return JSON.parse(localStorage.getItem(key)) ?? fallback; } catch { return fallback; } };
const saveJSON = (key, val) => { try { localStorage.setItem(key, JSON.stringify(val)); } catch {} };

export function PlayerProvider({ children }) {
  const audioRef = useRef((() => { const a = new Audio(); a.crossOrigin = 'anonymous'; return a; })());
  const analyserRef = useRef(null);
  const audioCtxRef = useRef(null);

  const [queue, setQueue] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(-1);
  const [isPlaying, setIsPlaying] = useState(false);
  const [position, setPosition] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolumeState] = useState(() => loadJSON('vol', 0.8));
  const [shuffle, setShuffle] = useState(false);
  const [repeat, setRepeat] = useState(false);
  const [recentlyPlayed, setRecentlyPlayed] = useState(() => loadJSON('recent', []));

  const currentSong = currentIndex >= 0 && currentIndex < queue.length ? queue[currentIndex] : null;

  // Auto-connect Web Audio API on first user interaction
  const ensureAudioContext = useCallback(() => {
    const audio = audioRef.current;
    if (audio._vizCtx) {
      if (audio._vizCtx.state === 'suspended') audio._vizCtx.resume();
      analyserRef.current = audio._vizAnalyser;
      audioCtxRef.current = audio._vizCtx;
      return;
    }
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 512;
      analyser.smoothingTimeConstant = 0.82;
      const source = ctx.createMediaElementSource(audio);
      source.connect(analyser);
      analyser.connect(ctx.destination);
      audio._vizCtx = ctx;
      audio._vizAnalyser = analyser;
      audio._vizSource = source;
      analyserRef.current = analyser;
      audioCtxRef.current = ctx;
    } catch (e) {
      console.warn('AudioContext error:', e);
    }
  }, []);

  // Persist volume
  useEffect(() => { saveJSON('vol', volume); }, [volume]);
  // Persist recently played (max 30)
  useEffect(() => { saveJSON('recent', recentlyPlayed.slice(0, 30)); }, [recentlyPlayed]);

  // Audio events
  useEffect(() => {
    const audio = audioRef.current;
    const onTimeUpdate = () => setPosition(audio.currentTime);
    const onDurationChange = () => setDuration(audio.duration || 0);
    const onPlay = () => setIsPlaying(true);
    const onPause = () => setIsPlaying(false);
    const onEnded = () => { repeat ? (audio.currentTime = 0, audio.play()) : nextTrack(); };
    const onError = () => { setTimeout(() => nextTrack(), 800); };

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
    ensureAudioContext();
    const audio = audioRef.current;
    audio.pause();
    audio.src = song.audioUrl;
    audio.volume = volume;
    audio.load();
    setPosition(0);
    setDuration(0);
    audio.play().catch(() => {});
    // Add to recently played
    setRecentlyPlayed(prev => {
      const filtered = prev.filter(s => s.id !== song.id);
      return [song, ...filtered].slice(0, 30);
    });
  }, [volume, ensureAudioContext]);

  const playSong = useCallback((song, songQueue) => {
    const q = songQueue || [song];
    setQueue(q);
    const idx = q.findIndex(s => s.id === song.id);
    setCurrentIndex(idx >= 0 ? idx : 0);
    loadAndPlay(song);
  }, [loadAndPlay]);

  const togglePlayPause = useCallback(() => {
    ensureAudioContext();
    const audio = audioRef.current;
    audio.paused ? audio.play().catch(() => {}) : audio.pause();
  }, [ensureAudioContext]);

  const seek = useCallback((time) => { audioRef.current.currentTime = time; setPosition(time); }, []);

  const nextTrack = useCallback(() => {
    if (queue.length === 0) return;
    const next = shuffle
      ? Math.floor(Math.random() * queue.length)
      : (currentIndex + 1) % queue.length;
    setCurrentIndex(next);
    loadAndPlay(queue[next]);
  }, [queue, currentIndex, shuffle, loadAndPlay]);

  const prevTrack = useCallback(() => {
    if (queue.length === 0) return;
    if (audioRef.current.currentTime > 3) { seek(0); return; }
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
    audioRef, analyserRef, audioCtxRef,
    queue, currentSong, currentIndex, isPlaying, position, duration,
    volume, shuffle, repeat, recentlyPlayed,
    playSong, togglePlayPause, seek, nextTrack, prevTrack,
    changeVolume, toggleShuffle, toggleRepeat, setQueue, ensureAudioContext,
  };

  return <PlayerContext.Provider value={value}>{children}</PlayerContext.Provider>;
}

export const usePlayer = () => useContext(PlayerContext);
