import { useState } from 'react';
import { usePlayer } from '../contexts/PlayerContext';
import { usePlaylists } from '../contexts/PlaylistContext';

function formatTime(sec) {
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export default function SongTile({ song, queue, index, showIndex }) {
  const { playSong, currentSong, isPlaying } = usePlayer();
  const { playlists, addSongToPlaylist } = usePlaylists();
  const [showMenu, setShowMenu] = useState(false);
  const isActive = currentSong?.id === song.id;

  return (
    <div
      className="song-tile"
      onClick={() => playSong(song, queue)}
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
        <span style={{ width: 28, textAlign: 'center', color: isActive ? 'var(--primary)' : 'var(--text-secondary)', fontSize: 14, fontWeight: 500 }}>
          {index + 1}
        </span>
      )}

      <img
        src={song.coverUrl}
        alt=""
        style={{ width: 48, height: 48, borderRadius: 4, objectFit: 'cover', background: 'var(--surface-light)' }}
        onError={e => { e.target.style.display = 'none'; }}
      />

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          color: isActive ? 'var(--primary)' : 'var(--text-primary)',
          fontSize: 14, fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
        }}>
          {song.title}
        </div>
        <div style={{
          color: 'var(--text-secondary)', fontSize: 12,
          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
        }}>
          {song.artist} &bull; {song.album}
        </div>
      </div>

      {isActive && isPlaying ? (
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 2, height: 16 }}>
          {[0, 1, 2].map(i => (
            <div key={i} style={{
              width: 3, background: 'var(--primary)', borderRadius: 2,
              animation: `barBounce 0.6s ${i * 0.15}s ease-in-out infinite alternate`,
            }} />
          ))}
        </div>
      ) : (
        <span style={{ color: 'var(--text-secondary)', fontSize: 12, whiteSpace: 'nowrap' }}>
          {formatTime(song.duration)}
        </span>
      )}

      {/* Menu button */}
      <div style={{ position: 'relative' }}>
        <button
          onClick={e => { e.stopPropagation(); setShowMenu(!showMenu); }}
          style={{ padding: 4, color: 'var(--text-secondary)', fontSize: 18, lineHeight: 1 }}
        >
          &#8942;
        </button>
        {showMenu && (
          <>
            <div style={{ position: 'fixed', inset: 0, zIndex: 99 }} onClick={() => setShowMenu(false)} />
            <div style={{
              position: 'absolute', right: 0, top: '100%', zIndex: 100,
              background: 'var(--surface-light)', borderRadius: 8, padding: 8,
              minWidth: 200, boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
            }}>
              <div style={{ padding: '8px 12px', color: 'var(--text-secondary)', fontSize: 11, fontWeight: 600, textTransform: 'uppercase' }}>
                Add to Playlist
              </div>
              {playlists.map(pl => (
                <button
                  key={pl.id}
                  onClick={e => { e.stopPropagation(); addSongToPlaylist(pl.id, song); setShowMenu(false); }}
                  style={{
                    display: 'block', width: '100%', textAlign: 'left',
                    padding: '8px 12px', fontSize: 13, color: 'var(--text-primary)',
                    borderRadius: 4,
                  }}
                  onMouseEnter={e => e.target.style.background = 'rgba(255,255,255,0.1)'}
                  onMouseLeave={e => e.target.style.background = 'transparent'}
                >
                  {pl.name} ({pl.songs.length})
                </button>
              ))}
            </div>
          </>
        )}
      </div>

      <style>{`
        @keyframes barBounce {
          from { height: 4px; }
          to { height: 14px; }
        }
      `}</style>
    </div>
  );
}
