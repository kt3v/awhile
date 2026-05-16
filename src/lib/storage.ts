import type { PersistStorage } from 'zustand/middleware';
import type { PersistedState } from '../types';
import { createApiStorage } from './apiStorage';

export type StorageAdapter = PersistStorage<PersistedState>;

let _adapter: StorageAdapter | null = null;

export function setStorageAdapter(adapter: StorageAdapter): void {
  _adapter = adapter;
}

export function createStorageProxy(): StorageAdapter {
  return {
    getItem: (name) => (_adapter ?? createApiStorage()).getItem(name),
    setItem: (name, value) => (_adapter ?? createApiStorage()).setItem(name, value),
    removeItem: (name) => (_adapter ?? createApiStorage()).removeItem(name),
  };
}
