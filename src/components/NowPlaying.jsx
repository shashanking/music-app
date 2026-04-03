import { useState } from 'react';
import { usePlayer } from '../contexts/PlayerContext';
import VisCanvas from './VisCanvas';

const VIZ_MODES = ['bars', 'wave', 'circles', 'particles', 'galaxy'];
const VIZ_ICONS = ['🎚️', '🌊', '🔮', '✨', '🌌'];

function fmt(sec) {
  if (!sec || !isFinite(sec)) return '0:00';
  return `${Math.floor(sec / 60)}:${Math.floor(sec % 60).toString().padStart(2, '0')}`;
}

export default function NowPlaying({ onClose }) {
  const {
    currentSong, isPlaying, position, duration, queue, currentIndex,
    togglePlayPause, seek, nextTrack, prevTrack,
    volume, changeVolume, shuffle, repeat, toggleShuffle, toggleRepeat,
  } = usePlayer();
  const [vizMode, setVizMode] = useState(0);

  if (!currentSong) return null;
  const progress = duration > 0 ? position / duration : 0;

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', flexDirection: 'column',
      background: '#000', overflow: 'hidden',
    }}>
      {/* ── Visualizer background (always running) ── */}
      <div style={{ position: 'absolute', inset: 0, opacity: 0.6 }}>
        <VisCanvas mode={VIZ_MODES[vizMode]} />
      </div>
      {/* Dark overlay for readability */}
      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(0,0,0,0.3) 0%, rgba(0,0,0,0.7) 50%, rgba(0,0,0,0.85) 100%)' }} />

      {/* ── Content ── */}
      <div style={{ position: 'relative', zIndex: 1, flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '0 24px env(safe-area-inset-bottom, 16px)', overflow: 'auto' }}>

        {/* Header */}
        <div style={{ width: '100%', maxWidth: 500, display: 'flex', alignItems: 'center', padding: '16px 0', flexShrink: 0 }}>
          <button onClick={onClose} style={{ width: 40, height: 40, borderRadius: 10, background: 'rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, color: '#fff', backdropFilter: 'blur(8px)' }}>
            ↓
          </button>
          <div style={{ flex: 1, textAlign: 'center' }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--primary)', letterSpacing: 2, textTransform: 'uppercase' }}>Now Playing</div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', marginTop: 1 }}>
              {currentIndex + 1} of {queue.length}
            </div>
          </div>
          {/* Viz mode toggle */}
          <button
            onClick={() => setVizMode(v => (v + 1) % VIZ_MODES.length)}
            style={{ width: 40, height: 40, borderRadius: 10, background: 'rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, backdropFilter: 'blur(8px)' }}
          >
            {VIZ_ICONS[vizMode]}
          </button>
        </div>

        <div style={{ flex: 1 }} />

        {/* Album art with glow */}
        <div style={{ position: 'relative', flexShrink: 0 }}>
          {/* Glow behind */}
          <div style={{
            position: 'absolute', inset: -20, borderRadius: 28,
            background: `url(${currentSong.coverUrl}) center/cover`,
            filter: 'blur(40px) saturate(1.5)', opacity: 0.4,
          }} />
          <div style={{
            width: 'min(280px, 60vw)', height: 'min(280px, 60vw)', borderRadius: 16, overflow: 'hidden',
            position: 'relative', boxShadow: '0 12px 48px rgba(0,0,0,0.6)',
            border: '1px solid rgba(255,255,255,0.08)',
          }}>
            <img src={currentSong.coverUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              onError={e => { e.target.style.display = 'none'; }} />
          </div>
        </div>

        <div style={{ flex: 1 }} />

        {/* Song info */}
        <div style={{ width: '100%', maxWidth: 500, textAlign: 'center', marginBottom: 20, flexShrink: 0 }}>
          <div style={{
            fontSize: 'clamp(18px, 5vw, 24px)', fontWeight: 800, color: '#fff',
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            textShadow: '0 2px 12px rgba(0,0,0,0.5)',
          }}>
            {currentSong.title}
          </div>
          <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)', marginTop: 4 }}>
            {currentSong.artist}
          </div>
        </div>

        {/* Seek bar */}
        <div style={{ width: '100%', maxWidth: 500, marginBottom: 16, flexShrink: 0 }}>
          {/* Custom track */}
          <div
            style={{ position: 'relative', height: 32, cursor: 'pointer', display: 'flex', alignItems: 'center' }}
            onClick={e => { const rect = e.currentTarget.getBoundingClientRect(); const pct = (e.clientX - rect.left) / rect.width; seek(pct * duration); }}
          >
            <div style={{ width: '100%', height: 4, borderRadius: 2, background: 'rgba(255,255,255,0.12)', position: 'relative' }}>
              <div style={{ width: `${progress * 100}%`, height: '100%', borderRadius: 2, background: 'var(--primary)', transition: 'width 0.1s linear', position: 'relative' }}>
                <div style={{
                  position: 'absolute', right: -6, top: -4, width: 12, height: 12,
                  borderRadius: '50%', background: '#fff', boxShadow: '0 0 8px rgba(29,185,84,0.5)',
                }} />
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', fontVariantNumeric: 'tabular-nums' }}>{fmt(position)}</span>
            <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', fontVariantNumeric: 'tabular-nums' }}>{fmt(duration)}</span>
          </div>
        </div>

        {/* Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 'clamp(16px, 5vw, 28px)', marginBottom: 20, flexShrink: 0 }}>
          <button onClick={toggleShuffle} style={{
            width: 40, height: 40, borderRadius: 10,
            background: shuffle ? 'rgba(29,185,84,0.15)' : 'transparent',
            color: shuffle ? 'var(--primary)' : 'rgba(255,255,255,0.4)', fontSize: 18,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>🔀</button>

          <button onClick={prevTrack} style={{ fontSize: 28, color: '#fff', padding: 8 }}>⏮</button>

          <button
            onClick={togglePlayPause}
            style={{
              width: 68, height: 68, borderRadius: '50%',
              background: 'linear-gradient(135deg, var(--primary), #17a44a)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 30, color: 'white',
              boxShadow: '0 4px 24px rgba(29,185,84,0.4)',
              transition: 'transform 0.15s',
            }}
            onMouseDown={e => e.currentTarget.style.transform = 'scale(0.93)'}
            onMouseUp={e => e.currentTarget.style.transform = 'scale(1)'}
            onTouchStart={e => e.currentTarget.style.transform = 'scale(0.93)'}
            onTouchEnd={e => e.currentTarget.style.transform = 'scale(1)'}
          >
            {isPlaying ? '⏸' : '▶'}
          </button>

          <button onClick={nextTrack} style={{ fontSize: 28, color: '#fff', padding: 8 }}>⏭</button>

          <button onClick={toggleRepeat} style={{
            width: 40, height: 40, borderRadius: 10,
            background: repeat ? 'rgba(29,185,84,0.15)' : 'transparent',
            color: repeat ? 'var(--primary)' : 'rgba(255,255,255,0.4)', fontSize: 18,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>🔁</button>
        </div>

        {/* Volume */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%', maxWidth: 280, marginBottom: 20, flexShrink: 0 }}>
          <span style={{ fontSize: 14, opacity: 0.4 }}>🔈</span>
          <div style={{ flex: 1, position: 'relative', height: 24, display: 'flex', alignItems: 'center', cursor: 'pointer' }}
            onClick={e => { const r = e.currentTarget.getBoundingClientRect(); changeVolume((e.clientX - r.left) / r.width); }}
          >
            <div style={{ width: '100%', height: 3, borderRadius: 2, background: 'rgba(255,255,255,0.1)' }}>
              <div style={{ width: `${volume * 100}%`, height: '100%', borderRadius: 2, background: 'var(--primary)' }} />
            </div>
          </div>
          <span style={{ fontSize: 14, opacity: 0.4 }}>🔊</span>
        </div>
      </div>
    </div>
  );
}
