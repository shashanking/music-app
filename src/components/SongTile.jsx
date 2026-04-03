import { useState } from 'react';
import { usePlayer } from '../contexts/PlayerContext';
import { usePlaylists } from '../contexts/PlaylistContext';
import { useToast } from '../contexts/ToastContext';

function formatTime(sec) {
  if (!sec || sec <= 0) return '0:00';
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export default function SongTile({ song, queue, index, showIndex }) {
  const { playSong, currentSong, isPlaying } = usePlayer();
  const { playlists, addSongToPlaylist, isSongInPlaylist } = usePlaylists();
  const { showToast } = useToast();
  const [showMenu, setShowMenu] = useState(false);
  const [imgError, setImgError] = useState(false);
  const isActive = currentSong?.id === song.id;

  if (!song || !song.id) return null;

  const handlePlay = () => {
    if (!song.audioUrl) {
      showToast('This song is unavailable', 'error');
      return;
    }
    playSong(song, queue);
  };

  const handleAddToPlaylist = (e, pl) => {
    e.stopPropagation();
    if (isSongInPlaylist(pl.id, song.id)) {
      showToast(`Already in ${pl.name}`, 'warning', 2000);
    } else {
      addSongToPlaylist(pl.id, song);
      showToast(`Added to ${pl.name}`, 'playlist', 2000);
    }
    setShowMenu(false);
  };

  return (
    <div
      onClick={handlePlay}
      style={{
        display: 'flex', alignItems: 'center', padding: '8px 16px', gap: 12,
        cursor: 'pointer', borderRadius: 8,
        background: isActive ? 'rgba(29,185,84,0.08)' : 'transparent',
        transition: 'background 0.2s',
      }}
      onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; }}
      onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = 'transparent'; }}
    >
      {showIndex && index != null && (
        <span style={{ width: 28, textAlign: 'center', color: isActive ? 'var(--primary)' : 'var(--text-secondary)', fontSize: 14, fontWeight: 500, flexShrink: 0 }}>
          {index + 1}
        </span>
      )}

      {!imgError ? (
        <img
          src={song.coverUrl}
          alt=""
          loading="lazy"
          style={{ width: 48, height: 48, borderRadius: 4, objectFit: 'cover', background: 'var(--surface-light)', flexShrink: 0 }}
          onError={() => setImgError(true)}
        />
      ) : (
        <div style={{
          width: 48, height: 48, borderRadius: 4, background: 'var(--surface-light)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0,
        }}>🎵</div>
      )}

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          color: isActive ? 'var(--primary)' : 'var(--text-primary)',
          fontSize: 14, fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
        }}>
          {song.title || 'Unknown Title'}
        </div>
        <div style={{
          color: 'var(--text-secondary)', fontSize: 12,
          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
        }}>
          {song.artist || 'Unknown Artist'} &bull; {song.album || 'Single'}
        </div>
      </div>

      {isActive && isPlaying ? (
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 2, height: 16, flexShrink: 0 }}>
          {[0, 1, 2].map(i => (
            <div key={i} style={{
              width: 3, background: 'var(--primary)', borderRadius: 2,
              animation: `barBounce 0.6s ${i * 0.15}s ease-in-out infinite alternate`,
            }} />
          ))}
        </div>
      ) : (
        <span style={{ color: 'var(--text-secondary)', fontSize: 12, whiteSpace: 'nowrap', flexShrink: 0 }}>
          {formatTime(song.duration)}
        </span>
      )}

      <div style={{ position: 'relative', flexShrink: 0 }}>
        <button
          onClick={e => { e.stopPropagation(); setShowMenu(!showMenu); }}
          style={{ padding: 4, color: 'var(--text-secondary)', fontSize: 18, lineHeight: 1 }}
          aria-label="Song options"
        >
          &#8942;
        </button>
        {showMenu && (
          <>
            <div style={{ position: 'fixed', inset: 0, zIndex: 99 }} onClick={(e) => { e.stopPropagation(); setShowMenu(false); }} />
            <div style={{
              position: 'absolute', right: 0, top: '100%', zIndex: 100,
              background: 'rgba(40,40,40,0.98)', backdropFilter: 'blur(12px)',
              borderRadius: 10, padding: 6, minWidth: 200,
              boxShadow: '0 8px 32px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.06)',
              animation: 'menuIn 0.15s ease-out',
            }}>
              <div style={{ padding: '8px 12px', color: 'var(--text-secondary)', fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1 }}>
                Add to Playlist
              </div>
              {playlists.length === 0 ? (
                <div style={{ padding: '8px 12px', fontSize: 12, color: 'var(--text-secondary)' }}>
                  No playlists yet
                </div>
              ) : (
                playlists.map(pl => {
                  const alreadyIn = isSongInPlaylist(pl.id, song.id);
                  return (
                    <button
                      key={pl.id}
                      onClick={e => handleAddToPlaylist(e, pl)}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 8, width: '100%', textAlign: 'left',
                        padding: '8px 12px', fontSize: 13, borderRadius: 6,
                        color: alreadyIn ? 'var(--primary)' : 'var(--text-primary)',
                        opacity: alreadyIn ? 0.6 : 1,
                      }}
                      onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.08)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                    >
                      <span style={{ fontSize: 14 }}>{alreadyIn ? '✓' : '+'}</span>
                      {pl.name} ({pl.songs.length})
                    </button>
                  );
                })
              )}
            </div>
          </>
        )}
      </div>

      <style>{`
        @keyframes barBounce { from { height: 4px; } to { height: 14px; } }
        @keyframes menuIn { from { opacity: 0; transform: translateY(-4px) scale(0.97); } to { opacity: 1; transform: translateY(0) scale(1); } }
      `}</style>
    </div>
  );
}
