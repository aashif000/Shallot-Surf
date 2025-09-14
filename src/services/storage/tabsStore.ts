// src/services/storage/tabsStore.ts
import AsyncStorage from '@react-native-async-storage/async-storage';
import CryptoJS from 'crypto-js';
import * as SecureStore from 'expo-secure-store';

export type PersistedTab = { id: string; url: string; title?: string; createdAt?: number };

const STORAGE_KEY = 'shallotsurf:tabs';
const SECRET_KEY_KEY = 'shallotsurf:aesKey';

// Helper: get AES key from secure storage or generate a new one
async function getSecretKey(): Promise<string> {
  let key = await SecureStore.getItemAsync(SECRET_KEY_KEY);
  if (!key) {
    key = CryptoJS.lib.WordArray.random(32).toString(); // 256-bit key
    await SecureStore.setItemAsync(SECRET_KEY_KEY, key, { keychainAccessible: SecureStore.ALWAYS_THIS_DEVICE_ONLY });
  }
  return key;
}

async function readAll(): Promise<PersistedTab[]> {
  try {
    const encrypted = await AsyncStorage.getItem(STORAGE_KEY);
    if (!encrypted) return [];

    const key = await getSecretKey();
    const bytes = CryptoJS.AES.decrypt(encrypted, key);
    const decrypted = bytes.toString(CryptoJS.enc.Utf8);
    return JSON.parse(decrypted) as PersistedTab[];
  } catch (e) {
    console.warn('tabsStore.readAll error', e);
    return [];
  }
}

async function writeAll(tabs: PersistedTab[]) {
  try {
    const key = await getSecretKey();
    const json = JSON.stringify(tabs);
    const encrypted = CryptoJS.AES.encrypt(json, key).toString();
    await AsyncStorage.setItem(STORAGE_KEY, encrypted);
  } catch (e) {
    console.warn('tabsStore.writeAll error', e);
  }
}

export const tabsStore = {
  async getAll(): Promise<PersistedTab[]> {
    return readAll();
  },

  async setAll(tabs: PersistedTab[]): Promise<void> {
    await writeAll(tabs);
  },

  async add(tab: PersistedTab): Promise<void> {
    const all = await readAll();
    const filtered = all.filter(t => t.id !== tab.id);
    filtered.push({ ...tab, createdAt: Date.now() });
    await writeAll(filtered);
  },

  async remove(id: string): Promise<void> {
    const all = (await readAll()).filter(t => t.id !== id);
    await writeAll(all);
  },

  async clear(): Promise<void> {
    try {
      await AsyncStorage.removeItem(STORAGE_KEY);
    } catch (e) {
      console.warn('tabsStore.clear error', e);
    }
  },
};
