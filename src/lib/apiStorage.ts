import type { PersistStorage, StorageValue } from 'zustand/middleware';

function debounce<T extends (...args: Parameters<T>) => void>(fn: T, ms: number) {
  let timer: ReturnType<typeof setTimeout>;
  return (...args: Parameters<T>) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), ms);
  };
}

const debouncedPut = debounce(async (value: unknown) => {
  try {
    const res = await fetch('/api/data', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(value),
    });
    if (!res.ok) console.error('awhile: save failed', res.status);
  } catch (e) {
    console.error('awhile: save error', e);
  }
}, 500);

export function createApiStorage<S>(): PersistStorage<S> {
  return {
    async getItem(_name: string): Promise<StorageValue<S> | null> {
      const res = await fetch('/api/data');
      if (!res.ok) throw new Error(`awhile: GET /api/data failed: ${res.status}`);
      const data = await res.json() as Record<string, unknown>;
      if (!data || Object.keys(data).length === 0) return null;
      return data as StorageValue<S>;
    },

    setItem(_name: string, value: StorageValue<S>): void {
      debouncedPut(value);
    },

    removeItem(_name: string): void {
      // no-op: storage is managed server-side
    },
  };
}
