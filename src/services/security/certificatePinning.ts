// src/services/security/certificatePinning.ts
import AsyncStorage from '@react-native-async-storage/async-storage';

export type PinEntry = {
  host: string;
  pins: string[]; // base64 or hex SPKI pins
  createdAt: number;
  note?: string;
};

const PINS_KEY = 'shallotsurf:certPins';

export const pinManager = {
  async getAll(): Promise<PinEntry[]> {
    try {
      const raw = await AsyncStorage.getItem(PINS_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw) as PinEntry[];
      return parsed;
    } catch (e) {
      console.warn('pinManager.getAll error', e);
      return [];
    }
  },

  async setAll(entries: PinEntry[]): Promise<void> {
    try {
      await AsyncStorage.setItem(PINS_KEY, JSON.stringify(entries));
    } catch (e) {
      console.warn('pinManager.setAll error', e);
    }
  },

  async add(entry: PinEntry): Promise<void> {
    const all = await pinManager.getAll();
    const filtered = all.filter(p => p.host !== entry.host);
    filtered.push(entry);
    await pinManager.setAll(filtered);
  },

  async remove(host: string): Promise<void> {
    const all = (await pinManager.getAll()).filter(p => p.host !== host);
    await pinManager.setAll(all);
  },

  async clear(): Promise<void> {
    try {
      await AsyncStorage.removeItem(PINS_KEY);
    } catch (e) {
      console.warn('pinManager.clear error', e);
    }
  },
};
