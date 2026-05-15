import { useEffect, useState } from 'react';
import { useStore } from '../store/useStore';
import { parseBirthDate } from '../utils/dates';
import { hashPassword, verifyPassword } from '../utils/password';

const TODAY = new Date().toISOString().split('T')[0];
const DEFAULT_DATE = `${new Date().getFullYear() - 30}-01-01`;

const pwInputStyle: React.CSSProperties = {
  background: 'var(--bg-secondary)',
  border: '1px solid var(--border)',
  borderRadius: '10px',
  padding: '8px 12px',
  color: 'var(--text-1)',
  fontSize: 13,
  fontWeight: 500,
  outline: 'none',
  width: '100%',
  transition: 'all 0.15s',
};

function PwInput({ value, onChange, placeholder, onClearError, autoComplete = 'new-password' }: {
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  onClearError: () => void;
  autoComplete?: string;
}) {
  return (
    <input
      type="password"
      value={value}
      onChange={(e) => { onChange(e.target.value); onClearError(); }}
      placeholder={placeholder}
      autoComplete={autoComplete}
      style={pwInputStyle}
      onFocus={(e) => { e.currentTarget.style.background = 'var(--bg-primary)'; e.currentTarget.style.boxShadow = '0 0 0 2px rgba(245,197,24,0.5)'; }}
      onBlur={(e) => { e.currentTarget.style.background = 'var(--bg-secondary)'; e.currentTarget.style.boxShadow = 'none'; }}
    />
  );
}

function PasswordSection() {
  const settings = useStore((s) => s.settings);
  const saveSettings = useStore((s) => s.saveSettings);

  const enabled = !!settings?.passwordEnabled;

  const [mode, setMode] = useState<'idle' | 'set' | 'change' | 'disable'>('idle');
  const [currentPw, setCurrentPw] = useState('');
  const [newPw, setNewPw] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [error, setError] = useState('');

  function reset() {
    setMode('idle');
    setCurrentPw('');
    setNewPw('');
    setConfirmPw('');
    setError('');
  }

  function handleEnable() {
    if (!settings) return;
    if (newPw.length < 4) { setError('Minimum 4 characters'); return; }
    if (newPw !== confirmPw) { setError("Passwords don't match"); return; }
    saveSettings({ ...settings, passwordEnabled: true, passwordHash: hashPassword(newPw) });
    reset();
  }

  function handleDisable() {
    if (!settings?.passwordHash) return;
    if (!verifyPassword(currentPw, settings.passwordHash)) { setError('Incorrect password'); return; }
    saveSettings({ ...settings, passwordEnabled: false, passwordHash: undefined });
    reset();
  }

  function handleChange() {
    if (!settings?.passwordHash) return;
    if (!verifyPassword(currentPw, settings.passwordHash)) { setError('Incorrect current password'); return; }
    if (newPw.length < 4) { setError('Minimum 4 characters'); return; }
    if (newPw !== confirmPw) { setError("Passwords don't match"); return; }
    saveSettings({ ...settings, passwordHash: hashPassword(newPw) });
    reset();
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <label className="text-xs font-semibold" style={{ color: 'var(--text-1)' }}>
          Password lock
        </label>
        <div className="flex items-center gap-2">
          {enabled && mode === 'idle' && (
            <button
              onClick={() => setMode('change')}
              className="text-[11px] font-medium transition-colors"
              style={{ color: 'var(--text-3)' }}
              onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--text-2)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--text-3)'; }}
            >
              Change
            </button>
          )}
          <button
            onClick={() => {
              if (mode !== 'idle') { reset(); return; }
              if (!enabled) setMode('set');
              else setMode('disable');
            }}
            className="relative flex-shrink-0 transition-all duration-200"
            style={{
              width: 36,
              height: 20,
              borderRadius: 999,
              background: enabled ? 'var(--mustard)' : 'var(--bg-secondary)',
              border: `1px solid ${enabled ? 'var(--mustard-edge)' : 'var(--border)'}`,
            }}
            role="switch"
            aria-checked={enabled}
          >
            <span
              style={{
                position: 'absolute',
                top: 2,
                left: enabled ? 17 : 2,
                width: 14,
                height: 14,
                borderRadius: '50%',
                background: enabled ? '#000' : 'var(--text-3)',
                transition: 'left 0.2s',
              }}
            />
          </button>
        </div>
      </div>

      {mode === 'set' && (
        <div className="flex flex-col gap-2 mt-1">
          <PwInput value={newPw} onChange={setNewPw} placeholder="New password" onClearError={() => setError('')} />
          <PwInput value={confirmPw} onChange={setConfirmPw} placeholder="Confirm password" onClearError={() => setError('')} />
          {error && <p className="text-[11px] font-medium" style={{ color: 'var(--red)' }}>{error}</p>}
          <div className="flex gap-2">
            <button onClick={reset} className="flex-1 py-2 text-xs font-semibold rounded-lg transition-all" style={{ background: 'var(--bg-secondary)', color: 'var(--text-2)', border: '1px solid var(--border)' }}>
              Cancel
            </button>
            <button onClick={handleEnable} className="flex-1 py-2 text-xs font-semibold rounded-lg transition-all" style={{ background: 'var(--mustard)', color: '#000' }}>
              Enable
            </button>
          </div>
        </div>
      )}

      {mode === 'disable' && (
        <div className="flex flex-col gap-2 mt-1">
          <PwInput value={currentPw} onChange={setCurrentPw} placeholder="Current password" onClearError={() => setError('')} autoComplete="current-password" />
          {error && <p className="text-[11px] font-medium" style={{ color: 'var(--red)' }}>{error}</p>}
          <div className="flex gap-2">
            <button onClick={reset} className="flex-1 py-2 text-xs font-semibold rounded-lg transition-all" style={{ background: 'var(--bg-secondary)', color: 'var(--text-2)', border: '1px solid var(--border)' }}>
              Cancel
            </button>
            <button onClick={handleDisable} className="flex-1 py-2 text-xs font-semibold rounded-lg transition-all" style={{ background: 'var(--red)', color: '#fff' }}>
              Disable
            </button>
          </div>
        </div>
      )}

      {mode === 'change' && (
        <div className="flex flex-col gap-2 mt-1">
          <PwInput value={currentPw} onChange={setCurrentPw} placeholder="Current password" onClearError={() => setError('')} autoComplete="current-password" />
          <PwInput value={newPw} onChange={setNewPw} placeholder="New password" onClearError={() => setError('')} />
          <PwInput value={confirmPw} onChange={setConfirmPw} placeholder="Confirm new password" onClearError={() => setError('')} />
          {error && <p className="text-[11px] font-medium" style={{ color: 'var(--red)' }}>{error}</p>}
          <div className="flex gap-2">
            <button onClick={reset} className="flex-1 py-2 text-xs font-semibold rounded-lg transition-all" style={{ background: 'var(--bg-secondary)', color: 'var(--text-2)', border: '1px solid var(--border)' }}>
              Cancel
            </button>
            <button onClick={handleChange} className="flex-1 py-2 text-xs font-semibold rounded-lg transition-all" style={{ background: 'var(--mustard)', color: '#000' }}>
              Save
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function ThemeToggle() {
  const theme = useStore((s) => s.theme);
  const setTheme = useStore((s) => s.setTheme);

  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-semibold" style={{ color: 'var(--text-1)' }}>
        Appearance
      </label>
      <div
        className="flex rounded-xl p-1 gap-1"
        style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)' }}
      >
        {(['light', 'dark'] as const).map((t) => {
          const active = theme === t;
          return (
            <button
              key={t}
              onClick={() => setTheme(t)}
              className="flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-semibold rounded-lg transition-all duration-150 capitalize"
              style={
                active
                  ? {
                      background: 'var(--bg-primary)',
                      color: 'var(--text-1)',
                      boxShadow: 'var(--shadow-sm)',
                      border: '1px solid var(--border)',
                    }
                  : {
                      background: 'transparent',
                      color: 'var(--text-3)',
                      border: '1px solid transparent',
                    }
              }
            >
              {t === 'light' ? (
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                  <circle cx="6" cy="6" r="2.5" stroke="currentColor" strokeWidth="1.4" />
                  <path d="M6 1v1M6 10v1M1 6h1M10 6h1M2.5 2.5l.7.7M8.8 8.8l.7.7M9.5 2.5l-.7.7M3.2 8.8l-.7.7" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
                </svg>
              ) : (
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                  <path d="M10 6.5A4.5 4.5 0 0 1 5.5 2a4.5 4.5 0 1 0 4.5 4.5z" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              )}
              {t}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default function SettingsModal() {
  const settings = useStore((s) => s.settings);
  const settingsOpen = useStore((s) => s.settingsOpen);
  const saveSettings = useStore((s) => s.saveSettings);
  const closeSettings = useStore((s) => s.closeSettings);

  const isInitial = !settings;
  const visible = isInitial || settingsOpen;

  const [birthDate, setBirthDate] = useState(settings?.birthDate ?? DEFAULT_DATE);
  const [totalYears, setTotalYears] = useState(settings?.totalYears ?? 80);

  const canSave = !!birthDate && totalYears >= 10 && totalYears <= 120;

  useEffect(() => {
    if (settingsOpen && settings) {
      setBirthDate(settings.birthDate);
      setTotalYears(settings.totalYears);
    }
  }, [settingsOpen, settings]);

  useEffect(() => {
    if (canSave && !isInitial) {
      saveSettings({ ...settings!, birthDate, totalYears });
    }
  }, [birthDate, totalYears, canSave, saveSettings, isInitial]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!visible) return null;

  const parsed = birthDate ? parseBirthDate(birthDate) : null;
  const birthYear = parsed?.year ?? new Date().getFullYear();

  return (
    <div
      className="fixed inset-0 flex items-center justify-center z-50 p-4"
      style={{ background: 'var(--scrim)', backdropFilter: 'blur(4px)' }}
    >
      <div
        className="w-full max-w-sm overflow-hidden relative"
        style={{
          background: 'var(--bg-primary)',
          border: '1px solid var(--border)',
          borderRadius: '10px',
          boxShadow: 'var(--shadow-xl)',
        }}
      >
        {/* Body */}
        <div className="p-5 flex flex-col gap-4">
          <button
            onClick={closeSettings}
            className="absolute top-3 right-3 w-7 h-7 flex items-center justify-center rounded-lg transition-all duration-150"
            style={{ color: 'var(--text-2)' }}
            onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--bg-secondary)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
          >
            <svg width="12" height="12" viewBox="0 0 14 14" fill="none">
              <path d="M1 1l12 12M13 1L1 13" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
            </svg>
          </button>
          {isInitial && (
            <p className="text-sm font-medium" style={{ color: 'var(--text-2)', lineHeight: 1.55 }}>
              Your entire life, one square per month.
            </p>
          )}

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold" style={{ color: 'var(--text-1)' }}>
              Date of birth
            </label>
            <input
              type="date"
              value={birthDate}
              onChange={(e) => setBirthDate(e.target.value)}
              max={TODAY}
              min="1900-01-01"
              className="w-full min-w-0 text-sm font-medium outline-none transition-all duration-150"
              style={{
                background: 'var(--bg-secondary)',
                border: '1px solid var(--border)',
                borderRadius: '12px',
                padding: '10px 14px',
                color: 'var(--text-1)',
                boxSizing: 'border-box',
                WebkitAppearance: 'none',
                appearance: 'none',
              }}
              onFocus={(e) => {
                e.currentTarget.style.background = 'var(--bg-primary)';
                e.currentTarget.style.boxShadow = '0 0 0 2px rgba(245,197,24,0.5)';
              }}
              onBlur={(e) => {
                e.currentTarget.style.background = 'var(--bg-secondary)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold" style={{ color: 'var(--text-1)' }}>
              Years to display
            </label>
            <input
              type="number"
              value={totalYears}
              onChange={(e) => setTotalYears(Number(e.target.value))}
              min={10}
              max={120}
              className="w-full min-w-0 text-sm font-medium outline-none transition-all duration-150"
              style={{
                background: 'var(--bg-secondary)',
                border: '1px solid var(--border)',
                borderRadius: '12px',
                padding: '10px 14px',
                color: 'var(--text-1)',
                boxSizing: 'border-box',
              }}
              onFocus={(e) => {
                e.currentTarget.style.background = 'var(--bg-primary)';
                e.currentTarget.style.boxShadow = '0 0 0 2px rgba(245,197,24,0.5)';
              }}
              onBlur={(e) => {
                e.currentTarget.style.background = 'var(--bg-secondary)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            />
            {parsed && (
              <p className="text-[11px] font-medium" style={{ color: 'var(--text-3)' }}>
                Grid covers {birthYear} — {birthYear + totalYears} · {totalYears * 12} months
              </p>
            )}
          </div>

          {!isInitial && <PasswordSection />}

          <ThemeToggle />

          {isInitial && (
            <button
              onClick={() => canSave && saveSettings({ birthDate, totalYears })}
              disabled={!canSave}
              className="w-full py-2.5 text-sm font-semibold rounded-xl transition-all duration-150"
              style={{
                background: canSave ? 'var(--mustard)' : 'var(--bg-secondary)',
                color: canSave ? '#000' : 'var(--text-3)',
                border: '1px solid transparent',
              }}
            >
              Get started
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
