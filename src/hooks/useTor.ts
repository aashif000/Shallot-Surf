// src/hooks/useTor.ts
import * as torController from '@/services/tor/torController';
import { useCallback, useEffect, useState } from 'react';

/**
 * useTor - lightweight wrapper exposing Orbot/Tor state & helpers
 *
 * Provides:
 *  - orbotInstalled: boolean | null (null = unknown)
 *  - torConnected: boolean | null (null = unknown)
 *  - checkTor: () => Promise<boolean>
 *  - openOrbot: () => Promise<boolean>
 *
 * This is a UI-first hook that uses the JS torController (safe in Expo Go).
 * When you add native tor-module, torController can call native APIs and this hook continues to work.
 */

export default function useTor(pollOnMount = false) {
  const [orbotInstalled, setOrbotInstalled] = useState<boolean | null>(null);
  const [torConnected, setTorConnected] = useState<boolean | null>(null);
  const [checking, setChecking] = useState(false);

  const refreshOrbotInstalled = useCallback(async () => {
    try {
      const ok = await torController.isOrbotInstalled();
      setOrbotInstalled(ok);
      return ok;
    } catch {
      setOrbotInstalled(false);
      return false;
    }
  }, []);

  const checkTor = useCallback(async (timeoutMs = 8000) => {
    setChecking(true);
    try {
      const res = await torController.checkTorConnectivity(timeoutMs);
      setTorConnected(res.ok);
      return res.ok;
    } catch {
      setTorConnected(false);
      return false;
    } finally {
      setChecking(false);
    }
  }, []);

  const openOrbot = useCallback(async () => {
    const ok = await torController.openOrbotApp();
    // after attempting to open, refresh installed status
    await refreshOrbotInstalled();
    return ok;
  }, [refreshOrbotInstalled]);

  useEffect(() => {
    (async () => {
      await refreshOrbotInstalled();
      if (pollOnMount) {
        await checkTor();
      }
    })();
  }, [pollOnMount, refreshOrbotInstalled, checkTor]);

  return {
    orbotInstalled,
    torConnected,
    checking,
    refreshOrbotInstalled,
    checkTor,
    openOrbot,
  };
}
