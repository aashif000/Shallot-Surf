import { ORBOT_PLAY_STORE, TOR_CHECK_URL } from '@/config/env';
import { Alert, Linking, NativeEventEmitter, NativeModules, Platform } from 'react-native';

const ORBOT_PACKAGE = 'org.torproject.android';
const ORBOT_URI = `${ORBOT_PACKAGE}://`;

const { TorModule } = NativeModules; // Native Kotlin module

/* ---------------------------------------------------------------------------
 * JS-only fallbacks (safe in Expo, non-native builds)
 * -------------------------------------------------------------------------*/

/** Check if Orbot is installed */
export async function isOrbotInstalled(): Promise<boolean> {
  if (Platform.OS !== 'android') return false;
  try {
    return await Linking.canOpenURL(ORBOT_URI);
  } catch {
    return false;
  }
}

/** Open Orbot app or fallback to Play Store */
export async function openOrbotApp(): Promise<boolean> {
  try {
    const can = await isOrbotInstalled();
    if (can) {
      await Linking.openURL(ORBOT_URI);
      return true;
    } else {
      Alert.alert(
        'Orbot not installed',
        'Orbot is required for routing through Tor. Open Play Store to install?',
        [
          { text: 'Open Play Store', onPress: () => Linking.openURL(ORBOT_PLAY_STORE) },
          { text: 'Cancel', style: 'cancel' },
        ],
      );
      return false;
    }
  } catch {
    try {
      Linking.openURL(ORBOT_PLAY_STORE);
    } catch {
      // ignore
    }
    return false;
  }
}

/** Fetch Tor check URL to verify connectivity */
export async function checkTorConnectivity(timeoutMs = 10000): Promise<{ ok: boolean; text?: string }> {
  try {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeoutMs);
    const resp = await fetch(TOR_CHECK_URL, { signal: controller.signal });
    clearTimeout(id);
    const text = await resp.text();
    const ok = /congratulation|you are using Tor/i.test(text);
    return { ok, text };
  } catch (e) {
    return { ok: false, text: (e as Error).message };
  }
}

/* ---------------------------------------------------------------------------
 * Native TorModule integration
 * -------------------------------------------------------------------------*/

const torEventEmitter = new NativeEventEmitter(TorModule);

export const subscribeTorStatus = (callback: (status: string) => void) => {
  const subscription = torEventEmitter.addListener('TorStatus', callback);
  return () => subscription.remove();
};

export const isTorRunning = async (): Promise<boolean> => {
  if (Platform.OS !== 'android' || !TorModule?.getStatus) return false;
  try {
    const status: string = await TorModule.getStatus();
    return status === 'connected' || status === 'running';
  } catch (e) {
    console.error('Tor status check failed:', e);
    return false;
  }
};

export const startTor = async (): Promise<void> => {
  if (Platform.OS !== 'android') {
    await openOrbotApp();
    return;
  }

  if (TorModule?.startTor) {
    try {
      await TorModule.startTor();
      console.log('Tor started');
    } catch (e) {
      console.error('Failed to start Tor:', e);
    }
  } else {
    await openOrbotApp();
  }
};

export const stopTor = async (): Promise<void> => {
  if (Platform.OS !== 'android' || !TorModule?.stopTor) return;
  try {
    await TorModule.stopTor();
    console.log('Tor stopped');
  } catch (e) {
    console.error('Failed to stop Tor:', e);
  }
};

/* ---------------------------------------------------------------------------
 * Unified torController API
 * -------------------------------------------------------------------------*/

export type TorStatus = 'stopped' | 'starting' | 'running' | 'error' | 'unknown';

export const torController = {
  async getStatus(): Promise<TorStatus> {
    if (TorModule?.getStatus) return TorModule.getStatus();
    return 'unknown';
  },
  async start(): Promise<void> {
    await startTor();
  },
  async stop(): Promise<void> {
    await stopTor();
  },
  async setBridges(bridges: string[]): Promise<void> {
    if (TorModule?.setBridges) return TorModule.setBridges(bridges);
    // fallback: not implemented
  },
  async enableBridges(enable = true): Promise<void> {
    if (TorModule?.enableBridges) return TorModule.enableBridges(enable);
    // fallback: not implemented
  },
};

export default torController;
