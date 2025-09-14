// src/services/featureFlags.ts
import AsyncStorage from '@react-native-async-storage/async-storage';

export type FeatureFlags = { [key: string]: boolean };

const KEY = 'shallotsurf:featureFlags';

export const featureFlagsStore = {
  async getAll(): Promise<FeatureFlags> {
    try {
      const raw = await AsyncStorage.getItem(KEY);
      if (!raw) return {};
      return JSON.parse(raw) as FeatureFlags;
    } catch (e) {
      console.warn('featureFlags.getAll error', e);
      return {};
    }
  },

  async isEnabled(flag: string): Promise<boolean> {
    const all = await featureFlagsStore.getAll();
    return Boolean(all[flag]);
  },

  async set(flag: string, value: boolean): Promise<void> {
    try {
      const all = await featureFlagsStore.getAll();
      all[flag] = value;
      await AsyncStorage.setItem(KEY, JSON.stringify(all));
    } catch (e) {
      console.warn('featureFlags.set error', e);
    }
  },

  async clear(): Promise<void> {
    try {
      await AsyncStorage.removeItem(KEY);
    } catch (e) {
      console.warn('featureFlags.clear error', e);
    }
  },
};
