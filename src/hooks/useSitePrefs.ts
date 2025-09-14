// src/hooks/useSitePrefs.ts
import { SitePref, sitePrefsStore } from '@/services/storage/sitePrefs';
import { useCallback, useEffect, useState } from 'react';

export function useSitePrefs(origin?: string) {
  const [pref, setPref] = useState<SitePref | null>(null);
  const [loading, setLoading] = useState<boolean>(!!origin);

  useEffect(() => {
    if (!origin) {
      setPref(null);
      setLoading(false);
      return;
    }
    let mounted = true;
    (async () => {
      setLoading(true);
      const p = await sitePrefsStore.get(origin);
      if (!mounted) return;
      setPref(p);
      setLoading(false);
    })();
    return () => {
      mounted = false;
    };
  }, [origin]);

  const save = useCallback(async (patch: Partial<SitePref>) => {
    if (!origin) return null;
    const current = (await sitePrefsStore.get(origin)) ?? { origin };
    const merged: SitePref = { ...current, ...patch, origin, createdAt: Date.now() };
    const saved = await sitePrefsStore.set(merged);
    setPref(saved);
    return saved;
  }, [origin]);

  const remove = useCallback(async () => {
    if (!origin) return;
    await sitePrefsStore.remove(origin);
    setPref(null);
  }, [origin]);

  return { pref, loading, save, remove };
}
