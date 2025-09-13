// src/context/SettingsContext.tsx
import {
  DEFAULT_SETTINGS,
  Settings,
  settingsStore,
  subscribe as subscribeSettings,
} from '@/services/storage/settingsStore';
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

type SettingsContextType = {
  settings: Settings;
  loading: boolean;
  update: (patch: Partial<Settings>) => Promise<void>;
  reset: () => Promise<void>;
};

const SettingsContext = createContext<SettingsContextType>({
  settings: DEFAULT_SETTINGS,
  loading: true,
  update: async () => {},
  reset: async () => {},
});

export const useSettings = () => useContext(SettingsContext);

export const SettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState<boolean>(true);

  // Load settings on mount
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const s = await settingsStore.get();
        if (!mounted) return;
        setSettings(s);
      } catch (e) {
        console.warn('SettingsProvider load error', e);
        setSettings(DEFAULT_SETTINGS);
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

  // Subscribe to external changes (settingsStore.notify)
  useEffect(() => {
    // subscribeSettings returns a function that ultimately returns boolean (Set.delete result).
    // Wrap the unsubscribe call so the cleanup returns void (as required by useEffect).
    const unsubscribe = subscribeSettings((s: Settings) => {
      setSettings(s);
    });

    return () => {
      // call unsubscribe and ignore its return value so this cleanup returns void
      try {
        // Some implementations might return undefined; handle both cases.
        unsubscribe && unsubscribe();
      } catch (e) {
        // swallow to avoid throwing inside React cleanup
      }
    };
  }, []);

  const update = useCallback(async (patch: Partial<Settings>) => {
    const merged = await settingsStore.set(patch);
    setSettings(merged);
  }, []);

  const reset = useCallback(async () => {
    const s = await settingsStore.reset();
    setSettings(s);
  }, []);

  const value = useMemo(
    () => ({
      settings,
      loading,
      update,
      reset,
    }),
    [settings, loading, update, reset],
  );

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
};
