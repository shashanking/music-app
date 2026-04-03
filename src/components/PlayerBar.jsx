import { usePlayer } from '../contexts/PlayerContext';
import VisCanvas from './VisCanvas';

function fmt(s) { if (!s || !isFinite(s)) return '0:00'; return `${Math.floor(s/60)}:${Math.floor(s%60).toString().padStart(2,'0')}`; }

export default function PlayerBar({ onExpand }) {
  const { currentSong, isPlaying, position, duration, togglePlayPause, nextTrack, prevTrack } = usePlayer();
  if (!currentSong) return null;
  const progress = duration > 0 ? (position / duration) * 100 : 0;

  return (
    <div onClick={onExpand} style={{ background: 'var(--surface)', cursor: 'pointer', boxShadow: '0 -2px 12px rgba(0,0,0,0.4)', position: 'relative', overflow: 'hidden' }}>
      {/* Mini visualizer bg */}
      <div style={{ position: 'absolute', inset: 0, opacity: 0.15 }}>
        <VisCanvas mode="bars" />
      </div>
      {/* Progress bar */}
      <div style={{ height: 2, background: 'rgba(255,255,255,0.06)', position: 'relative', zIndex: 1 }}>
        <div style={{ height: '100%', background: 'var(--primary)', width: `${progress}%`, transition: 'width 0.3s linear' }} />
      </div>

      <div style={{ display: 'flex', alignItems: 'center', padding: '8px 12px', gap: 10, position: 'relative', zIndex: 1 }}>
        <img src={currentSong.coverUrl} alt="" style={{
          width: 44, height: 44, borderRadius: 8, objectFit: 'cover', background: 'var(--surface-light)',
          boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
        }} onError={e => { e.target.style.display = 'none'; }} />

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ color: '#fff', fontSize: 13, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {currentSong.title}
          </div>
          <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {currentSong.artist} &bull; {fmt(position)}
          </div>
        </div>

        <button onClick={e => { e.stopPropagation(); prevTrack(); }} style={{ color: '#fff', fontSize: 20, padding: 6 }}>⏮</button>

        <button
          onClick={e => { e.stopPropagation(); togglePlayPause(); }}
          style={{
            width: 38, height: 38, borderRadius: '50%',
            background: 'linear-gradient(135deg, var(--primary), #17a44a)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'white', fontSize: 18,
            boxShadow: '0 2px 12px rgba(29,185,84,0.3)',
          }}
        >
          {isPlaying ? '⏸' : '▶'}
        </button>

        <button onClick={e => { e.stopPropagation(); nextTrack(); }} style={{ color: '#fff', fontSize: 20, padding: 6 }}>⏭</button>
      </div>
    </div>
  );
}
