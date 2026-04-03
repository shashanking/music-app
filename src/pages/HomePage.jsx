import { usePlayer } from '../contexts/PlayerContext';
import SongTile from '../components/SongTile';

const SECTIONS = [
  { key: 'bollywood90s', title: '90s Bollywood Classics', icon: '❤️' },
  { key: 'bollywood2000s', title: '2000s Bollywood', icon: '💿' },
  { key: 'bollywoodModern', title: 'Modern Bollywood (2010-2020)', icon: '🎵' },
  { key: 'bollywoodLatest', title: 'Latest Bollywood', icon: '🔥' },
  { key: 'hollywoodHits', title: 'Hollywood Classics', icon: '⭐' },
  { key: 'hollywoodPop', title: 'Hollywood Pop & Modern', icon: '🎧' },
];

export default function HomePage({ categories, allSongs, loading, error, retry }) {
  const { playSong } = usePlayer();

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: 16 }}>
        <div className="spinner" />
        <div style={{ color: 'var(--text-secondary)', fontSize: 16 }}>Loading full songs...</div>
        <div style={{ color: 'var(--text-secondary)', fontSize: 12 }}>Bollywood & Hollywood hits in 320kbps</div>
        <style>{`
          .spinner { width: 40px; height: 40px; border: 3px solid var(--surface-light); border-top-color: var(--primary); border-radius: 50%; animation: spin 0.8s linear infinite; }
          @keyframes spin { to { transform: rotate(360deg); } }
        `}</style>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: 16 }}>
        <div style={{ fontSize: 48 }}>📡</div>
        <div style={{ color: 'var(--text-secondary)' }}>{error}</div>
        <button onClick={retry} style={{ padding: '10px 24px', background: 'var(--primary)', color: 'white', borderRadius: 24, fontWeight: 600 }}>
          Retry
        </button>
      </div>
    );
  }

  return (
    <div style={{ height: '100%', overflowY: 'auto', paddingBottom: 100 }}>
      {/* Hero */}
      <div style={{
        padding: '48px 24px 32px',
        background: 'linear-gradient(180deg, rgba(29,185,84,0.3) 0%, var(--bg) 100%)',
      }}>
        <h1 style={{ fontSize: 28, fontWeight: 700, margin: 0 }}>Music Player</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: 13, margin: '4px 0 20px' }}>
          {allSongs.length} full songs &bull; Hindi & English &bull; 320kbps
        </p>
        <div style={{ display: 'flex', gap: 12 }}>
          <button
            onClick={() => allSongs.length && playSong(allSongs[0], allSongs)}
            style={{
              padding: '10px 24px', background: 'var(--primary)', color: 'white',
              borderRadius: 24, fontWeight: 600, fontSize: 14, display: 'flex', alignItems: 'center', gap: 6,
            }}
          >
            ▶ Play All
          </button>
          <button
            onClick={() => {
              const shuffled = [...allSongs].sort(() => Math.random() - 0.5);
              shuffled.length && playSong(shuffled[0], shuffled);
            }}
            style={{
              padding: '10px 24px', border: '1px solid var(--text-secondary)', color: 'var(--text-primary)',
              borderRadius: 24, fontWeight: 600, fontSize: 14, display: 'flex', alignItems: 'center', gap: 6,
            }}
          >
            🔀 Shuffle
          </button>
        </div>
      </div>

      {/* Song sections */}
      {SECTIONS.map(({ key, title, icon }) => {
        const songs = categories[key];
        if (!songs || !songs.length) return null;
        return (
          <div key={key} style={{ marginTop: 16 }}>
            <div style={{ padding: '8px 16px', display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 18 }}>{icon}</span>
              <h2 style={{ fontSize: 18, fontWeight: 700, margin: 0 }}>{title} ({songs.length})</h2>
            </div>
            {songs.map((song, i) => (
              <SongTile key={song.id} song={song} queue={songs} index={i} showIndex />
            ))}
          </div>
        );
      })}
    </div>
  );
}
