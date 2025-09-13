// src/services/tor/torController.ts
import { ORBOT_PLAY_STORE, TOR_CHECK_URL } from '@/config/env';
import { Alert, Linking, Platform } from 'react-native';

// NOTE: This file is intentionally JS-only.
// Real programmatic control of Orbot/tor requires a native bridge (Kotlin) later.
// These helpers are safe to use in Expo Go for detection and guidance.

const ORBOT_PACKAGE = 'org.torproject.android';
const ORBOT_URI = `${ORBOT_PACKAGE}://`;

/** canOpenOrbotUri - performs Linking.canOpenURL for Orbot URI */
export async function isOrbotInstalled(): Promise<boolean> {
  if (Platform.OS !== 'android') return false;
  try {
    // On Android 11+, package visibility may hide the result unless <queries> is present in manifest.
    return await Linking.canOpenURL(ORBOT_URI);
  } catch (e) {
    return false;
  }
}

/** openOrbotApp - open Orbot if installed, otherwise open Play Store */
export async function openOrbotApp() {
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
  } catch (e) {
    try {
      Linking.openURL(ORBOT_PLAY_STORE);
    } catch {
      // ignore
    }
    return false;
  }
}

/**
 * checkTorConnectivity
 * - Attempts to fetch the Tor check page. This will only indicate Tor routing
 *   if the device/app is actually routed through Tor (e.g., Orbot VPN mode enabled).
 */
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

/**
 * Note: later native features you may want to add:
 * - programmatic start/stop of Orbot
 * - query Orbot status and torified apps
 * - fetch Orbot local proxy ports
 *
 * When ready, create an android-native-module/tor-module and expose methods via React Native bridge.
 */
