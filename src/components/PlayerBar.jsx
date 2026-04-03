import { usePlayer } from '../contexts/PlayerContext';

function formatTime(sec) {
  if (!sec || !isFinite(sec)) return '0:00';
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export default function PlayerBar({ onExpand }) {
  const { currentSong, isPlaying, position, duration, togglePlayPause, nextTrack, prevTrack } = usePlayer();

  if (!currentSong) return null;

  const progress = duration > 0 ? (position / duration) * 100 : 0;

  return (
    <div onClick={onExpand} style={{
      background: 'var(--surface)', cursor: 'pointer',
      boxShadow: '0 -2px 10px rgba(0,0,0,0.3)',
    }}>
      {/* Progress line */}
      <div style={{ height: 2, background: 'var(--surface-light)' }}>
        <div style={{ height: '100%', background: 'var(--primary)', width: `${progress}%`, transition: 'width 0.3s linear' }} />
      </div>

      <div style={{ display: 'flex', alignItems: 'center', padding: '8px 16px', gap: 12 }}>
        <img
          src={currentSong.coverUrl} alt=""
          style={{ width: 48, height: 48, borderRadius: 4, objectFit: 'cover', background: 'var(--surface-light)' }}
          onError={e => { e.target.style.display = 'none'; }}
        />

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ color: 'var(--text-primary)', fontSize: 14, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {currentSong.title}
          </div>
          <div style={{ color: 'var(--text-secondary)', fontSize: 12, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {currentSong.artist}
          </div>
        </div>

        <span style={{ color: 'var(--text-secondary)', fontSize: 11, whiteSpace: 'nowrap' }}>
          {formatTime(position)} / {formatTime(duration)}
        </span>

        <button onClick={e => { e.stopPropagation(); prevTrack(); }} style={{ color: 'var(--text-primary)', fontSize: 24, padding: 4 }}>
          ⏮
        </button>

        <button
          onClick={e => { e.stopPropagation(); togglePlayPause(); }}
          style={{
            width: 40, height: 40, borderRadius: '50%', background: 'var(--primary)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'white', fontSize: 20,
          }}
        >
          {isPlaying ? '⏸' : '▶'}
        </button>

        <button onClick={e => { e.stopPropagation(); nextTrack(); }} style={{ color: 'var(--text-primary)', fontSize: 24, padding: 4 }}>
          ⏭
        </button>
      </div>
    </div>
  );
}
