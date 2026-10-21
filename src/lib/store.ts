import { useCallback, useSyncExternalStore } from 'react';
import Storage from 'expo-sqlite/kv-store';

// Petit store persistant (SQLite local) partagé entre les écrans.
const cache = new Map<string, unknown>();
const listeners = new Map<string, Set<() => void>>();

/** Lecture hors composant (fonctions de texte, IA…). */
export const lire = <T,>(key: string, initial: T): T => read(key, initial);

function read<T>(key: string, initial: T): T {
  if (!cache.has(key)) {
    const raw = Storage.getItemSync(key);
    cache.set(key, raw ? JSON.parse(raw) : initial);
  }
  return cache.get(key) as T;
}

export function write<T>(key: string, value: T) {
  cache.set(key, value);
  Storage.setItemSync(key, JSON.stringify(value));
  listeners.get(key)?.forEach((l) => l());
}

export function useStored<T>(key: string, initial: T) {
  const subscribe = useCallback(
    (cb: () => void) => {
      const set = listeners.get(key) ?? new Set();
      listeners.set(key, set);
      set.add(cb);
      return () => {
        set.delete(cb);
      };
    },
    [key],
  );
  const value = useSyncExternalStore(subscribe, () => read(key, initial));
  const setValue = useCallback((v: T) => write(key, v), [key]);
  return [value, setValue] as const;
}

export const KEYS = {
  profil: 'profil',
  contacts: 'contacts',
  groupes: 'groupes',
  modele: 'modele',
  pays: 'pays',
} as const;
