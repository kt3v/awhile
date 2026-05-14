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
      className="h-screen flex flex-col overflow-hidden font-ui"
      style={{ background: 'var(--bg-canvas)', color: 'var(--text-1)' }}
    >
      <div className="relative flex flex-1 overflow-hidden">
        <main className="flex flex-1 overflow-hidden">
          <Grid />
        </main>

        <button
          onClick={openSettings}
          className="absolute top-3 left-3 z-20 text-xs font-semibold transition-all duration-150"
          style={{
            color: 'var(--text-2)',
            background: 'var(--bg-primary)',
            border: '1px solid var(--border)',
            borderRadius: '999px',
            padding: '6px 14px',
            boxShadow: 'var(--shadow-sm)',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--bg-secondary)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = 'var(--bg-primary)'; }}
        >
          Settings
        </button>

        <NotePanel />
      </div>

      <SettingsModal />
      <PasswordModal />
    </div>
  );
}
