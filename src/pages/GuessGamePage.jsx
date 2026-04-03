import { useState, useRef, useCallback, useEffect } from 'react';
import { useToast } from '../contexts/ToastContext';

const CLIP_DURATION = 5; // seconds to play

export default function GuessGamePage({ allSongs }) {
  const { showToast } = useToast();
  const [gameState, setGameState] = useState('idle'); // idle | playing | answered | loading
  const [currentSong, setCurrentSong] = useState(null);
  const [options, setOptions] = useState([]);
  const [selected, setSelected] = useState(null);
  const [score, setScore] = useState(0);
  const [total, setTotal] = useState(0);
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [timeLeft, setTimeLeft] = useState(CLIP_DURATION);
  const [difficulty, setDifficulty] = useState('medium'); // easy(4) medium(4+timer) hard(6+timer)
  const audioRef = useRef(new Audio());
  const timerRef = useRef(null);
  const countdownRef = useRef(null);

  const optionCount = difficulty === 'hard' ? 6 : 4;

  const startRound = useCallback(() => {
    if (allSongs.length < optionCount) return;
    setGameState('loading');
    setSelected(null);
    setTimeLeft(CLIP_DURATION);

    // Pick random song
    const shuffled = [...allSongs].sort(() => Math.random() - 0.5);
    const answer = shuffled[0];

    // Pick wrong options
    const wrongs = shuffled.slice(1, optionCount).map(s => ({
      id: s.id, title: s.title, artist: s.artist,
    }));

    // Insert correct answer at random position
    const allOptions = [...wrongs, { id: answer.id, title: answer.title, artist: answer.artist }]
      .sort(() => Math.random() - 0.5);

    setCurrentSong(answer);
    setOptions(allOptions);

    // Play random segment
    const audio = audioRef.current;
    audio.pause();
    audio.src = answer.audioUrl;
    audio.volume = 0.8;

    audio.onloadedmetadata = () => {
      const maxStart = Math.max(0, audio.duration - CLIP_DURATION - 2);
      const start = Math.random() * maxStart;
      audio.currentTime = start;
      audio.play().catch(() => {});
      setGameState('playing');

      // Stop after clip duration
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        audio.pause();
        if (difficulty !== 'easy') {
          // Auto-wrong if timer runs out
          setGameState(prev => {
            if (prev === 'playing') {
              setTotal(t => t + 1);
              setStreak(0);
              return 'answered';
            }
            return prev;
          });
        }
      }, CLIP_DURATION * 1000);

      // Countdown timer
      if (countdownRef.current) clearInterval(countdownRef.current);
      let t = CLIP_DURATION;
      countdownRef.current = setInterval(() => {
        t -= 0.1;
        setTimeLeft(Math.max(0, t));
        if (t <= 0) clearInterval(countdownRef.current);
      }, 100);
    };

    audio.onerror = () => {
      setGameState('idle');
    };
  }, [allSongs, optionCount, difficulty]);

  const handleAnswer = (option) => {
    if (gameState !== 'playing') return;
    setSelected(option.id);
    setGameState('answered');
    setTotal(t => t + 1);
    audioRef.current.pause();
    if (timerRef.current) clearTimeout(timerRef.current);
    if (countdownRef.current) clearInterval(countdownRef.current);

    if (option.id === currentSong.id) {
      setScore(s => s + 1);
      setStreak(s => {
        const next = s + 1;
        setBestStreak(b => Math.max(b, next));
        if (next >= 5) showToast(`Incredible! ${next} streak!`, 'game');
        else if (next >= 3) showToast(`On fire! ${next} streak!`, 'game');
        return next;
      });
      showToast('Correct!', 'success', 1500);
    } else {
      setStreak(0);
      showToast(`It was "${currentSong.title}"`, 'error', 3000);
    }
  };

  // Cleanup
  useEffect(() => {
    return () => {
      audioRef.current.pause();
      if (timerRef.current) clearTimeout(timerRef.current);
      if (countdownRef.current) clearInterval(countdownRef.current);
    };
  }, []);

  const accuracy = total > 0 ? Math.round((score / total) * 100) : 0;

  if (allSongs.length < 4) {
    return (
      <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
        <div style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>🎮</div>
          <div style={{ fontSize: 18 }}>Loading songs...</div>
          <div style={{ fontSize: 13, marginTop: 8 }}>Need songs to start the game</div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ height: '100%', overflowY: 'auto', paddingBottom: 100 }}>
      {/* Header */}
      <div style={{
        padding: '48px 24px 16px', textAlign: 'center',
        background: 'linear-gradient(180deg, rgba(255,165,0,0.2) 0%, var(--bg) 100%)',
      }}>
        <h1 style={{ fontSize: 28, fontWeight: 700, margin: 0 }}>Guess the Song 🎮</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: 13, margin: '4px 0 16px' }}>
          Listen to a 5-second clip and guess the song!
        </p>

        {/* Difficulty selector */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginBottom: 16 }}>
          {[
            { key: 'easy', label: 'Easy', desc: '4 options' },
            { key: 'medium', label: 'Medium', desc: '4 + timer' },
            { key: 'hard', label: 'Hard', desc: '6 + timer' },
          ].map(d => (
            <button
              key={d.key}
              onClick={() => { setDifficulty(d.key); setGameState('idle'); }}
              style={{
                padding: '8px 16px', borderRadius: 12, fontSize: 13,
                background: difficulty === d.key ? 'var(--primary)' : 'var(--surface-light)',
                color: difficulty === d.key ? 'white' : 'var(--text-secondary)',
              }}
            >
              {d.label}
            </button>
          ))}
        </div>

        {/* Score board */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: 24 }}>
          <ScoreStat label="Score" value={`${score}/${total}`} />
          <ScoreStat label="Accuracy" value={`${accuracy}%`} />
          <ScoreStat label="Streak" value={streak} color={streak >= 3 ? '#ff6b35' : undefined} />
          <ScoreStat label="Best" value={bestStreak} color="#FFD700" />
        </div>
      </div>

      {/* Game area */}
      <div style={{ padding: '16px 24px', maxWidth: 500, margin: '0 auto' }}>
        {gameState === 'idle' && (
          <div style={{ textAlign: 'center', padding: '40px 0' }}>
            <button
              onClick={startRound}
              style={{
                width: 120, height: 120, borderRadius: '50%',
                background: 'linear-gradient(135deg, var(--primary) 0%, #17a44a 100%)',
                fontSize: 48, display: 'flex', alignItems: 'center', justifyContent: 'center',
                margin: '0 auto 16px', boxShadow: '0 8px 32px rgba(29,185,84,0.4)',
                transition: 'transform 0.2s',
              }}
              onMouseEnter={e => e.target.style.transform = 'scale(1.05)'}
              onMouseLeave={e => e.target.style.transform = 'scale(1)'}
            >
              ▶
            </button>
            <div style={{ fontSize: 18, fontWeight: 600 }}>Start Round</div>
            <div style={{ color: 'var(--text-secondary)', fontSize: 13, marginTop: 4 }}>
              Tap to play a clip
            </div>
          </div>
        )}

        {gameState === 'loading' && (
          <div style={{ textAlign: 'center', padding: '60px 0' }}>
            <div className="spinner" style={{ margin: '0 auto 16px' }} />
            <div style={{ color: 'var(--text-secondary)' }}>Loading clip...</div>
            <style>{`.spinner { width: 40px; height: 40px; border: 3px solid var(--surface-light); border-top-color: var(--primary); border-radius: 50%; animation: spin 0.8s linear infinite; } @keyframes spin { to { transform: rotate(360deg); } }`}</style>
          </div>
        )}

        {(gameState === 'playing' || gameState === 'answered') && (
          <>
            {/* Timer bar */}
            {difficulty !== 'easy' && gameState === 'playing' && (
              <div style={{ marginBottom: 20 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Time left</span>
                  <span style={{ fontSize: 14, fontWeight: 700, color: timeLeft < 2 ? '#e74c3c' : 'var(--primary)' }}>
                    {timeLeft.toFixed(1)}s
                  </span>
                </div>
                <div style={{ height: 6, background: 'var(--surface-light)', borderRadius: 3, overflow: 'hidden' }}>
                  <div style={{
                    height: '100%', borderRadius: 3, transition: 'width 0.1s linear',
                    width: `${(timeLeft / CLIP_DURATION) * 100}%`,
                    background: timeLeft < 2 ? '#e74c3c' : 'var(--primary)',
                  }} />
                </div>
              </div>
            )}

            {/* Listening indicator */}
            {gameState === 'playing' && (
              <div style={{ textAlign: 'center', marginBottom: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                <div style={{ display: 'flex', gap: 3, alignItems: 'flex-end', height: 20 }}>
                  {[0, 1, 2, 3, 4].map(i => (
                    <div key={i} style={{
                      width: 4, borderRadius: 2, background: 'var(--primary)',
                      animation: `barBounce 0.5s ${i * 0.1}s ease-in-out infinite alternate`,
                    }} />
                  ))}
                </div>
                <span style={{ color: 'var(--primary)', fontWeight: 600, fontSize: 15 }}>Listening...</span>
                <style>{`@keyframes barBounce { from { height: 6px; } to { height: 20px; } }`}</style>
              </div>
            )}

            {/* Cover art reveal on answer */}
            {gameState === 'answered' && currentSong && (
              <div style={{
                display: 'flex', alignItems: 'center', gap: 16, padding: 16,
                background: 'var(--surface)', borderRadius: 12, marginBottom: 16,
                animation: 'fadeIn 0.3s ease',
              }}>
                <img src={currentSong.coverUrl} alt="" style={{ width: 64, height: 64, borderRadius: 8, objectFit: 'cover' }}
                  onError={e => { e.target.style.display = 'none'; }} />
                <div>
                  <div style={{ fontWeight: 600, fontSize: 16 }}>{currentSong.title}</div>
                  <div style={{ color: 'var(--text-secondary)', fontSize: 13 }}>{currentSong.artist}</div>
                </div>
                <style>{`@keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }`}</style>
              </div>
            )}

            {/* Options */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {options.map((opt, i) => {
                const isCorrect = opt.id === currentSong?.id;
                const isSelected = selected === opt.id;
                let bg = 'var(--surface-light)';
                let border = '2px solid transparent';

                if (gameState === 'answered') {
                  if (isCorrect) { bg = 'rgba(29,185,84,0.15)'; border = '2px solid var(--primary)'; }
                  else if (isSelected && !isCorrect) { bg = 'rgba(231,76,60,0.15)'; border = '2px solid #e74c3c'; }
                }

                return (
                  <button
                    key={opt.id}
                    onClick={() => handleAnswer(opt)}
                    disabled={gameState === 'answered'}
                    style={{
                      padding: '14px 16px', borderRadius: 12, textAlign: 'left',
                      background: bg, border, transition: 'all 0.2s',
                      opacity: gameState === 'answered' && !isCorrect && !isSelected ? 0.5 : 1,
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <span style={{
                        width: 28, height: 28, borderRadius: '50%',
                        background: gameState === 'answered' && isCorrect ? 'var(--primary)' :
                          gameState === 'answered' && isSelected ? '#e74c3c' : 'var(--surface)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', flexShrink: 0,
                      }}>
                        {gameState === 'answered' && isCorrect ? '✓' :
                          gameState === 'answered' && isSelected ? '✗' :
                            String.fromCharCode(65 + i)}
                      </span>
                      <div>
                        <div style={{ fontWeight: 500, fontSize: 14 }}>{opt.title}</div>
                        <div style={{ color: 'var(--text-secondary)', fontSize: 12 }}>{opt.artist}</div>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Streak message */}
            {gameState === 'answered' && selected === currentSong?.id && streak >= 3 && (
              <div style={{
                textAlign: 'center', padding: '12px 0', marginTop: 12,
                fontSize: 18, fontWeight: 700, color: '#ff6b35',
                animation: 'fadeIn 0.3s ease',
              }}>
                🔥 {streak} streak!
              </div>
            )}

            {/* Next button */}
            {gameState === 'answered' && (
              <button
                onClick={startRound}
                style={{
                  width: '100%', padding: '14px', marginTop: 16, borderRadius: 12,
                  background: 'var(--primary)', color: 'white', fontWeight: 600, fontSize: 16,
                }}
              >
                Next Song →
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function ScoreStat({ label, value, color }) {
  return (
    <div style={{ textAlign: 'center' }}>
      <div style={{ fontSize: 22, fontWeight: 700, color: color || 'var(--text-primary)' }}>{value}</div>
      <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>{label}</div>
    </div>
  );
}
