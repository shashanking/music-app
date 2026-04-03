import { usePlayer } from '../contexts/PlayerContext';

function formatTime(sec) {
  if (!sec || !isFinite(sec)) return '0:00';
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export default function NowPlaying({ onClose }) {
  const {
    currentSong, isPlaying, position, duration,
    togglePlayPause, seek, nextTrack, prevTrack,
    volume, changeVolume, shuffle, repeat, toggleShuffle, toggleRepeat,
  } = usePlayer();

  if (!currentSong) return null;

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 1000,
      background: 'linear-gradient(180deg, rgba(29,185,84,0.3) 0%, var(--bg) 40%, var(--bg) 100%)',
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      padding: '16px 24px env(safe-area-inset-bottom, 16px)',
      overflow: 'auto',
    }}>
      {/* Header */}
      <div style={{ width: '100%', maxWidth: 500, display: 'flex', alignItems: 'center', marginBottom: 24 }}>
        <button onClick={onClose} style={{ fontSize: 28, color: 'var(--text-primary)', padding: 8 }}>&#9660;</button>
        <span style={{ flex: 1, textAlign: 'center', color: 'var(--text-secondary)', fontSize: 11, fontWeight: 600, letterSpacing: 2, textTransform: 'uppercase' }}>
          Now Playing
        </span>
        <div style={{ width: 44 }} />
      </div>

      {/* Album art */}
      <div style={{
        width: 280, height: 280, borderRadius: 12, overflow: 'hidden',
        boxShadow: '0 8px 40px rgba(29,185,84,0.3)',
        marginBottom: 32, flexShrink: 0,
      }}>
        <img src={currentSong.coverUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          onError={e => { e.target.style.display = 'none'; }} />
      </div>

      {/* Song info */}
      <div style={{ width: '100%', maxWidth: 500, textAlign: 'center', marginBottom: 24 }}>
        <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {currentSong.title}
        </div>
        <div style={{ fontSize: 14, color: 'var(--text-secondary)', marginTop: 4 }}>
          {currentSong.artist} &bull; {currentSong.album}
        </div>
      </div>

      {/* Seek bar */}
      <div style={{ width: '100%', maxWidth: 500, marginBottom: 16 }}>
        <input
          type="range" min={0} max={duration || 1} step={0.1} value={position}
          onChange={e => seek(parseFloat(e.target.value))}
          style={{ width: '100%', accentColor: 'var(--primary)', cursor: 'pointer' }}
        />
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
          <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{formatTime(position)}</span>
          <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{formatTime(duration)}</span>
        </div>
      </div>

      {/* Controls */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 24, marginBottom: 24 }}>
        <button onClick={toggleShuffle} style={{ fontSize: 20, color: shuffle ? 'var(--primary)' : 'var(--text-secondary)', padding: 8 }}>
          &#128256;
        </button>
        <button onClick={prevTrack} style={{ fontSize: 32, color: 'var(--text-primary)', padding: 8 }}>
          ⏮
        </button>
        <button
          onClick={togglePlayPause}
          style={{
            width: 64, height: 64, borderRadius: '50%', background: 'var(--primary)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 28, color: 'white',
          }}
        >
          {isPlaying ? '⏸' : '▶'}
        </button>
        <button onClick={nextTrack} style={{ fontSize: 32, color: 'var(--text-primary)', padding: 8 }}>
          ⏭
        </button>
        <button onClick={toggleRepeat} style={{ fontSize: 20, color: repeat ? 'var(--primary)' : 'var(--text-secondary)', padding: 8 }}>
          &#128257;
        </button>
      </div>

      {/* Volume */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, width: '100%', maxWidth: 300 }}>
        <span style={{ fontSize: 16 }}>&#128264;</span>
        <input
          type="range" min={0} max={1} step={0.01} value={volume}
          onChange={e => changeVolume(parseFloat(e.target.value))}
          style={{ flex: 1, accentColor: 'var(--primary)', cursor: 'pointer' }}
        />
        <span style={{ fontSize: 16 }}>&#128266;</span>
      </div>
    </div>
  );
}
