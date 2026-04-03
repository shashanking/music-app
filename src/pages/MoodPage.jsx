import { useState, useMemo } from 'react';
import { usePlayer } from '../contexts/PlayerContext';
import { useToast } from '../contexts/ToastContext';
import SongTile from '../components/SongTile';

const MOODS = [
  {
    id: 'romantic',
    label: 'Romantic',
    emoji: '💕',
    gradient: 'linear-gradient(135deg, #e91e63, #9c27b0)',
    bg: 'rgba(233,30,99,0.12)',
    keywords: ['love', 'tum', 'dil', 'pyaar', 'ishq', 'saath', 'perfect', 'someone', 'thinking', 'photograph', 'agar', 'tere', 'mereya', 'humsafar', 'nasha', 'ho', 'bana'],
  },
  {
    id: 'party',
    label: 'Party',
    emoji: '🎉',
    gradient: 'linear-gradient(135deg, #ff6b35, #f7c948)',
    bg: 'rgba(255,107,53,0.12)',
    keywords: ['dance', 'party', 'funk', 'uptown', 'jhoome', 'besharam', 'levitating', 'monkey', 'chaiyya', 'kajra', 'rang', 'rock', 'energy', 'closer', 'sugar', 'bad'],
  },
  {
    id: 'chill',
    label: 'Chill',
    emoji: '😌',
    gradient: 'linear-gradient(135deg, #00bcd4, #2196f3)',
    bg: 'rgba(0,188,212,0.12)',
    keywords: ['circles', 'stay', 'drivers', 'raataan', 'lambiyan', 'enna', 'sona', 'tere bina', 'waves', 'sunflower', 'let her go', 'shape', 'blinding', 'starboy', 'ilahi'],
  },
  {
    id: 'sad',
    label: 'Sad',
    emoji: '😢',
    gradient: 'linear-gradient(135deg, #5c6bc0, #3949ab)',
    bg: 'rgba(92,107,192,0.12)',
    keywords: ['alvida', 'rolling', 'someone like', 'channa', 'agar tum', 'bedardeya', 'soch na sake', 'kabira', 'anti-hero', 'tum hi ho', 'phir', 'deep', 'kal ho', 'hero'],
  },
  {
    id: 'workout',
    label: 'Workout',
    emoji: '💪',
    gradient: 'linear-gradient(135deg, #f44336, #ff5722)',
    bg: 'rgba(244,67,54,0.12)',
    keywords: ['uptown', 'jhoome', 'chaiyya', 'besharam', 'levitating', 'dance', 'funk', 'monkey', 'bad guy', 'energy', 'bohemian', 'rang de', 'chaleya', 'pasoori', 'maan meri'],
  },
  {
    id: 'retro',
    label: '90s Vibes',
    emoji: '📼',
    gradient: 'linear-gradient(135deg, #795548, #ff9800)',
    bg: 'rgba(121,85,72,0.12)',
    keywords: ['tujhe dekha', 'pehla', 'kuch kuch', 'ek ladki', 'dil to pagal', 'taal', 'humsafar', 'tu mile', 'dil chahta', 'sandese', 'bohemian', 'queen'],
  },
];

export default function MoodPage({ allSongs }) {
  const [activeMood, setActiveMood] = useState(null);
  const { playSong } = usePlayer();
  const { showToast } = useToast();

  const moodSongs = useMemo(() => {
    if (!activeMood || !allSongs.length) return [];
    const mood = MOODS.find(m => m.id === activeMood);
    if (!mood) return [];

    // Score each song by keyword matches
    const scored = allSongs.map(song => {
      const text = `${song.title} ${song.artist} ${song.album}`.toLowerCase();
      let score = 0;
      for (const kw of mood.keywords) {
        if (text.includes(kw.toLowerCase())) score += 1;
      }
      return { song, score };
    });

    // Songs with matches first, then random fill
    const matched = scored.filter(s => s.score > 0).sort((a, b) => b.score - a.score).map(s => s.song);
    const unmatched = scored.filter(s => s.score === 0).map(s => s.song).sort(() => Math.random() - 0.5);
    const result = [...matched, ...unmatched].slice(0, 20);
    return result;
  }, [activeMood, allSongs]);

  const activeMoodData = MOODS.find(m => m.id === activeMood);

  return (
    <div style={{ height: '100%', overflowY: 'auto', paddingBottom: 100 }}>
      {/* Header */}
      <div style={{
        padding: 'max(48px, calc(env(safe-area-inset-top, 20px) + 16px)) 24px 24px',
        background: activeMoodData
          ? `${activeMoodData.gradient.replace('linear-gradient(135deg,', 'linear-gradient(180deg,').replace(')', ', transparent)')}`
          : 'linear-gradient(180deg, rgba(29,185,84,0.2) 0%, var(--bg) 100%)',
        transition: 'background 0.5s',
      }}>
        <h1 style={{ fontSize: 28, fontWeight: 700, margin: 0 }}>
          {activeMoodData ? `${activeMoodData.emoji} ${activeMoodData.label} Vibes` : 'Pick Your Mood'}
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: 13, margin: '4px 0 0' }}>
          {activeMoodData ? `${moodSongs.length} songs curated for you` : 'What are you feeling right now?'}
        </p>
      </div>

      {/* Mood grid */}
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12,
        padding: '16px 16px 8px',
      }}>
        {MOODS.map(mood => (
          <button
            key={mood.id}
            onClick={() => {
              const next = activeMood === mood.id ? null : mood.id;
              setActiveMood(next);
              if (next) showToast(`${mood.emoji} ${mood.label} vibes activated`, 'music', 2000);
            }}
            style={{
              padding: '20px 12px', borderRadius: 16, textAlign: 'center',
              background: activeMood === mood.id ? mood.gradient : mood.bg,
              border: activeMood === mood.id ? 'none' : '1px solid rgba(255,255,255,0.05)',
              transition: 'all 0.3s',
              transform: activeMood === mood.id ? 'scale(1.02)' : 'scale(1)',
            }}
          >
            <div style={{ fontSize: 32, marginBottom: 6 }}>{mood.emoji}</div>
            <div style={{
              fontSize: 14, fontWeight: 600,
              color: activeMood === mood.id ? 'white' : 'var(--text-primary)',
            }}>
              {mood.label}
            </div>
          </button>
        ))}
      </div>

      {/* Play All / Shuffle for mood */}
      {activeMoodData && moodSongs.length > 0 && (
        <div style={{ display: 'flex', gap: 12, padding: '8px 16px 0' }}>
          <button
            onClick={() => playSong(moodSongs[0], moodSongs)}
            style={{
              flex: 1, padding: '12px', borderRadius: 12, fontWeight: 600, fontSize: 14,
              background: activeMoodData.gradient, color: 'white',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            }}
          >
            ▶ Play {activeMoodData.label}
          </button>
          <button
            onClick={() => {
              const shuffled = [...moodSongs].sort(() => Math.random() - 0.5);
              playSong(shuffled[0], shuffled);
            }}
            style={{
              padding: '12px 20px', borderRadius: 12, fontWeight: 600, fontSize: 14,
              background: 'var(--surface-light)', color: 'var(--text-primary)',
            }}
          >
            🔀
          </button>
        </div>
      )}

      {/* Song list */}
      {activeMoodData && (
        <div style={{ marginTop: 8 }}>
          {moodSongs.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-secondary)' }}>
              Loading songs...
            </div>
          ) : (
            moodSongs.map((song, i) => (
              <SongTile key={song.id} song={song} queue={moodSongs} index={i} showIndex />
            ))
          )}
        </div>
      )}

      {/* Empty state when no mood selected */}
      {!activeMoodData && (
        <div style={{ textAlign: 'center', padding: '40px 24px', color: 'var(--text-secondary)' }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>🎭</div>
          <div style={{ fontSize: 16, fontWeight: 500 }}>Choose a mood above</div>
          <div style={{ fontSize: 13, marginTop: 4 }}>We'll create the perfect playlist for you</div>
        </div>
      )}
    </div>
  );
}
