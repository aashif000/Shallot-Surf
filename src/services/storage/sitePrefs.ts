// src/services/storage/sitePrefs.ts
import AsyncStorage from '@react-native-async-storage/async-storage';

export type SitePref = {
  origin: string; // e.g. "https://example.com"
  disableJS?: boolean;
  camera?: 'allow' | 'block' | 'ask';
  mic?: 'allow' | 'block' | 'ask';
  notifications?: 'allow' | 'block' | 'ask';
  createdAt?: number;
};

const KEY = 'shallotsurf:sitePrefs';

async function readAll(): Promise<SitePref[]> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    if (!raw) return [];
    return JSON.parse(raw) as SitePref[];
  } catch (e) {
    console.warn('sitePrefs.readAll error', e);
    return [];
  }
}

export const sitePrefsStore = {
  async get(origin: string): Promise<SitePref | null> {
    const all = await readAll();
    return all.find(s => s.origin === origin) ?? null;
  },

  async set(pref: SitePref): Promise<SitePref> {
    const all = await readAll();
    const filtered = all.filter(s => s.origin !== pref.origin);
    const entry = { ...pref, createdAt: pref.createdAt ?? Date.now() };
    filtered.push(entry);
    try {
      await AsyncStorage.setItem(KEY, JSON.stringify(filtered));
    } catch (e) {
      console.warn('sitePrefs.set error', e);
    }
    return entry;
  },

  async remove(origin: string): Promise<void> {
    const all = (await readAll()).filter(s => s.origin !== origin);
    try {
      await AsyncStorage.setItem(KEY, JSON.stringify(all));
    } catch (e) {
      console.warn('sitePrefs.remove error', e);
    }
  },

  async getAll(): Promise<SitePref[]> {
    return readAll();
  },

  async clear(): Promise<void> {
    try {
      await AsyncStorage.removeItem(KEY);
    } catch (e) {
      console.warn('sitePrefs.clear error', e);
    }
  },
};
