import { useState, useRef, useEffect } from 'react';
import { useStore } from '../store/useStore';
import { verifyPassword } from '../utils/password';


export default function PasswordModal() {
  const settings = useStore((s) => s.settings);
  const unlocked = useStore((s) => s.unlocked);
  const setUnlocked = useStore((s) => s.setUnlocked);

  const [value, setValue] = useState('');
  const [error, setError] = useState(false);
  const [shaking, setShaking] = useState(false);
  const [pending, setPending] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const shakeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const needsLock = !!settings?.passwordEnabled && !!settings?.passwordHash && !unlocked;

  useEffect(() => {
    if (needsLock) {
      setValue('');
      setError(false);
      setShaking(false);
      setPending(false);
      inputRef.current?.focus();
    }
  }, [needsLock]);

  if (!needsLock) return null;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!settings?.passwordHash || pending) return;
    setPending(true);
    if (verifyPassword(value, settings.passwordHash)) {
      setUnlocked(true);
    } else {
      setError(true);
      setValue('');
      setShaking(false);
      requestAnimationFrame(() => setShaking(true));
      if (shakeTimerRef.current) clearTimeout(shakeTimerRef.current);
      shakeTimerRef.current = setTimeout(() => setShaking(false), 500);
      setPending(false);
    }
  }

  return (
    <div
      className="fixed inset-0 flex items-center justify-center z-[100] p-4"
      style={{ background: 'var(--bg-canvas)' }}
    >
      <div
        className="w-full max-w-xs flex flex-col gap-5"
        style={{
          background: 'var(--bg-primary)',
          border: '1px solid var(--border)',
          borderRadius: '16px',
          padding: '28px 24px',
          boxShadow: 'var(--shadow-xl)',
        }}
      >
        <div className="flex flex-col gap-1">
          <p className="text-sm font-semibold" style={{ color: 'var(--text-1)' }}>
            Enter password
          </p>
          <p className="text-xs" style={{ color: 'var(--text-3)' }}>
            This journal is protected.
          </p>
        </div>

        <form onSubmit={handleSubmit} autoComplete="off" className="flex flex-col gap-3">
          <input
            ref={inputRef}
            type="password"
            value={value}
            onChange={(e) => { setValue(e.target.value); setError(false); }}
            placeholder="Password"
            autoComplete="off"
            className="w-full text-sm font-medium outline-none transition-all duration-150"
            style={{
              background: 'var(--bg-secondary)',
              border: `1px solid ${error ? 'var(--red)' : 'var(--border)'}`,
              borderRadius: '12px',
              padding: '10px 14px',
              color: 'var(--text-1)',
              animation: shaking ? 'shake 0.4s ease' : 'none',
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
          {error && (
            <p className="text-xs font-medium" style={{ color: 'var(--red)', marginTop: -4 }}>
              Incorrect password
            </p>
          )}
          <button
            type="submit"
            disabled={!value || pending}
            className="w-full py-2.5 text-sm font-semibold rounded-xl transition-all duration-150"
            style={{
              background: value && !pending ? 'var(--mustard)' : 'var(--bg-secondary)',
              color: value && !pending ? '#000' : 'var(--text-3)',
            }}
          >
            Unlock
          </button>
        </form>
      </div>

      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          20% { transform: translateX(-6px); }
          40% { transform: translateX(6px); }
          60% { transform: translateX(-4px); }
          80% { transform: translateX(4px); }
        }
      `}</style>
    </div>
  );
}
