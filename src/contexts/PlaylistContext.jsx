import { createContext, useContext, useState, useCallback, useEffect } from 'react';

const PlaylistContext = createContext(null);
const STORAGE_KEY = 'playlists_v1';

const loadPlaylists = () => {
  try {
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (Array.isArray(stored) && stored.length) return stored;
  } catch {}
  return [{ id: 'favorites', name: 'Favorites', songs: [] }];
};

export function PlaylistProvider({ children }) {
  const [playlists, setPlaylists] = useState(loadPlaylists);

  // Persist on every change
  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(playlists)); } catch {}
  }, [playlists]);

  const createPlaylist = useCallback((name) => {
    const pl = { id: Date.now().toString(), name, songs: [] };
    setPlaylists(prev => [...prev, pl]);
    return pl;
  }, []);

  const deletePlaylist = useCallback((id) => {
    setPlaylists(prev => prev.filter(p => p.id !== id));
  }, []);

  const addSongToPlaylist = useCallback((playlistId, song) => {
    setPlaylists(prev => prev.map(p => {
      if (p.id !== playlistId) return p;
      if (p.songs.some(s => s.id === song.id)) return p;
      return { ...p, songs: [...p.songs, song] };
    }));
  }, []);

  const removeSongFromPlaylist = useCallback((playlistId, songId) => {
    setPlaylists(prev => prev.map(p => {
      if (p.id !== playlistId) return p;
      return { ...p, songs: p.songs.filter(s => s.id !== songId) };
    }));
  }, []);

  const isSongInPlaylist = useCallback((playlistId, songId) => {
    const pl = playlists.find(p => p.id === playlistId);
    return pl ? pl.songs.some(s => s.id === songId) : false;
  }, [playlists]);

  return (
    <PlaylistContext.Provider value={{
      playlists, createPlaylist, deletePlaylist,
      addSongToPlaylist, removeSongFromPlaylist, isSongInPlaylist,
    }}>
      {children}
    </PlaylistContext.Provider>
  );
}

export const usePlaylists = () => useContext(PlaylistContext);
