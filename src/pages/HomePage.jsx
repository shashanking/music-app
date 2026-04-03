import { useState, useMemo, useRef, useEffect } from 'react';
import { usePlayer } from '../contexts/PlayerContext';
import { useToast } from '../contexts/ToastContext';
import { CATEGORY_CONFIG } from '../hooks/useMusicApi';
import SongTile from '../components/SongTile';

// Gradient palette for genre cards
const GRADIENTS = [
  'linear-gradient(135deg, #1DB954, #0d6b30)',
  'linear-gradient(135deg, #e91e63, #880e4f)',
  'linear-gradient(135deg, #9c27b0, #4a148c)',
  'linear-gradient(135deg, #2196f3, #0d47a1)',
  'linear-gradient(135deg, #ff6b35, #c62828)',
  'linear-gradient(135deg, #00bcd4, #006064)',
  'linear-gradient(135deg, #ff9800, #e65100)',
  'linear-gradient(135deg, #607d8b, #263238)',
  'linear-gradient(135deg, #f44336, #b71c1c)',
  'linear-gradient(135deg, #3f51b5, #1a237e)',
  'linear-gradient(135deg, #e040fb, #6a1b9a)',
  'linear-gradient(135deg, #ffd54f, #f57f17)',
  'linear-gradient(135deg, #26c6da, #00695c)',
  'linear-gradient(135deg, #8d6e63, #3e2723)',
  'linear-gradient(135deg, #7c4dff, #311b92)',
  'linear-gradient(135deg, #ff5252, #d50000)',
  'linear-gradient(135deg, #69f0ae, #00c853)',
];

export default function HomePage({ categories, allSongs, loading, error, retry }) {
  const { playSong, currentSong, isPlaying } = usePlayer();
  const { showToast } = useToast();
  const [expandedGenre, setExpandedGenre] = useState(null);

  // Random suggestion
  const suggestion = useMemo(() => {
    if (!allSongs.length) return null;
    return allSongs[Math.floor(Math.random() * allSongs.length)];
  }, [allSongs]);

  // AI Pick: random 8 songs with cover art for the featured row
  const aiPicks = useMemo(() => {
    if (!allSongs.length) return [];
    const shuffled = [...allSongs].sort(() => Math.random() - 0.5);
    return shuffled.filter(s => s.coverUrl).slice(0, 10);
  }, [allSongs]);

  // Recently from each genre (first song with cover)
  const genreCards = useMemo(() => {
    return CATEGORY_CONFIG.map((cfg, i) => {
      const songs = categories[cfg.key] || [];
      const covers = songs.filter(s => s.coverUrl).slice(0, 4);
      return { ...cfg, songs, covers, gradient: GRADIENTS[i % GRADIENTS.length] };
    }).filter(g => g.songs.length > 0);
  }, [categories]);

  if (loading) {
    return (
      <div style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        height: '100%', gap: 20, background: 'radial-gradient(ellipse at 50% 30%, rgba(29,185,84,0.08) 0%, transparent 70%)',
      }}>
        {/* Animated loading orb */}
        <div style={{ position: 'relative', width: 80, height: 80 }}>
          <div style={{
            position: 'absolute', inset: 0, borderRadius: '50%',
            border: '2px solid transparent', borderTopColor: 'var(--primary)',
            animation: 'spin 1s linear infinite',
          }} />
          <div style={{
            position: 'absolute', inset: 8, borderRadius: '50%',
            border: '2px solid transparent', borderTopColor: '#9c27b0',
            animation: 'spin 1.5s linear infinite reverse',
          }} />
          <div style={{
            position: 'absolute', inset: 16, borderRadius: '50%',
            border: '2px solid transparent', borderTopColor: '#2196f3',
            animation: 'spin 2s linear infinite',
          }} />
          <div style={{
            position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 24,
          }}>🎵</div>
        </div>
        <div style={{ color: 'var(--text-primary)', fontSize: 16, fontWeight: 600 }}>Curating your library...</div>
        <div style={{ color: 'var(--text-secondary)', fontSize: 12 }}>300+ songs across 17 genres worldwide</div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        height: '100%', gap: 16,
      }}>
        <div style={{ fontSize: 56, filter: 'grayscale(0.5)' }}>📡</div>
        <div style={{ color: 'var(--text-secondary)', fontSize: 15 }}>{error}</div>
        <button onClick={retry} style={{
          padding: '12px 32px', background: 'var(--primary)', color: 'white',
          borderRadius: 24, fontWeight: 600, fontSize: 14,
        }}>
          Retry
        </button>
      </div>
    );
  }

  return (
    <div style={{ height: '100%', overflowY: 'auto', paddingBottom: 100 }}>

      {/* ═══ HERO ═══ */}
      <div style={{
        position: 'relative', padding: 'max(56px, calc(env(safe-area-inset-top, 20px) + 20px)) 24px 28px', overflow: 'hidden',
      }}>
        {/* Animated gradient bg */}
        <div style={{
          position: 'absolute', inset: 0,
          background: 'linear-gradient(135deg, rgba(29,185,84,0.25) 0%, rgba(156,39,176,0.15) 50%, rgba(33,150,243,0.1) 100%)',
          animation: 'heroShift 8s ease-in-out infinite alternate',
        }} />
        {/* Floating orbs */}
        <div style={{
          position: 'absolute', width: 200, height: 200, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(29,185,84,0.2), transparent 70%)',
          top: -60, right: -40, animation: 'float 6s ease-in-out infinite',
        }} />
        <div style={{
          position: 'absolute', width: 150, height: 150, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(156,39,176,0.15), transparent 70%)',
          bottom: -30, left: -20, animation: 'float 8s ease-in-out infinite reverse',
        }} />

        <div style={{ position: 'relative', zIndex: 1 }}>
          {/* AI badge */}
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            padding: '4px 12px', borderRadius: 20,
            background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
            fontSize: 11, fontWeight: 600, color: 'var(--primary)', marginBottom: 12,
            backdropFilter: 'blur(8px)',
          }}>
            <span style={{
              width: 6, height: 6, borderRadius: '50%', background: 'var(--primary)',
              animation: 'pulse 2s ease-in-out infinite',
            }} />
            AI-DRIVEN MUSIC
          </div>

          <h1 style={{
            fontSize: 32, fontWeight: 800, margin: 0, lineHeight: 1.1,
            background: 'linear-gradient(135deg, #fff 0%, rgba(29,185,84,0.9) 100%)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
          }}>
            Your Universe<br/>of Sound
          </h1>

          <p style={{
            color: 'var(--text-secondary)', fontSize: 13, margin: '8px 0 20px',
            maxWidth: 320,
          }}>
            {allSongs.length} tracks &bull; 17 genres &bull; Curated for you
          </p>

          <div style={{ display: 'flex', gap: 10 }}>
            <button
              onClick={() => {
                const shuffled = [...allSongs].sort(() => Math.random() - 0.5);
                shuffled.length && playSong(shuffled[0], shuffled);
                showToast('Shuffling all songs', 'music', 2000);
              }}
              style={{
                padding: '12px 28px',
                background: 'linear-gradient(135deg, var(--primary), #17a44a)',
                color: 'white', borderRadius: 28, fontWeight: 700, fontSize: 14,
                display: 'flex', alignItems: 'center', gap: 8,
                boxShadow: '0 4px 20px rgba(29,185,84,0.4)',
                transition: 'transform 0.2s, box-shadow 0.2s',
              }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.03)'; e.currentTarget.style.boxShadow = '0 6px 28px rgba(29,185,84,0.5)'; }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.boxShadow = '0 4px 20px rgba(29,185,84,0.4)'; }}
            >
              ▶ Shuffle Play
            </button>
            <button
              onClick={() => allSongs.length && playSong(allSongs[0], allSongs)}
              style={{
                padding: '12px 28px',
                background: 'rgba(255,255,255,0.06)',
                border: '1px solid rgba(255,255,255,0.12)',
                color: 'var(--text-primary)', borderRadius: 28, fontWeight: 600, fontSize: 14,
                backdropFilter: 'blur(8px)',
                transition: 'background 0.2s',
              }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.12)'}
              onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.06)'}
            >
              Play All
            </button>
          </div>
        </div>
      </div>

      {/* ═══ NOW PLAYING MINI CARD ═══ */}
      {currentSong && (
        <div style={{ padding: '0 16px 8px' }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 14, padding: '12px 16px',
            borderRadius: 14,
            background: 'linear-gradient(135deg, rgba(29,185,84,0.1), rgba(156,39,176,0.05))',
            border: '1px solid rgba(29,185,84,0.15)',
          }}>
            <img src={currentSong.coverUrl} alt="" style={{
              width: 44, height: 44, borderRadius: 8, objectFit: 'cover',
              boxShadow: '0 2px 12px rgba(0,0,0,0.3)',
            }} onError={e => e.target.style.display = 'none'} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 11, color: 'var(--primary)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1 }}>
                {isPlaying ? '♪ Now Playing' : '⏸ Paused'}
              </div>
              <div style={{ fontSize: 14, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {currentSong.title}
              </div>
            </div>
            {isPlaying && (
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: 2, height: 18 }}>
                {[0,1,2,3].map(i => (
                  <div key={i} style={{
                    width: 3, background: 'var(--primary)', borderRadius: 2,
                    animation: `barBounce 0.5s ${i*0.1}s ease-in-out infinite alternate`,
                  }}/>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ═══ AI PICKS — horizontal scroll ═══ */}
      {aiPicks.length > 0 && (
        <div style={{ padding: '16px 0 8px' }}>
          <div style={{ padding: '0 16px 10px', display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{
              fontSize: 10, fontWeight: 700, color: '#000', background: 'var(--primary)',
              padding: '2px 8px', borderRadius: 4, letterSpacing: 0.5,
            }}>AI</span>
            <h2 style={{ fontSize: 18, fontWeight: 700, margin: 0 }}>Picked for You</h2>
          </div>
          <div style={{
            display: 'flex', gap: 14, overflowX: 'auto', padding: '0 16px 8px',
            scrollSnapType: 'x mandatory', WebkitOverflowScrolling: 'touch',
            scrollbarWidth: 'none', msOverflowStyle: 'none',
          }}>
            {aiPicks.map(song => (
              <div
                key={song.id}
                onClick={() => playSong(song, aiPicks)}
                style={{
                  minWidth: 140, scrollSnapAlign: 'start', cursor: 'pointer',
                  transition: 'transform 0.2s',
                }}
                onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.03)'}
                onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
              >
                <div style={{
                  width: '100%', aspectRatio: '1', borderRadius: 12, overflow: 'hidden',
                  position: 'relative', background: 'var(--surface-light)',
                  boxShadow: '0 4px 16px rgba(0,0,0,0.3)',
                }}>
                  <img src={song.coverUrl} alt="" loading="lazy" style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    onError={e => e.target.style.display = 'none'} />
                  {/* Play overlay */}
                  <div style={{
                    position: 'absolute', inset: 0,
                    background: 'linear-gradient(transparent 50%, rgba(0,0,0,0.7) 100%)',
                    display: 'flex', alignItems: 'flex-end', justifyContent: 'flex-end', padding: 8,
                    opacity: 0, transition: 'opacity 0.2s',
                  }}
                  onMouseEnter={e => e.currentTarget.style.opacity = 1}
                  onMouseLeave={e => e.currentTarget.style.opacity = 0}
                  >
                    <div style={{
                      width: 36, height: 36, borderRadius: '50%', background: 'var(--primary)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 16, color: 'white', boxShadow: '0 2px 8px rgba(29,185,84,0.5)',
                    }}>▶</div>
                  </div>
                </div>
                <div style={{ marginTop: 8 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', width: 140 }}>
                    {song.title}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text-secondary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', width: 140 }}>
                    {song.artist}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ═══ GENRE GRID — mosaic cards ═══ */}
      <div style={{ padding: '12px 16px 8px' }}>
        <h2 style={{ fontSize: 18, fontWeight: 700, margin: '0 0 12px' }}>Explore Genres</h2>
        <div className="genre-grid" style={{
          display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: 10,
        }}>
          {genreCards.map(g => (
            <div
              key={g.key}
              onClick={() => setExpandedGenre(expandedGenre === g.key ? null : g.key)}
              style={{
                borderRadius: 14, overflow: 'hidden', cursor: 'pointer',
                position: 'relative', height: 100,
                background: g.gradient,
                transition: 'transform 0.2s, box-shadow 0.2s',
                boxShadow: expandedGenre === g.key ? `0 4px 24px ${g.gradient.match(/#\w+/)?.[0]}44` : 'none',
                transform: expandedGenre === g.key ? 'scale(1.02)' : 'scale(1)',
              }}
            >
              {/* Cover mosaic bg */}
              <div style={{ position: 'absolute', right: -10, top: -10, display: 'flex', flexWrap: 'wrap', width: 90, gap: 2, opacity: 0.3, transform: 'rotate(8deg)' }}>
                {g.covers.map((s, i) => (
                  <img key={i} src={s.coverUrl} alt="" style={{ width: 40, height: 40, borderRadius: 4, objectFit: 'cover' }}
                    onError={e => e.target.style.display = 'none'} />
                ))}
              </div>
              {/* Content */}
              <div style={{ position: 'relative', zIndex: 1, padding: '14px 14px', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
                <span style={{ fontSize: 22, lineHeight: 1 }}>{g.icon}</span>
                <div style={{ fontSize: 14, fontWeight: 700, color: 'white', marginTop: 4 }}>{g.title}</div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.7)' }}>{g.songs.length} songs</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ═══ RANDOM SUGGESTION CARD ═══ */}
      {suggestion && (
        <div style={{ padding: '12px 16px' }}>
          <div
            onClick={() => { playSong(suggestion, allSongs); showToast(`Playing "${suggestion.title}"`, 'music', 2000); }}
            style={{
              borderRadius: 16, overflow: 'hidden', cursor: 'pointer',
              position: 'relative', height: 120,
              background: `linear-gradient(135deg, rgba(0,0,0,0.5), rgba(0,0,0,0.8)), url(${suggestion.coverUrl}) center/cover`,
              border: '1px solid rgba(255,255,255,0.08)',
              display: 'flex', alignItems: 'flex-end', padding: 16,
              transition: 'transform 0.2s',
            }}
            onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.01)'}
            onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
          >
            <div style={{
              position: 'absolute', top: 12, left: 14, display: 'inline-flex', alignItems: 'center', gap: 5,
              padding: '3px 10px', borderRadius: 12, background: 'rgba(29,185,84,0.2)', border: '1px solid rgba(29,185,84,0.3)',
              fontSize: 10, fontWeight: 700, color: 'var(--primary)', letterSpacing: 0.5,
            }}>
              <span style={{ width: 5, height: 5, borderRadius: '50%', background: 'var(--primary)', animation: 'pulse 2s infinite' }} />
              SUGGESTED FOR YOU
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 18, fontWeight: 800, color: '#fff', textShadow: '0 2px 8px rgba(0,0,0,0.6)' }}>{suggestion.title}</div>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)', marginTop: 2 }}>{suggestion.artist} &bull; {suggestion.album}</div>
            </div>
            <div style={{
              width: 44, height: 44, borderRadius: '50%', flexShrink: 0,
              background: 'linear-gradient(135deg, var(--primary), #17a44a)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 20, color: '#fff', boxShadow: '0 4px 16px rgba(29,185,84,0.4)',
            }}>▶</div>
          </div>
        </div>
      )}

      {/* ═══ GENRE OVERLAY ═══ */}
      {expandedGenre && (() => {
        const g = genreCards.find(c => c.key === expandedGenre);
        if (!g) return null;
        return (
          <div style={{
            position: 'fixed', inset: 0, zIndex: 900,
            background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
            animation: 'fadeIn 0.2s ease',
          }} onClick={() => setExpandedGenre(null)}>
            <div
              onClick={e => e.stopPropagation()}
              style={{
                position: 'absolute', bottom: 0, left: 0, right: 0,
                maxHeight: '85vh', background: 'var(--bg)',
                borderRadius: '20px 20px 0 0', overflow: 'hidden',
                animation: 'slideUp 0.3s cubic-bezier(0.16,1,0.3,1)',
                display: 'flex', flexDirection: 'column',
              }}
            >
              {/* Handle bar */}
              <div style={{ display: 'flex', justifyContent: 'center', padding: '10px 0 0' }}>
                <div style={{ width: 36, height: 4, borderRadius: 2, background: 'rgba(255,255,255,0.2)' }} />
              </div>
              {/* Genre header */}
              <div style={{ padding: '12px 20px 14px', background: g.gradient }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ fontSize: 28 }}>{g.icon}</span>
                    <div>
                      <h3 style={{ margin: 0, fontSize: 20, fontWeight: 800, color: 'white' }}>{g.title}</h3>
                      <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.75)', marginTop: 1 }}>{g.songs.length} tracks</div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button
                      onClick={() => {
                        const shuffled = [...g.songs].sort(() => Math.random() - 0.5);
                        playSong(shuffled[0], shuffled);
                        showToast(`Playing ${g.title}`, 'music', 2000);
                      }}
                      style={{
                        padding: '8px 20px', borderRadius: 20, background: 'rgba(0,0,0,0.3)',
                        color: 'white', fontWeight: 700, fontSize: 13, backdropFilter: 'blur(4px)',
                      }}
                    >▶ Play</button>
                    <button onClick={() => setExpandedGenre(null)}
                      style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(0,0,0,0.3)', color: 'white', fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
                  </div>
                </div>
              </div>
              {/* Song list */}
              <div style={{ flex: 1, overflowY: 'auto', paddingBottom: 'env(safe-area-inset-bottom, 16px)' }}>
                {g.songs.map((song, i) => (
                  <SongTile key={song.id} song={song} queue={g.songs} index={i} showIndex />
                ))}
              </div>
            </div>
          </div>
        );
      })()}

      {/* ═══ QUICK STATS ═══ */}
      <div style={{ padding: '8px 16px 16px' }}>
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10,
        }}>
          {[
            { value: allSongs.length, label: 'Songs', icon: '🎵' },
            { value: genreCards.length, label: 'Genres', icon: '🌍' },
            { value: '320k', label: 'Quality', icon: '🔊' },
          ].map(stat => (
            <div key={stat.label} style={{
              padding: '14px 12px', borderRadius: 12, textAlign: 'center',
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.05)',
            }}>
              <div style={{ fontSize: 20 }}>{stat.icon}</div>
              <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--text-primary)', marginTop: 4 }}>{stat.value}</div>
              <div style={{ fontSize: 10, color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1 }}>{stat.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Animations */}
      <style>{`
        @keyframes heroShift {
          0% { background-position: 0% 50%; }
          100% { background-position: 100% 50%; }
        }
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-20px); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(1.5); }
        }
        @keyframes barBounce { from { height: 4px; } to { height: 16px; } }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideUp {
          from { transform: translateY(100%); }
          to { transform: translateY(0); }
        }
        div::-webkit-scrollbar { display: none; }
      `}</style>
    </div>
  );
}
