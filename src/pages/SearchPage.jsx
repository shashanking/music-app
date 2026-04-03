import { useState } from 'react';
import SongTile from '../components/SongTile';

const CHIPS = [
  'Arijit Singh', 'Atif Aslam', 'Shreya Ghoshal', 'AR Rahman', 'Pritam',
  'Neha Kakkar', 'Taylor Swift', 'Ed Sheeran', 'The Weeknd', 'Adele',
  'Lata Mangeshkar', 'Kishore Kumar', 'Drake', 'Dua Lipa',
];

export default function SearchPage({ searchResults, searching, searchSongs }) {
  const [query, setQuery] = useState('');

  const handleChange = (val) => {
    setQuery(val);
    searchSongs(val);
  };

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Search input */}
      <div style={{ padding: '48px 16px 8px' }}>
        <div style={{
          display: 'flex', alignItems: 'center', background: 'var(--surface-light)',
          borderRadius: 12, padding: '0 14px', gap: 10,
        }}>
          <span style={{ color: 'var(--text-secondary)', fontSize: 18 }}>&#128269;</span>
          <input
            type="text" value={query} onChange={e => handleChange(e.target.value)}
            placeholder="Search Bollywood, Hollywood, any song..."
            style={{
              flex: 1, padding: '14px 0', background: 'none', border: 'none', outline: 'none',
              color: 'var(--text-primary)', fontSize: 15,
            }}
          />
          {query && (
            <button onClick={() => handleChange('')} style={{ color: 'var(--text-secondary)', fontSize: 18, padding: 4 }}>
              &#10005;
            </button>
          )}
        </div>
      </div>

      {/* Quick chips */}
      {!query && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, padding: '8px 16px' }}>
          {CHIPS.map(chip => (
            <button
              key={chip}
              onClick={() => handleChange(chip)}
              style={{
                padding: '6px 16px', background: 'var(--surface-light)', borderRadius: 20,
                color: 'var(--text-primary)', fontSize: 13,
              }}
            >
              {chip}
            </button>
          ))}
        </div>
      )}

      {/* Results */}
      <div style={{ flex: 1, overflowY: 'auto', paddingBottom: 100 }}>
        {searching ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}>
            <div className="spinner" />
            <style>{`.spinner { width: 32px; height: 32px; border: 3px solid var(--surface-light); border-top-color: var(--primary); border-radius: 50%; animation: spin 0.8s linear infinite; } @keyframes spin { to { transform: rotate(360deg); } }`}</style>
          </div>
        ) : !query ? (
          <div style={{ textAlign: 'center', padding: '60px 24px', color: 'var(--text-secondary)' }}>
            <div style={{ fontSize: 48, marginBottom: 16, opacity: 0.5 }}>&#128269;</div>
            <div style={{ fontSize: 18, fontWeight: 500, marginBottom: 8 }}>Search any song</div>
            <div style={{ fontSize: 13 }}>Search millions of Hindi & English songs</div>
          </div>
        ) : searchResults.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 24px', color: 'var(--text-secondary)' }}>
            <div style={{ fontSize: 48, marginBottom: 16, opacity: 0.5 }}>🎵</div>
            <div style={{ fontSize: 18, fontWeight: 500 }}>No results found</div>
            <div style={{ fontSize: 13, marginTop: 8 }}>Try a different search term</div>
          </div>
        ) : (
          searchResults.map((song, i) => (
            <SongTile key={song.id} song={song} queue={searchResults} index={i} showIndex />
          ))
        )}
      </div>
    </div>
  );
}
