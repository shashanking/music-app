import { createContext, useContext, useState, useCallback, useRef } from 'react';

const ToastContext = createContext(null);

const ICONS = {
  success: '✓',
  error: '✕',
  info: 'ℹ',
  warning: '⚠',
  music: '♪',
  playlist: '♫',
  game: '🎮',
};

const COLORS = {
  success: '#1DB954',
  error: '#e74c3c',
  info: '#3498db',
  warning: '#f39c12',
  music: '#1DB954',
  playlist: '#9b59b6',
  game: '#ff6b35',
};

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const idRef = useRef(0);

  const showToast = useCallback((message, type = 'info', duration = 3000) => {
    const id = ++idRef.current;
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, duration);
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {/* Toast container */}
      <div style={{
        position: 'fixed', top: 16, left: '50%', transform: 'translateX(-50%)',
        zIndex: 9999, display: 'flex', flexDirection: 'column', gap: 8,
        pointerEvents: 'none', maxWidth: 400, width: '90%',
      }}>
        {toasts.map((toast, i) => (
          <div
            key={toast.id}
            style={{
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '12px 16px', borderRadius: 12,
              background: 'rgba(30,30,30,0.95)',
              backdropFilter: 'blur(12px)',
              WebkitBackdropFilter: 'blur(12px)',
              border: `1px solid ${COLORS[toast.type]}33`,
              boxShadow: `0 8px 32px rgba(0,0,0,0.4), 0 0 0 1px rgba(255,255,255,0.05), inset 0 1px 0 rgba(255,255,255,0.05)`,
              animation: 'toastIn 0.35s cubic-bezier(0.16,1,0.3,1)',
              pointerEvents: 'auto',
            }}
          >
            <div style={{
              width: 28, height: 28, borderRadius: 8,
              background: `${COLORS[toast.type]}20`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 14, fontWeight: 700, color: COLORS[toast.type], flexShrink: 0,
            }}>
              {ICONS[toast.type]}
            </div>
            <span style={{ fontSize: 13, fontWeight: 500, color: '#fff', lineHeight: 1.4 }}>
              {toast.message}
            </span>
          </div>
        ))}
      </div>
      <style>{`
        @keyframes toastIn {
          from { opacity: 0; transform: translateY(-20px) scale(0.95); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>
    </ToastContext.Provider>
  );
}

export const useToast = () => {
  const ctx = useContext(ToastContext);
  if (!ctx) return { showToast: () => {} };
  return ctx;
};
