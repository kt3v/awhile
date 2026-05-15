import { useEffect } from 'react';
import Grid from './components/Grid';
import NotePanel from './components/NotePanel';
import SettingsModal from './components/SettingsModal';
import PasswordModal from './components/PasswordModal';
import { useStore } from './store/useStore';

export default function App() {
  const hydrated = useStore((s) => s.hydrated);
  const openSettings = useStore((s) => s.openSettings);
  const theme = useStore((s) => s.theme);

  useEffect(() => {
    const html = document.documentElement;
    if (theme === 'dark') {
      html.classList.add('dark');
    } else {
      html.classList.remove('dark');
    }
  }, [theme]);

  if (!hydrated) return null;

  return (
    <div
      className="flex flex-col overflow-hidden font-ui"
      style={{ height: '100dvh', background: 'var(--bg-canvas)', color: 'var(--text-1)' }}
    >
      <div className="relative flex flex-1 overflow-hidden">
        <main className="flex flex-1 overflow-hidden">
          <Grid />
        </main>

        <button
          onClick={openSettings}
          className="absolute top-3 left-3 z-20 flex items-center justify-center transition-all duration-150"
          style={{
            width: 36,
            height: 36,
            borderRadius: 10,
            color: 'var(--text-2)',
            background: 'var(--bg-primary)',
            border: '1px solid var(--border)',
            boxShadow: 'var(--shadow-sm)',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--bg-secondary)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = 'var(--bg-primary)'; }}
        >
          <svg width="18" height="14" viewBox="0 0 18 14" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect width="18" height="2" rx="1" fill="currentColor"/>
            <rect y="6" width="18" height="2" rx="1" fill="currentColor"/>
            <rect y="12" width="18" height="2" rx="1" fill="currentColor"/>
          </svg>
        </button>

        <NotePanel />
      </div>

      <SettingsModal />
      <PasswordModal />
    </div>
  );
}
