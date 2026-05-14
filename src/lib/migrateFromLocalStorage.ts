export async function migrateFromLocalStorage(): Promise<void> {
  const raw = localStorage.getItem('awhile-storage') ?? localStorage.getItem('lifenotes-storage');
  if (!raw) return;

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return;
  }

  if (
    !parsed ||
    typeof parsed !== 'object' ||
    !('state' in parsed) ||
    !('version' in parsed)
  ) {
    return;
  }

  try {
    const check = await fetch('/api/data');
    if (!check.ok) return;
    const existing = await check.json() as Record<string, unknown>;
    if (existing && Object.keys(existing).length > 0) {
      // Server already has data — don't overwrite with potentially stale local data
      localStorage.removeItem('awhile-storage');
      localStorage.removeItem('lifenotes-storage');
      return;
    }

    const put = await fetch('/api/data', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(parsed),
    });
    if (put.ok) {
      localStorage.removeItem('awhile-storage');
      localStorage.removeItem('lifenotes-storage');
    }
  } catch {
    // Silent: failed migration is recoverable on next load
  }
}
