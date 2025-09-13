// src/services/native/orbot.ts
import { Linking, Platform } from 'react-native';

export async function isOrbotInstalled(): Promise<boolean> {
  if (Platform.OS !== 'android') return false;
  try {
    // deep link scheme for Orbot
    const url = 'org.torproject.android://';
    return await Linking.canOpenURL(url);
  } catch {
    return false;
  }
}

export async function openOrbotOrStore(): Promise<void> {
  if (Platform.OS !== 'android') return;
  try {
    const url = 'org.torproject.android://';
    const can = await Linking.canOpenURL(url);
    if (can) {
      await Linking.openURL(url);
      return;
    }
    // fallback to Play Store
    const play = 'https://play.google.com/store/apps/details?id=org.torproject.android';
    await Linking.openURL(play);
  } catch (e) {
    console.warn('openOrbotOrStore error', e);
  }
}
