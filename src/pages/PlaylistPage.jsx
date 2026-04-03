import { useState } from 'react';
import { usePlayer } from '../contexts/PlayerContext';
import { usePlaylists } from '../contexts/PlaylistContext';
import { useToast } from '../contexts/ToastContext';
import SongTile from '../components/SongTile';

export default function PlaylistPage() {
  const { playlists, createPlaylist, deletePlaylist, removeSongFromPlaylist } = usePlaylists();
  const { playSong } = usePlayer();
  const { showToast } = useToast();
  const [expanded, setExpanded] = useState({});
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState('');

  const toggle = (id) => setExpanded(prev => ({ ...prev, [id]: !prev[id] }));

  const handleCreate = () => {
    if (newName.trim()) {
      createPlaylist(newName.trim());
      showToast(`Created "${newName.trim()}"`, 'playlist');
      setNewName('');
      setShowCreate(false);
    } else {
      showToast('Enter a playlist name', 'warning');
    }
  };

  return (
    <div style={{ height: '100%', overflowY: 'auto', paddingBottom: 100 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 'max(48px, calc(env(safe-area-inset-top, 20px) + 16px)) 16px 16px' }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, margin: 0 }}>Your Playlists</h1>
        <button
          onClick={() => setShowCreate(true)}
          style={{ padding: '8px 20px', background: 'var(--primary)', color: 'white', borderRadius: 20, fontWeight: 600, fontSize: 14 }}
        >
          + New
        </button>
      </div>

      {/* Create dialog */}
      {showCreate && (
        <div style={{ padding: '0 16px 16px', display: 'flex', gap: 8 }}>
          <input
            type="text" value={newName} onChange={e => setNewName(e.target.value)}
            placeholder="Playlist name" autoFocus
            onKeyDown={e => e.key === 'Enter' && handleCreate()}
            style={{
              flex: 1, padding: '10px 14px', background: 'var(--surface-light)',
              border: 'none', borderRadius: 8, color: 'var(--text-primary)', fontSize: 14, outline: 'none',
            }}
          />
          <button onClick={handleCreate} style={{ padding: '10px 20px', background: 'var(--primary)', color: 'white', borderRadius: 8, fontWeight: 600 }}>
            Create
          </button>
          <button onClick={() => { setShowCreate(false); setNewName(''); }} style={{ padding: '10px 16px', color: 'var(--text-secondary)', fontSize: 14 }}>
            Cancel
          </button>
        </div>
      )}

      {/* Playlists */}
      {playlists.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 24px', color: 'var(--text-secondary)' }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>🎶</div>
          <div style={{ fontSize: 18, fontWeight: 500 }}>No playlists yet</div>
          <div style={{ fontSize: 13, marginTop: 8 }}>Create one to get started</div>
        </div>
      ) : (
        playlists.map(pl => (
          <div key={pl.id} style={{ margin: '8px 16px', background: 'var(--surface)', borderRadius: 12, overflow: 'hidden' }}>
            <div style={{ display: 'flex', alignItems: 'center', padding: '12px 16px', gap: 12 }}>
              <div style={{
                width: 48, height: 48, borderRadius: 8,
                background: 'rgba(29,185,84,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 22,
              }}>
                🎶
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, fontSize: 15 }}>{pl.name}</div>
                <div style={{ color: 'var(--text-secondary)', fontSize: 12 }}>{pl.songs.length} songs</div>
              </div>

              {pl.songs.length > 0 && (
                <button
                  onClick={() => playSong(pl.songs[0], pl.songs)}
                  style={{ fontSize: 32, color: 'var(--primary)', padding: 4 }}
                >
                  &#9654;
                </button>
              )}
              <button onClick={() => toggle(pl.id)} style={{ fontSize: 20, color: 'var(--text-secondary)', padding: 8 }}>
                {expanded[pl.id] ? '▲' : '▼'}
              </button>
              <button onClick={() => { deletePlaylist(pl.id); showToast(`Deleted "${pl.name}"`, 'error'); }} style={{ fontSize: 16, color: '#e74c3c', padding: 8 }}>
                🗑
              </button>
            </div>

            {expanded[pl.id] && (
              pl.songs.length === 0 ? (
                <div style={{ padding: '16px 24px', color: 'var(--text-secondary)', fontSize: 13, textAlign: 'center' }}>
                  No songs yet. Add songs from Home or Search.
                </div>
              ) : (
                pl.songs.map((song, i) => (
                  <div key={song.id} style={{ position: 'relative' }}>
                    <SongTile song={song} queue={pl.songs} index={i} showIndex />
                    <button
                      onClick={() => { removeSongFromPlaylist(pl.id, song.id); showToast('Removed from playlist', 'info', 2000); }}
                      style={{
                        position: 'absolute', right: 50, top: '50%', transform: 'translateY(-50%)',
                        fontSize: 12, color: '#e74c3c', padding: '4px 8px', background: 'rgba(231,76,60,0.1)', borderRadius: 4,
                      }}
                    >
                      Remove
                    </button>
                  </div>
                ))
              )
            )}
          </div>
        ))
      )}
    </div>
  );
}
