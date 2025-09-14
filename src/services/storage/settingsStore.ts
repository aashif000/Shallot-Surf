// src/services/storage/settingsStore.ts
import AsyncStorage from '@react-native-async-storage/async-storage';

export type FingerprintProtections = {
  canvas: boolean;
  webgl: boolean;
  audio: boolean;
};

export type Settings = {
  useTor: boolean;
  incognitoMode: boolean;
  defaultSearchEngine: 'duckduckgo' | 'google' | 'startpage';
  httpsOnly: boolean;
  disableJS: boolean;
  firstPartyIsolation: boolean;
  dohProvider?: string | null;
  safeBrowsing: 'off' | 'standard' | 'enhanced';
  clearOnExit: boolean;
  fingerprintProtections: FingerprintProtections;
  telemetryEnabled: boolean;
  highContrast?: boolean;
  selectedBridge?: 'obfs4' | 'meek' | 'snowflake';
  bridgeType?: 'obfs4' | 'meek' | 'snowflake' | 'custom';
  customBridge?: string;
};

const STORAGE_KEY = 'shallotsurf:settings';

export const DEFAULT_SETTINGS: Settings = {
  useTor: false,
  incognitoMode: false,
  defaultSearchEngine: 'duckduckgo',
  httpsOnly: true,
  disableJS: false,
  firstPartyIsolation: false,
  dohProvider: null,
  safeBrowsing: 'standard',
  clearOnExit: true,
  fingerprintProtections: { canvas: true, webgl: true, audio: true },
  telemetryEnabled: false,
  highContrast: false,
  bridgeType: 'obfs4',
  customBridge: '',
};

type Subscriber = (s: Settings) => void;

const subscribers = new Set<Subscriber>();

export const subscribe = (cb: Subscriber) => {
  subscribers.add(cb);
  return () => subscribers.delete(cb);
};

const notify = (s: Settings) => {
  for (const cb of Array.from(subscribers)) cb(s);
};

export const settingsStore = {
  async get(): Promise<Settings> {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      if (!raw) return DEFAULT_SETTINGS;
      const parsed = JSON.parse(raw) as Partial<Settings>;
      return { ...DEFAULT_SETTINGS, ...parsed };
    } catch (e) {
      console.warn('settingsStore.get error', e);
      return DEFAULT_SETTINGS;
    }
  },

  async set(patch: Partial<Settings>): Promise<Settings> {
    try {
      const cur = await settingsStore.get();
      const merged = { ...cur, ...patch };
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
      notify(merged);
      return merged;
    } catch (e) {
      console.warn('settingsStore.set error', e);
      return settingsStore.get();
    }
  },

  async reset(): Promise<Settings> {
    try {
      await AsyncStorage.removeItem(STORAGE_KEY);
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_SETTINGS));
      notify(DEFAULT_SETTINGS);
      return DEFAULT_SETTINGS;
    } catch (e) {
      console.warn('settingsStore.reset error', e);
      return DEFAULT_SETTINGS;
    }
  },
};

export const DEFAULT_DOH = 'https://dns.google/dns-query';

export const getSettings = async (): Promise<Settings> => {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_SETTINGS;
    return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
  } catch (e) {
    console.warn('getSettings error', e);
    return DEFAULT_SETTINGS;
  }
};

export const setDOHProvider = async (url: string | null): Promise<Settings> => {
  // Update dohProvider instead of dohEndpoint
  const cur = await getSettings();
  const merged: Settings = { ...cur, dohProvider: url };
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
  // notify subscribers
  notify(merged);
  return merged;
};