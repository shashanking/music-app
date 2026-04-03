import { useRef, useEffect } from 'react';
import { usePlayer } from '../contexts/PlayerContext';

/**
 * Reusable visualizer canvas. Renders audio-reactive graphics.
 * Props:
 *   mode: 'bars' | 'wave' | 'circles' | 'particles' | 'galaxy' (default 'bars')
 *   style: extra CSS for the canvas wrapper
 *   opacity: global alpha multiplier (0-1)
 */
export default function VisCanvas({ mode = 'bars', style = {}, opacity = 1 }) {
  const { analyserRef, isPlaying } = usePlayer();
  const canvasRef = useRef(null);
  const animRef = useRef(null);
  const frameRef = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let prevW = 0, prevH = 0;

    const resize = () => {
      const dpr = window.devicePixelRatio || 1;
      const w = canvas.offsetWidth, h = canvas.offsetHeight;
      if (w === prevW && h === prevH) return;
      prevW = w; prevH = h;
      canvas.width = w * dpr; canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    const getAudio = () => {
      const a = analyserRef?.current;
      if (!a) return null;
      const freq = new Uint8Array(a.frequencyBinCount);
      const time = new Uint8Array(a.fftSize);
      a.getByteFrequencyData(freq);
      a.getByteTimeDomainData(time);
      let bass = 0, mid = 0, treble = 0, avg = 0;
      const len = freq.length;
      for (let i = 0; i < len; i++) {
        const v = freq[i]; avg += v;
        if (i < len * 0.15) bass += v;
        else if (i < len * 0.5) mid += v;
        else treble += v;
      }
      return { freq, time, bass: bass / (len * 0.15 * 255), mid: mid / (len * 0.35 * 255), treble: treble / (len * 0.5 * 255), avg: avg / (len * 255) };
    };

    const draw = () => {
      animRef.current = requestAnimationFrame(draw);
      resize();
      frameRef.current++;
      const w = canvas.offsetWidth, h = canvas.offsetHeight;
      if (w === 0 || h === 0) return;
      const audio = getAudio();
      ctx.globalAlpha = opacity;
      if (!audio) { drawIdle(ctx, w, h, frameRef.current); return; }
      switch (mode) {
        case 'bars': drawBars(ctx, audio, w, h); break;
        case 'wave': drawWave(ctx, audio, w, h); break;
        case 'circles': drawCircles(ctx, audio, w, h, frameRef.current); break;
        case 'particles': drawParticles(ctx, audio, w, h, frameRef.current); break;
        case 'galaxy': drawGalaxy(ctx, audio, w, h, frameRef.current); break;
        default: drawBars(ctx, audio, w, h);
      }
      ctx.globalAlpha = 1;
    };
    draw();
    return () => { cancelAnimationFrame(animRef.current); ro.disconnect(); };
  }, [mode, opacity, analyserRef]);

  return <canvas ref={canvasRef} style={{ width: '100%', height: '100%', display: 'block', ...style }} />;
}

// ── Drawing functions ──

function drawIdle(ctx, w, h, f) {
  ctx.fillStyle = 'rgba(0,0,0,0.15)'; ctx.fillRect(0, 0, w, h);
  const t = f * 0.02, cx = w / 2, cy = h / 2;
  for (let i = 0; i < 5; i++) {
    const r = 25 + i * 18 + Math.sin(t + i) * 10;
    ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.strokeStyle = `hsla(${140 + i * 10}, 70%, 50%, ${0.1 - i * 0.015})`; ctx.lineWidth = 1.5; ctx.stroke();
  }
}

function drawBars(ctx, a, w, h) {
  ctx.fillStyle = 'rgba(0,0,0,0.25)'; ctx.fillRect(0, 0, w, h);
  const { freq, bass } = a; const bars = Math.min(80, Math.floor(w / 6));
  const totalW = w * 0.92, barW = totalW / bars * 0.72, gap = totalW / bars * 0.28, startX = (w - totalW) / 2;
  for (let i = 0; i < bars; i++) {
    const val = freq[Math.floor((i / bars) * freq.length)] / 255;
    const barH = val * h * 0.42 + 1, x = startX + i * (barW + gap);
    const hue = 160 + (i / bars) * 80 + bass * 40;
    const grad = ctx.createLinearGradient(x, h / 2 - barH, x, h / 2);
    grad.addColorStop(0, `hsla(${hue}, 85%, 65%, 0.9)`); grad.addColorStop(1, `hsla(${hue}, 85%, 45%, 0.6)`);
    ctx.fillStyle = grad; ctx.fillRect(x, h / 2 - barH, barW, barH);
    const rg = ctx.createLinearGradient(x, h / 2, x, h / 2 + barH * 0.5);
    rg.addColorStop(0, `hsla(${hue}, 85%, 45%, 0.3)`); rg.addColorStop(1, `hsla(${hue}, 85%, 30%, 0)`);
    ctx.fillStyle = rg; ctx.fillRect(x, h / 2, barW, barH * 0.5);
    if (val > 0.3) { ctx.fillStyle = `hsla(${hue}, 90%, 80%, ${val})`; ctx.shadowColor = `hsla(${hue}, 90%, 70%, 0.8)`; ctx.shadowBlur = 10; ctx.fillRect(x - 1, h / 2 - barH - 3, barW + 2, 2); ctx.shadowBlur = 0; }
  }
}

function drawWave(ctx, a, w, h) {
  ctx.fillStyle = 'rgba(0,0,0,0.2)'; ctx.fillRect(0, 0, w, h);
  const { time, freq, bass } = a;
  for (let i = 0; i < 48; i++) { const val = freq[Math.floor((i / 48) * freq.length)] / 255; ctx.fillStyle = `hsla(200, 70%, 40%, ${val * 0.06})`; ctx.fillRect(i * (w / 48), h / 2 - val * h * 0.3, w / 48, val * h * 0.6); }
  for (let layer = 2; layer >= 0; layer--) {
    ctx.beginPath(); const sw = w / time.length;
    for (let i = 0; i < time.length; i++) { const v = (time[i] / 128.0 - 1); const y = h / 2 + v * h * 0.35 * (1 + layer * 0.3 + bass * 0.5); i === 0 ? ctx.moveTo(0, y) : ctx.lineTo(i * sw, y); }
    const hue = 140 + layer * 40; ctx.strokeStyle = `hsla(${hue}, 85%, 60%, ${0.85 - layer * 0.2})`; ctx.lineWidth = 3 - layer * 0.7; ctx.shadowColor = `hsla(${hue}, 85%, 60%, 0.5)`; ctx.shadowBlur = 12; ctx.stroke(); ctx.shadowBlur = 0;
  }
}

function drawCircles(ctx, a, w, h, f) {
  ctx.fillStyle = 'rgba(0,0,0,0.12)'; ctx.fillRect(0, 0, w, h);
  const { freq, bass, treble, avg } = a; const cx = w / 2, cy = h / 2, t = f * 0.015;
  for (let ring = 5; ring >= 0; ring--) {
    const baseR = 25 + ring * 22 + bass * 30; ctx.beginPath();
    for (let i = 0; i <= 96; i++) { const angle = (i / 96) * Math.PI * 2 + t * (0.3 + ring * 0.1) * (ring % 2 ? 1 : -1); const val = freq[Math.floor((i / 96) * freq.length) % freq.length] / 255; const r = baseR + val * (25 + ring * 6); const x = cx + Math.cos(angle) * r; const y = cy + Math.sin(angle) * r; i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y); }
    ctx.closePath(); const hue = 140 + ring * 30 + bass * 60; ctx.strokeStyle = `hsla(${hue}, 80%, 55%, ${0.5 - ring * 0.06})`; ctx.lineWidth = 2; ctx.shadowColor = `hsla(${hue}, 80%, 55%, 0.3)`; ctx.shadowBlur = 12; ctx.stroke(); ctx.shadowBlur = 0;
  }
  const pr = 20 + avg * 25; const og = ctx.createRadialGradient(cx, cy, 0, cx, cy, pr); og.addColorStop(0, `hsla(${160 + bass * 80}, 90%, 70%, ${0.4 + avg * 0.3})`); og.addColorStop(1, 'transparent'); ctx.fillStyle = og; ctx.beginPath(); ctx.arc(cx, cy, pr, 0, Math.PI * 2); ctx.fill();
  for (let i = 0; i < 16; i++) { const angle = (i / 16) * Math.PI * 2 + t; const sr = 25 + treble * 100; ctx.fillStyle = `hsla(${50 + i * 20}, 90%, 70%, ${treble * 0.6})`; ctx.beginPath(); ctx.arc(cx + Math.cos(angle) * sr, cy + Math.sin(angle) * sr, 1.5 + treble * 2, 0, Math.PI * 2); ctx.fill(); }
}

function drawParticles(ctx, a, w, h, f) {
  ctx.fillStyle = 'rgba(0,0,0,0.06)'; ctx.fillRect(0, 0, w, h);
  const { bass, avg, treble } = a; const ps = window.__vizP || [];
  const spawn = Math.floor(bass * 6 + avg * 2);
  for (let i = 0; i < spawn && ps.length < 250; i++) { const angle = Math.random() * Math.PI * 2; const speed = 1.5 + bass * 5; ps.push({ x: w / 2, y: h / 2, vx: Math.cos(angle) * speed * (0.5 + Math.random()), vy: Math.sin(angle) * speed * (0.5 + Math.random()), life: 1, size: 1.5 + Math.random() * 3 + bass * 4, hue: 120 + Math.random() * 100 + treble * 60 }); }
  for (let i = ps.length - 1; i >= 0; i--) { const p = ps[i]; p.x += p.vx; p.y += p.vy; p.vx *= 0.993; p.vy *= 0.993; p.vy += 0.015; p.life -= 0.005 + avg * 0.003; p.size *= 0.997; if (p.life <= 0) { ps.splice(i, 1); continue; } ctx.beginPath(); ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2); ctx.fillStyle = `hsla(${p.hue}, 85%, 60%, ${p.life * 0.8})`; ctx.shadowColor = `hsla(${p.hue}, 85%, 60%, ${p.life * 0.3})`; ctx.shadowBlur = p.size * 3; ctx.fill(); ctx.shadowBlur = 0; }
  window.__vizP = ps;
  const gr = ctx.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, 40 + bass * 50); gr.addColorStop(0, `rgba(29,185,84,${bass * 0.3})`); gr.addColorStop(1, 'transparent'); ctx.fillStyle = gr; ctx.fillRect(0, 0, w, h);
}

function drawGalaxy(ctx, a, w, h, f) {
  ctx.fillStyle = 'rgba(0,0,0,0.04)'; ctx.fillRect(0, 0, w, h);
  const { bass, mid, avg } = a; const cx = w / 2, cy = h / 2, t = f * 0.003;
  const stars = window.__vizS || [];
  const spawn = Math.floor(2 + avg * 5);
  for (let i = 0; i < spawn && stars.length < 350; i++) { stars.push({ angle: Math.random() * Math.PI * 2, dist: 5 + Math.random() * 15, speed: 0.002 + Math.random() * 0.003 + bass * 0.002, drift: 0.3 + Math.random() * 0.7 + bass * 0.4, size: 0.5 + Math.random() * 1.5, hue: 200 + Math.random() * 160, life: 1, arm: Math.floor(Math.random() * 4) }); }
  for (let i = 0; i < 3; i++) { const na = t * 0.5 + i * (Math.PI * 2 / 3); const nr = 60 + mid * 50; const ng = ctx.createRadialGradient(cx + Math.cos(na) * nr, cy + Math.sin(na) * nr, 0, cx + Math.cos(na) * nr, cy + Math.sin(na) * nr, 50 + bass * 30); ng.addColorStop(0, `hsla(${(f * 0.2 + i * 120) % 360}, 70%, 50%, ${0.05 + avg * 0.05})`); ng.addColorStop(1, 'transparent'); ctx.fillStyle = ng; ctx.fillRect(0, 0, w, h); }
  for (let i = stars.length - 1; i >= 0; i--) { const s = stars[i]; s.angle += s.speed; s.dist += s.drift; s.life -= 0.002; const aa = s.angle + s.arm * (Math.PI / 2) + Math.sin(s.dist * 0.01) * 0.5; const x = cx + Math.cos(aa + t) * s.dist; const y = cy + Math.sin(aa + t) * s.dist; if (s.life <= 0 || x < -10 || x > w + 10 || y < -10 || y > h + 10) { stars.splice(i, 1); continue; } const tw = 0.7 + Math.sin(f * 0.1 + i) * 0.3; ctx.beginPath(); ctx.arc(x, y, s.size * tw, 0, Math.PI * 2); ctx.fillStyle = `hsla(${s.hue}, 80%, 75%, ${s.life * tw * 0.8})`; ctx.shadowColor = `hsla(${s.hue}, 80%, 75%, ${s.life * 0.2})`; ctx.shadowBlur = s.size * 3; ctx.fill(); ctx.shadowBlur = 0; }
  window.__vizS = stars;
  const cr = 15 + bass * 30; const cg = ctx.createRadialGradient(cx, cy, 0, cx, cy, cr); cg.addColorStop(0, `hsla(${(f * 0.4) % 360}, 80%, 80%, ${0.3 + bass * 0.3})`); cg.addColorStop(1, 'transparent'); ctx.fillStyle = cg; ctx.beginPath(); ctx.arc(cx, cy, cr, 0, Math.PI * 2); ctx.fill();
}
