import { useState } from 'react';
import { PlayerProvider } from './contexts/PlayerContext';
import { PlaylistProvider } from './contexts/PlaylistContext';
import { ToastProvider } from './contexts/ToastContext';
import { useMusicApi } from './hooks/useMusicApi';
import PlayerBar from './components/PlayerBar';
import NowPlaying from './components/NowPlaying';
import Visualizer from './components/Visualizer';
import HomePage from './pages/HomePage';
import SearchPage from './pages/SearchPage';
import PlaylistPage from './pages/PlaylistPage';
import GuessGamePage from './pages/GuessGamePage';
import MoodPage from './pages/MoodPage';

const TABS = [
  { id: 'home', label: 'Home', icon: '🏠' },
  { id: 'search', label: 'Search', icon: '🔍' },
  { id: 'mood', label: 'Mood', icon: '🎭' },
  { id: 'playlists', label: 'Library', icon: '📚' },
  { id: 'game', label: 'Game', icon: '🎮' },
  { id: 'visualizer', label: 'Visual', icon: '🎨' },
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
        {tab === 'mood' && <MoodPage allSongs={musicApi.allSongs} />}
        {tab === 'game' && <GuessGamePage allSongs={musicApi.allSongs} />}
        {tab === 'visualizer' && <Visualizer />}
      </div>

      {/* Player bar */}
      {tab !== 'visualizer' && <PlayerBar onExpand={() => setShowNowPlaying(true)} />}

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
              padding: '8px 0 6px', gap: 1, transition: 'color 0.2s',
              color: tab === t.id ? 'var(--primary)' : 'var(--text-secondary)',
            }}
          >
            <span style={{ fontSize: 18 }}>{t.icon}</span>
            <span style={{ fontSize: 10, fontWeight: tab === t.id ? 600 : 400 }}>{t.label}</span>
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
        <ToastProvider>
          <AppContent />
        </ToastProvider>
      </PlaylistProvider>
    </PlayerProvider>
  );
}
