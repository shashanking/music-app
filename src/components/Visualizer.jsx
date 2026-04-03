import { useRef, useEffect, useState, useCallback } from 'react';
import { usePlayer } from '../contexts/PlayerContext';

const MODES = ['bars', 'wave', 'circles', 'particles', 'psychedelic', 'galaxy'];
const MODE_LABELS = ['🎚️ Bars', '🌊 Wave', '🔮 Circles', '✨ Particles', '🍄 Psychedelic', '🌌 Galaxy'];

export default function Visualizer() {
  const { audioRef, currentSong, isPlaying } = usePlayer();
  const canvasRef = useRef(null);
  const animRef = useRef(null);
  const audioCtxRef = useRef(null);
  const analyserRef = useRef(null);
  const sourceRef = useRef(null);
  const [mode, setMode] = useState(0);
  const [connected, setConnected] = useState(() => !!audioRef.current?._vizCtx);
  const [fullscreen, setFullscreen] = useState(false);
  const containerRef = useRef(null);
  const frameRef = useRef(0);

  // Restore refs if already connected from a previous mount
  useEffect(() => {
    const audio = audioRef.current;
    if (audio?._vizCtx && audio._vizAnalyser) {
      audioCtxRef.current = audio._vizCtx;
      analyserRef.current = audio._vizAnalyser;
      sourceRef.current = audio._vizSource;
      if (audio._vizCtx.state === 'suspended') audio._vizCtx.resume();
      setConnected(true);
    }
  }, [audioRef]);

  const connect = useCallback(() => {
    if (connected || !audioRef.current) return;
    try {
      const audio = audioRef.current;
      // Reuse existing audio context if already created (survives re-mounts)
      if (audio._vizCtx && audio._vizAnalyser) {
        audioCtxRef.current = audio._vizCtx;
        analyserRef.current = audio._vizAnalyser;
        sourceRef.current = audio._vizSource;
        if (audio._vizCtx.state === 'suspended') audio._vizCtx.resume();
        setConnected(true);
        return;
      }
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 512;
      analyser.smoothingTimeConstant = 0.82;
      const source = ctx.createMediaElementSource(audio);
      source.connect(analyser);
      analyser.connect(ctx.destination);
      // Store on audio element so it persists across component re-mounts
      audio._vizCtx = ctx;
      audio._vizAnalyser = analyser;
      audio._vizSource = source;
      audioCtxRef.current = ctx;
      analyserRef.current = analyser;
      sourceRef.current = source;
      setConnected(true);
    } catch (e) {
      console.warn('Visualizer connect error:', e);
    }
  }, [connected, audioRef]);

  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen?.().catch(() => {});
      setFullscreen(true);
    } else {
      document.exitFullscreen?.();
      setFullscreen(false);
    }
  }, []);

  useEffect(() => {
    const onFsChange = () => setFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', onFsChange);
    return () => document.removeEventListener('fullscreenchange', onFsChange);
  }, []);

  // Main render loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let prevW = 0, prevH = 0;

    const resize = () => {
      const dpr = window.devicePixelRatio || 1;
      const w = canvas.offsetWidth;
      const h = canvas.offsetHeight;
      if (w === prevW && h === prevH) return;
      prevW = w; prevH = h;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener('resize', resize);

    const getAudioData = () => {
      if (!analyserRef.current || !connected) return null;
      const freq = new Uint8Array(analyserRef.current.frequencyBinCount);
      const time = new Uint8Array(analyserRef.current.fftSize);
      analyserRef.current.getByteFrequencyData(freq);
      analyserRef.current.getByteTimeDomainData(time);
      let bass = 0, mid = 0, treble = 0, avg = 0;
      const len = freq.length;
      for (let i = 0; i < len; i++) {
        const v = freq[i];
        avg += v;
        if (i < len * 0.15) bass += v;
        else if (i < len * 0.5) mid += v;
        else treble += v;
      }
      bass /= (len * 0.15 * 255);
      mid /= (len * 0.35 * 255);
      treble /= (len * 0.5 * 255);
      avg /= (len * 255);
      return { freq, time, bass, mid, treble, avg };
    };

    const draw = () => {
      animRef.current = requestAnimationFrame(draw);
      resize();
      frameRef.current++;
      const w = canvas.offsetWidth, h = canvas.offsetHeight;
      const audio = getAudioData();

      if (!audio) {
        drawIdle(ctx, w, h, frameRef.current);
        return;
      }

      const m = MODES[mode];
      switch (m) {
        case 'bars': drawBars(ctx, audio, w, h); break;
        case 'wave': drawWave(ctx, audio, w, h); break;
        case 'circles': drawCircles(ctx, audio, w, h, frameRef.current); break;
        case 'particles': drawParticles(ctx, audio, w, h, frameRef.current); break;
        case 'psychedelic': drawPsychedelic(ctx, audio, w, h, frameRef.current); break;
        case 'galaxy': drawGalaxy(ctx, audio, w, h, frameRef.current); break;
      }
    };

    draw();
    return () => {
      cancelAnimationFrame(animRef.current);
      window.removeEventListener('resize', resize);
    };
  }, [connected, mode]);

  return (
    <div ref={containerRef} style={{
      height: '100%', display: 'flex', flexDirection: 'column',
      background: fullscreen ? '#000' : 'var(--bg)',
    }}>
      {/* Header (hide in fullscreen) */}
      {!fullscreen && (
        <div style={{ padding: '48px 16px 4px', textAlign: 'center' }}>
          <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0 }}>Audio Visualizer</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: 12, margin: '2px 0 0' }}>
            {currentSong ? `${currentSong.title} — ${currentSong.artist}` : 'Play a song to see the magic'}
          </p>
        </div>
      )}

      {/* Mode selector */}
      <div style={{
        display: 'flex', justifyContent: 'center', gap: 6, padding: fullscreen ? '12px 8px' : '8px 8px',
        flexWrap: 'wrap', position: fullscreen ? 'absolute' : 'relative',
        top: fullscreen ? 8 : undefined, left: 0, right: 0, zIndex: 10,
        opacity: fullscreen ? 0.7 : 1, transition: 'opacity 0.3s',
      }}>
        {MODE_LABELS.map((label, i) => (
          <button
            key={label}
            onClick={() => setMode(i)}
            style={{
              padding: '5px 12px', borderRadius: 16, fontSize: 12, fontWeight: 500,
              background: mode === i ? (MODES[i] === 'psychedelic' ? 'linear-gradient(135deg,#e91e63,#9c27b0,#2196f3)' : 'var(--primary)') : 'rgba(255,255,255,0.08)',
              color: mode === i ? 'white' : 'var(--text-secondary)',
              transition: 'all 0.3s', border: 'none',
            }}
          >
            {label}
          </button>
        ))}
        <button
          onClick={toggleFullscreen}
          style={{
            padding: '5px 12px', borderRadius: 16, fontSize: 12,
            background: 'rgba(255,255,255,0.08)', color: 'var(--text-secondary)',
          }}
        >
          {fullscreen ? '⊠ Exit' : '⛶ Fullscreen'}
        </button>
      </div>

      {/* Canvas */}
      <div style={{ flex: 1, padding: fullscreen ? 0 : '0 8px 8px', position: 'relative' }}>
        <canvas
          ref={canvasRef}
          onClick={!connected ? connect : undefined}
          style={{
            width: '100%', height: '100%',
            borderRadius: fullscreen ? 0 : 16,
            background: 'radial-gradient(ellipse at center, #0d0d1a 0%, #050508 100%)',
            cursor: !connected ? 'pointer' : 'default',
            display: 'block',
          }}
        />
        {!connected && (
          <div
            onClick={connect}
            style={{
              position: 'absolute', inset: fullscreen ? 0 : 8,
              display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
              borderRadius: fullscreen ? 0 : 16,
            }}
          >
            <div style={{
              width: 100, height: 100, borderRadius: '50%',
              background: 'rgba(29,185,84,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center',
              marginBottom: 20, border: '2px solid var(--primary)',
              animation: 'pulseGlow 2s ease-in-out infinite',
            }}>
              <span style={{ fontSize: 42 }}>🎧</span>
            </div>
            <div style={{ color: 'var(--text-primary)', fontSize: 18, fontWeight: 600 }}>
              Tap to activate
            </div>
            <div style={{ color: 'var(--text-secondary)', fontSize: 13, marginTop: 6 }}>
              Play a song, then tap here
            </div>
            <style>{`@keyframes pulseGlow { 0%,100% { box-shadow: 0 0 20px rgba(29,185,84,0.2); transform: scale(1); } 50% { box-shadow: 0 0 40px rgba(29,185,84,0.4); transform: scale(1.05); } }`}</style>
          </div>
        )}
      </div>
    </div>
  );
}

// ========== IDLE ==========
function drawIdle(ctx, w, h, frame) {
  ctx.fillStyle = 'rgba(5,5,8,0.15)';
  ctx.fillRect(0, 0, w, h);
  const t = frame * 0.02;
  const cx = w / 2, cy = h / 2;
  for (let i = 0; i < 6; i++) {
    const r = 30 + i * 20 + Math.sin(t + i * 0.8) * 15;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.strokeStyle = `hsla(${140 + i * 10}, 70%, 50%, ${0.12 - i * 0.015})`;
    ctx.lineWidth = 1.5;
    ctx.stroke();
  }
}

// ========== BARS — Mirrored neon bars with reflection ==========
function drawBars(ctx, audio, w, h) {
  ctx.fillStyle = 'rgba(5,5,8,0.25)';
  ctx.fillRect(0, 0, w, h);
  const { freq, bass } = audio;
  const bars = 80;
  const totalW = w * 0.92;
  const barW = totalW / bars * 0.72;
  const gap = totalW / bars * 0.28;
  const startX = (w - totalW) / 2;

  for (let i = 0; i < bars; i++) {
    const idx = Math.floor((i / bars) * freq.length);
    const val = freq[idx] / 255;
    const maxH = h * 0.42;
    const barH = val * maxH + 1;
    const x = startX + i * (barW + gap);
    const hue = 160 + (i / bars) * 80 + bass * 40;

    // Top bar
    const grad = ctx.createLinearGradient(x, h / 2 - barH, x, h / 2);
    grad.addColorStop(0, `hsla(${hue}, 85%, 65%, ${0.9})`);
    grad.addColorStop(1, `hsla(${hue}, 85%, 45%, ${0.6})`);
    ctx.fillStyle = grad;
    ctx.fillRect(x, h / 2 - barH, barW, barH);

    // Reflection
    const rGrad = ctx.createLinearGradient(x, h / 2, x, h / 2 + barH * 0.5);
    rGrad.addColorStop(0, `hsla(${hue}, 85%, 45%, 0.3)`);
    rGrad.addColorStop(1, `hsla(${hue}, 85%, 30%, 0)`);
    ctx.fillStyle = rGrad;
    ctx.fillRect(x, h / 2, barW, barH * 0.5);

    // Peak dot
    if (val > 0.3) {
      ctx.fillStyle = `hsla(${hue}, 90%, 80%, ${val})`;
      ctx.shadowColor = `hsla(${hue}, 90%, 70%, 0.8)`;
      ctx.shadowBlur = 12;
      ctx.fillRect(x - 1, h / 2 - barH - 4, barW + 2, 3);
      ctx.shadowBlur = 0;
    }
  }

  // Center line glow
  ctx.shadowColor = `hsla(${180 + bass * 60}, 80%, 60%, 0.5)`;
  ctx.shadowBlur = 20;
  ctx.strokeStyle = `hsla(${180 + bass * 60}, 80%, 60%, 0.15)`;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(0, h / 2);
  ctx.lineTo(w, h / 2);
  ctx.stroke();
  ctx.shadowBlur = 0;
}

// ========== WAVE — Multi-layer oscilloscope ==========
function drawWave(ctx, audio, w, h) {
  ctx.fillStyle = 'rgba(5,5,8,0.2)';
  ctx.fillRect(0, 0, w, h);
  const { time, freq, bass, avg } = audio;

  // Background frequency heat
  for (let i = 0; i < 48; i++) {
    const idx = Math.floor((i / 48) * freq.length);
    const val = freq[idx] / 255;
    const barH = val * h * 0.6;
    ctx.fillStyle = `hsla(${200 + i * 3}, 70%, 40%, ${val * 0.08})`;
    ctx.fillRect(i * (w / 48), h / 2 - barH / 2, w / 48, barH);
  }

  // Wave layers
  for (let layer = 2; layer >= 0; layer--) {
    ctx.beginPath();
    const sliceW = w / time.length;
    for (let i = 0; i < time.length; i++) {
      const v = (time[i] / 128.0 - 1);
      const amp = 1 + layer * 0.3 + bass * 0.5;
      const y = h / 2 + v * h * 0.35 * amp + Math.sin(i * 0.02 + layer) * layer * 3;
      if (i === 0) ctx.moveTo(0, y);
      else ctx.lineTo(i * sliceW, y);
    }
    const hue = 140 + layer * 40;
    const alpha = 0.85 - layer * 0.2;
    ctx.strokeStyle = `hsla(${hue}, 85%, 60%, ${alpha})`;
    ctx.lineWidth = 3.5 - layer * 0.8;
    ctx.shadowColor = `hsla(${hue}, 85%, 60%, 0.6)`;
    ctx.shadowBlur = 15 - layer * 3;
    ctx.stroke();
    ctx.shadowBlur = 0;
  }

  // Floating dots on wave peaks
  for (let i = 0; i < time.length; i += 12) {
    const v = (time[i] / 128.0 - 1);
    if (Math.abs(v) > 0.3) {
      const y = h / 2 + v * h * 0.35;
      ctx.fillStyle = `hsla(160, 90%, 70%, ${Math.abs(v)})`;
      ctx.beginPath();
      ctx.arc(i * (w / time.length), y, 2 + Math.abs(v) * 3, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

// ========== CIRCLES — Pulsing audio-reactive rings ==========
function drawCircles(ctx, audio, w, h, frame) {
  ctx.fillStyle = 'rgba(5,5,8,0.12)';
  ctx.fillRect(0, 0, w, h);
  const { freq, bass, mid, treble, avg } = audio;
  const cx = w / 2, cy = h / 2;
  const t = frame * 0.015;

  // Rotating outer ring with frequency data
  const count = 128;
  for (let ring = 5; ring >= 0; ring--) {
    const baseR = 35 + ring * 30 + bass * 40;
    ctx.beginPath();
    for (let i = 0; i <= count; i++) {
      const angle = (i / count) * Math.PI * 2 + t * (0.3 + ring * 0.1) * (ring % 2 ? 1 : -1);
      const idx = Math.floor((i / count) * freq.length) % freq.length;
      const val = freq[idx] / 255;
      const r = baseR + val * (35 + ring * 8);
      const x = cx + Math.cos(angle) * r;
      const y = cy + Math.sin(angle) * r;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.closePath();
    const hue = 140 + ring * 30 + bass * 60;
    ctx.strokeStyle = `hsla(${hue}, 80%, 55%, ${0.55 - ring * 0.07})`;
    ctx.lineWidth = 2.5 - ring * 0.3;
    ctx.shadowColor = `hsla(${hue}, 80%, 55%, 0.4)`;
    ctx.shadowBlur = 18;
    ctx.stroke();
    ctx.shadowBlur = 0;
  }

  // Center pulsing orb
  const pulseR = 25 + avg * 30 + Math.sin(t * 2) * 5;
  const orbGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, pulseR);
  orbGrad.addColorStop(0, `hsla(${160 + bass * 80}, 90%, 70%, ${0.5 + avg * 0.4})`);
  orbGrad.addColorStop(0.5, `hsla(${160 + bass * 80}, 80%, 50%, ${0.2 + avg * 0.2})`);
  orbGrad.addColorStop(1, 'transparent');
  ctx.fillStyle = orbGrad;
  ctx.beginPath();
  ctx.arc(cx, cy, pulseR, 0, Math.PI * 2);
  ctx.fill();

  // Treble sparks
  for (let i = 0; i < 20; i++) {
    const angle = (i / 20) * Math.PI * 2 + t;
    const sparkR = 30 + treble * 120 + Math.sin(t * 3 + i) * 15;
    const x = cx + Math.cos(angle) * sparkR;
    const y = cy + Math.sin(angle) * sparkR;
    const size = 1.5 + treble * 3;
    ctx.fillStyle = `hsla(${50 + i * 15}, 90%, 70%, ${treble * 0.8})`;
    ctx.beginPath();
    ctx.arc(x, y, size, 0, Math.PI * 2);
    ctx.fill();
  }
}

// ========== PARTICLES — Explosive audio-reactive particles ==========
function drawParticles(ctx, audio, w, h, frame) {
  ctx.fillStyle = 'rgba(5,5,8,0.08)'; // heavy trail
  ctx.fillRect(0, 0, w, h);
  const { freq, bass, avg, treble } = audio;

  const ps = window.__vizP || [];
  const maxP = 300;

  // Spawn based on bass hits
  const spawnCount = Math.floor(bass * 8 + avg * 3);
  for (let i = 0; i < spawnCount && ps.length < maxP; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = 1.5 + bass * 6 + Math.random() * 2;
    ps.push({
      x: w / 2 + (Math.random() - 0.5) * 30,
      y: h / 2 + (Math.random() - 0.5) * 30,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      life: 1,
      maxLife: 1,
      size: 1.5 + Math.random() * 4 + bass * 5,
      hue: 120 + Math.random() * 100 + treble * 80,
    });
  }

  // Update and draw
  for (let i = ps.length - 1; i >= 0; i--) {
    const p = ps[i];
    p.x += p.vx;
    p.y += p.vy;
    p.vx *= 0.993;
    p.vy *= 0.993;
    p.vy += 0.02; // slight gravity
    p.life -= 0.006 + avg * 0.004;
    p.size *= 0.997;

    if (p.life <= 0) { ps.splice(i, 1); continue; }

    const alpha = p.life * 0.9;
    const glow = p.life * p.size * 0.8;

    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
    ctx.fillStyle = `hsla(${p.hue}, 85%, 60%, ${alpha})`;
    ctx.shadowColor = `hsla(${p.hue}, 85%, 60%, ${alpha * 0.5})`;
    ctx.shadowBlur = glow;
    ctx.fill();
    ctx.shadowBlur = 0;

    // Connection lines between close particles
    if (i % 3 === 0 && i > 0) {
      const other = ps[i - 1];
      const dx = p.x - other.x, dy = p.y - other.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < 60) {
        ctx.beginPath();
        ctx.moveTo(p.x, p.y);
        ctx.lineTo(other.x, other.y);
        ctx.strokeStyle = `hsla(${p.hue}, 70%, 50%, ${(1 - dist / 60) * 0.15})`;
        ctx.lineWidth = 0.5;
        ctx.stroke();
      }
    }
  }

  window.__vizP = ps;

  // Center energy orb
  const gr = ctx.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, 50 + bass * 60);
  gr.addColorStop(0, `rgba(29,185,84,${bass * 0.35})`);
  gr.addColorStop(1, 'transparent');
  ctx.fillStyle = gr;
  ctx.fillRect(0, 0, w, h);
}

// ========== PSYCHEDELIC — Fractal spirals, kaleidoscope, color cycling ==========
function drawPsychedelic(ctx, audio, w, h, frame) {
  // Slow fade for trails
  ctx.fillStyle = 'rgba(5,5,8,0.06)';
  ctx.fillRect(0, 0, w, h);

  const { freq, bass, mid, treble, avg } = audio;
  const cx = w / 2, cy = h / 2;
  const t = frame * 0.008;
  const segments = 8; // kaleidoscope segments

  ctx.save();
  ctx.translate(cx, cy);

  // === Kaleidoscope fractal spirals ===
  for (let seg = 0; seg < segments; seg++) {
    ctx.save();
    ctx.rotate((seg / segments) * Math.PI * 2);
    if (seg % 2 === 1) ctx.scale(1, -1); // mirror every other segment

    // Spiral arms
    for (let arm = 0; arm < 3; arm++) {
      ctx.beginPath();
      const armOffset = arm * (Math.PI * 2 / 3);
      for (let i = 0; i < 80; i++) {
        const ratio = i / 80;
        const angle = ratio * Math.PI * 4 + t * (2 + bass * 3) + armOffset;
        const r = ratio * (120 + bass * 80 + mid * 40);
        const freqIdx = Math.floor(ratio * freq.length) % freq.length;
        const freqVal = freq[freqIdx] / 255;
        const wobble = Math.sin(ratio * 12 + t * 5) * freqVal * 15;
        const x = Math.cos(angle) * (r + wobble);
        const y = Math.sin(angle) * (r + wobble);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      const hue = (frame * 0.5 + arm * 120 + seg * 45) % 360;
      ctx.strokeStyle = `hsla(${hue}, 90%, 60%, ${0.4 + avg * 0.4})`;
      ctx.lineWidth = 1.5 + bass * 2;
      ctx.shadowColor = `hsla(${hue}, 90%, 60%, 0.6)`;
      ctx.shadowBlur = 12 + bass * 10;
      ctx.stroke();
      ctx.shadowBlur = 0;
    }

    ctx.restore();
  }

  // === Breathing mandala rings ===
  for (let ring = 0; ring < 5; ring++) {
    const ringR = 30 + ring * 35 + Math.sin(t * 1.5 + ring) * 15 + bass * 30;
    const points = 6 + ring * 2;
    ctx.beginPath();
    for (let i = 0; i <= points; i++) {
      const angle = (i / points) * Math.PI * 2 + t * (ring % 2 ? 0.5 : -0.5);
      const freqIdx = Math.floor((i / points) * freq.length) % freq.length;
      const val = freq[freqIdx] / 255;
      const r = ringR + val * 25 + Math.sin(angle * 3 + t * 2) * 10;
      const x = Math.cos(angle) * r;
      const y = Math.sin(angle) * r;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.closePath();
    const hue = (frame * 0.8 + ring * 72) % 360;
    ctx.strokeStyle = `hsla(${hue}, 85%, 55%, ${0.35 - ring * 0.05})`;
    ctx.lineWidth = 2 + bass;
    ctx.shadowColor = `hsla(${hue}, 85%, 55%, 0.5)`;
    ctx.shadowBlur = 15;
    ctx.stroke();
    ctx.shadowBlur = 0;
  }

  // === Petal blooms on beat ===
  if (bass > 0.5) {
    const petals = 12;
    for (let i = 0; i < petals; i++) {
      const angle = (i / petals) * Math.PI * 2 + t;
      const r = 60 + bass * 100;
      const x = Math.cos(angle) * r;
      const y = Math.sin(angle) * r;
      const size = 4 + bass * 10;
      const hue = (frame + i * 30) % 360;
      ctx.fillStyle = `hsla(${hue}, 90%, 65%, ${(bass - 0.5) * 1.5})`;
      ctx.shadowColor = `hsla(${hue}, 90%, 65%, 0.6)`;
      ctx.shadowBlur = 20;
      ctx.beginPath();
      ctx.arc(x, y, size, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
    }
  }

  ctx.restore();

  // === Outer color-shifting vignette ===
  const vHue = (frame * 0.3) % 360;
  const vGrad = ctx.createRadialGradient(cx, cy, Math.min(w, h) * 0.2, cx, cy, Math.max(w, h) * 0.7);
  vGrad.addColorStop(0, 'transparent');
  vGrad.addColorStop(1, `hsla(${vHue}, 70%, 15%, ${0.3 + avg * 0.3})`);
  ctx.fillStyle = vGrad;
  ctx.fillRect(0, 0, w, h);

  // === Corner diamond sparkles ===
  const sparkles = Math.floor(treble * 15);
  for (let i = 0; i < sparkles; i++) {
    const sx = Math.random() * w;
    const sy = Math.random() * h;
    const ss = 1 + Math.random() * 3;
    const hue = (frame + Math.random() * 180) % 360;
    ctx.fillStyle = `hsla(${hue}, 90%, 80%, ${0.4 + Math.random() * 0.4})`;
    ctx.save();
    ctx.translate(sx, sy);
    ctx.rotate(Math.random() * Math.PI);
    ctx.fillRect(-ss / 2, -ss / 2, ss, ss);
    ctx.restore();
  }
}

// ========== GALAXY — Swirling star field ==========
function drawGalaxy(ctx, audio, w, h, frame) {
  ctx.fillStyle = 'rgba(3,3,8,0.05)';
  ctx.fillRect(0, 0, w, h);

  const { freq, bass, mid, treble, avg } = audio;
  const cx = w / 2, cy = h / 2;
  const t = frame * 0.003;

  const stars = window.__vizStars || [];
  const maxStars = 400;

  // Spawn stars
  const spawn = Math.floor(2 + avg * 6);
  for (let i = 0; i < spawn && stars.length < maxStars; i++) {
    const angle = Math.random() * Math.PI * 2;
    const dist = 5 + Math.random() * 20;
    stars.push({
      angle, dist, speed: 0.002 + Math.random() * 0.004 + bass * 0.003,
      drift: 0.3 + Math.random() * 0.8 + bass * 0.5,
      size: 0.5 + Math.random() * 2,
      hue: 200 + Math.random() * 160,
      life: 1,
      arm: Math.floor(Math.random() * 4),
    });
  }

  // Draw nebula clouds
  for (let i = 0; i < 3; i++) {
    const nAngle = t * 0.5 + i * (Math.PI * 2 / 3);
    const nR = 80 + mid * 60;
    const nx = cx + Math.cos(nAngle) * nR;
    const ny = cy + Math.sin(nAngle) * nR;
    const ng = ctx.createRadialGradient(nx, ny, 0, nx, ny, 60 + bass * 40);
    const nHue = (frame * 0.2 + i * 120) % 360;
    ng.addColorStop(0, `hsla(${nHue}, 70%, 50%, ${0.06 + avg * 0.06})`);
    ng.addColorStop(1, 'transparent');
    ctx.fillStyle = ng;
    ctx.fillRect(0, 0, w, h);
  }

  // Update and draw stars
  for (let i = stars.length - 1; i >= 0; i--) {
    const s = stars[i];
    s.angle += s.speed;
    s.dist += s.drift;
    s.life -= 0.002;
    s.size += 0.003;

    // Spiral arm offset
    const armAngle = s.angle + s.arm * (Math.PI / 2) + Math.sin(s.dist * 0.01) * 0.5;
    const x = cx + Math.cos(armAngle + t) * s.dist;
    const y = cy + Math.sin(armAngle + t) * s.dist;

    if (s.life <= 0 || x < -20 || x > w + 20 || y < -20 || y > h + 20) {
      stars.splice(i, 1);
      continue;
    }

    const alpha = s.life * 0.8;
    const twinkle = 0.7 + Math.sin(frame * 0.1 + i) * 0.3;
    ctx.beginPath();
    ctx.arc(x, y, s.size * twinkle, 0, Math.PI * 2);
    ctx.fillStyle = `hsla(${s.hue}, 80%, 75%, ${alpha * twinkle})`;
    ctx.shadowColor = `hsla(${s.hue}, 80%, 75%, ${alpha * 0.3})`;
    ctx.shadowBlur = s.size * 4;
    ctx.fill();
    ctx.shadowBlur = 0;
  }

  window.__vizStars = stars;

  // Core galaxy glow
  const coreR = 20 + bass * 35;
  const coreGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, coreR);
  coreGrad.addColorStop(0, `hsla(${(frame * 0.4) % 360}, 80%, 80%, ${0.4 + bass * 0.4})`);
  coreGrad.addColorStop(0.4, `hsla(${(frame * 0.4 + 30) % 360}, 80%, 60%, ${0.15 + avg * 0.15})`);
  coreGrad.addColorStop(1, 'transparent');
  ctx.fillStyle = coreGrad;
  ctx.beginPath();
  ctx.arc(cx, cy, coreR, 0, Math.PI * 2);
  ctx.fill();
}
