import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Note, Settings, CellId, RangeTag } from '../types';
import { createApiStorage } from '../lib/apiStorage';
import { randomUUID } from '../utils/uuid';

interface Store {
  settings: Settings | null;
  notes: Record<string, Note>;
  selectedCell: CellId | null;
  settingsOpen: boolean;
  theme: 'light' | 'dark';
  rangeTags: RangeTag[];
  selectedTagId: string | null;
  unlocked: boolean;

  saveSettings: (s: Settings) => void;
  setNote: (key: string, text: string) => void;
  selectCell: (cell: CellId | null) => void;
  openSettings: () => void;
  closeSettings: () => void;
  setTheme: (t: 'light' | 'dark') => void;
  addRangeTag: (tag: Omit<RangeTag, 'id'>) => void;
  deleteRangeTag: (id: string) => void;
  updateRangeTagNote: (id: string, note: string) => void;
  renameRangeTag: (id: string, label: string) => void;
  selectTag: (id: string | null) => void;
  hydrated: boolean;
  setHydrated: (v: boolean) => void;
  setUnlocked: (v: boolean) => void;
}

export function cellKey(year: number, month: number): string {
  return `${year}-${month}`;
}

export const useStore = create<Store>()(
  persist(
    (set) => ({
      settings: null,
      notes: {},
      selectedCell: null,
      settingsOpen: false,
      theme: 'light',
      rangeTags: [],
      selectedTagId: null,
      hydrated: false,
      unlocked: false,

      saveSettings: (s) => set({ settings: s, settingsOpen: false }),

      setNote: (key, text) =>
        set((state) => ({
          notes: {
            ...state.notes,
            [key]: { text, updatedAt: new Date().toISOString() },
          },
        })),

      selectCell: (cell) => set({ selectedCell: cell, selectedTagId: null }),
      openSettings: () => set({ settingsOpen: true }),
      closeSettings: () => set({ settingsOpen: false }),
      setTheme: (t) => set({ theme: t }),

      addRangeTag: (tag) =>
        set((state) => ({
          rangeTags: [...state.rangeTags, { ...tag, id: randomUUID() }],
        })),

      deleteRangeTag: (id) =>
        set((state) => ({
          rangeTags: state.rangeTags.filter((t) => t.id !== id),
          selectedTagId: state.selectedTagId === id ? null : state.selectedTagId,
        })),

      updateRangeTagNote: (id, note) =>
        set((state) => ({
          rangeTags: state.rangeTags.map((t) =>
            t.id === id ? { ...t, note, updatedAt: new Date().toISOString() } : t
          ),
        })),

      renameRangeTag: (id, label) =>
        set((state) => ({
          rangeTags: state.rangeTags.map((t) =>
            t.id === id ? { ...t, label: label.trim(), updatedAt: new Date().toISOString() } : t
          ),
        })),

      selectTag: (id) => set({ selectedTagId: id, selectedCell: null }),
      setHydrated: (v) => set({ hydrated: v }),
      setUnlocked: (v) => set({ unlocked: v }),
    }),
    {
      name: 'awhile-storage',
      version: 3,
      storage: createApiStorage(),
      skipHydration: true,
      partialize: (state) => ({
        settings: state.settings,
        notes: state.notes,
        rangeTags: state.rangeTags,
        theme: state.theme,
      }),
      onRehydrateStorage: () => (_state, error) => {
        if (error) console.error('awhile: rehydration error', error);
        useStore.getState().setHydrated(true);
      },
      migrate: (persisted, version) => {
        const state = persisted as Record<string, unknown>;
        if (version === 0) {
          const s = state.settings as Record<string, unknown> | null | undefined;
          if (s && typeof s.birthYear === 'number' && !s.birthDate) {
            state.settings = {
              birthDate: `${s.birthYear}-01-01`,
              totalYears: s.totalYears ?? 80,
            };
          }
        }
        // version 1 → 2: rangeTags and selectedTagId added, defaults handle it
        // version 2 → 3: add startMonth/endMonth to existing rangeTags
        if (version <= 2) {
          const tags = state.rangeTags as Array<Record<string, unknown>> | undefined;
          if (Array.isArray(tags)) {
            tags.forEach((tag) => {
              if (tag.startMonth === undefined) tag.startMonth = 0;
              if (tag.endMonth === undefined) tag.endMonth = 11;
            });
          }
        }
        return state as unknown as Store;
      },
    }
  )
);
