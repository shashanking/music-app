import { useState } from 'react';
import { PlayerProvider } from './contexts/PlayerContext';
import { PlaylistProvider } from './contexts/PlaylistContext';
import { useMusicApi } from './hooks/useMusicApi';
import PlayerBar from './components/PlayerBar';
import NowPlaying from './components/NowPlaying';
import HomePage from './pages/HomePage';
import SearchPage from './pages/SearchPage';
import PlaylistPage from './pages/PlaylistPage';

const TABS = [
  { id: 'home', label: 'Home', icon: '🏠' },
  { id: 'search', label: 'Search', icon: '🔍' },
  { id: 'playlists', label: 'Playlists', icon: '🎵' },
];

function AppContent() {
  const [tab, setTab] = useState('home');
  const [showNowPlaying, setShowNowPlaying] = useState(false);
  const musicApi = useMusicApi();

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Page content */}
      <div style={{ flex: 1, overflow: 'hidden' }}>
        {tab === 'home' && (
          <HomePage
            categories={musicApi.categories}
            allSongs={musicApi.allSongs}
            loading={musicApi.loading}
            error={musicApi.error}
            retry={musicApi.loadSongs}
          />
        )}
        {tab === 'search' && (
          <SearchPage
            searchResults={musicApi.searchResults}
            searching={musicApi.searching}
            searchSongs={musicApi.searchSongs}
          />
        )}
        {tab === 'playlists' && <PlaylistPage />}
      </div>

      {/* Player bar */}
      <PlayerBar onExpand={() => setShowNowPlaying(true)} />

      {/* Bottom nav */}
      <nav className="bottom-nav" style={{
        display: 'flex', background: 'var(--surface)',
        borderTop: '1px solid rgba(255,255,255,0.05)',
      }}>
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            style={{
              flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center',
              padding: '10px 0 8px', gap: 2, transition: 'color 0.2s',
              color: tab === t.id ? 'var(--primary)' : 'var(--text-secondary)',
            }}
          >
            <span style={{ fontSize: 20 }}>{t.icon}</span>
            <span style={{ fontSize: 11, fontWeight: tab === t.id ? 600 : 400 }}>{t.label}</span>
          </button>
        ))}
      </nav>

      {/* Now Playing overlay */}
      {showNowPlaying && <NowPlaying onClose={() => setShowNowPlaying(false)} />}
    </div>
  );
}

export default function App() {
  return (
    <PlayerProvider>
      <PlaylistProvider>
        <AppContent />
      </PlaylistProvider>
    </PlayerProvider>
  );
}
