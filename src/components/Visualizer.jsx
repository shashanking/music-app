import { useState } from 'react';
import { usePlayer } from '../contexts/PlayerContext';
import VisCanvas from './VisCanvas';

const MODES = ['bars', 'wave', 'circles', 'particles', 'galaxy'];
const LABELS = ['🎚️ Bars', '🌊 Wave', '🔮 Circles', '✨ Particles', '🌌 Galaxy'];

export default function Visualizer() {
  const { currentSong, isPlaying } = usePlayer();
  const [mode, setMode] = useState(0);
  const [fullscreen, setFullscreen] = useState(false);

  const toggleFs = () => {
    if (!document.fullscreenElement) document.documentElement.requestFullscreen?.();
    else document.exitFullscreen?.();
    setFullscreen(f => !f);
  };

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: '#000' }}>
      {!fullscreen && (
        <div style={{ padding: 'max(48px, calc(env(safe-area-inset-top, 20px) + 16px)) 16px 4px', textAlign: 'center', position: 'relative', zIndex: 1 }}>
          <h1 style={{ fontSize: 20, fontWeight: 700, margin: 0 }}>Visualizer</h1>
          <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12, margin: '2px 0 0' }}>
            {currentSong ? `${currentSong.title} — ${currentSong.artist}` : 'Play a song to begin'}
          </p>
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'center', gap: 6, padding: '8px', flexWrap: 'wrap', position: 'relative', zIndex: 1 }}>
        {LABELS.map((label, i) => (
          <button key={i} onClick={() => setMode(i)} style={{
            padding: '5px 12px', borderRadius: 14, fontSize: 12, fontWeight: 500,
            background: mode === i ? 'var(--primary)' : 'rgba(255,255,255,0.08)',
            color: mode === i ? '#fff' : 'rgba(255,255,255,0.5)',
          }}>{label}</button>
        ))}
        <button onClick={toggleFs} style={{ padding: '5px 12px', borderRadius: 14, fontSize: 12, background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.5)' }}>
          {fullscreen ? '⊠' : '⛶'}
        </button>
      </div>

      <div style={{ flex: 1, position: 'relative' }}>
        <VisCanvas mode={MODES[mode]} style={{ borderRadius: fullscreen ? 0 : 12 }} />
      </div>
    </div>
  );
}
