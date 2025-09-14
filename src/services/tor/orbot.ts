// src/services/tor/orbot.ts
import { NativeEventEmitter, NativeModules, Platform } from 'react-native';

const { TorModule } = NativeModules as any;

export type TorStatus = 'ON' | 'OFF' | 'STARTING' | 'STOPPING' | 'UNKNOWN';

const emitter = TorModule ? new NativeEventEmitter(TorModule) : null;

export async function isOrbotInstalled(): Promise<boolean> {
  if (Platform.OS !== 'android' || !TorModule) return false;
  try {
    return await TorModule.isOrbotInstalled();
  } catch {
    return false;
  }
}

export async function openOrbotAppOrStore(): Promise<boolean> {
  if (Platform.OS !== 'android' || !TorModule) return false;
  try {
    return await TorModule.openOrbotAppOrStore();
  } catch {
    return false;
  }
}

export async function requestOrbotStart(): Promise<boolean> {
  if (Platform.OS !== 'android' || !TorModule) return false;
  try {
    return await TorModule.requestOrbotStart();
  } catch {
    return false;
  }
}

export function stopOrbotStatusListener(): void {
  if (Platform.OS !== 'android' || !TorModule) return;
  TorModule.stopStatusListener();
}

export function addTorStatusListener(cb: (status: TorStatus) => void) {
  if (!emitter) {
    return () => {};
  }
  const sub = emitter.addListener('TorStatus', (s: string) => {
    cb((s ?? 'UNKNOWN') as TorStatus);
  });
  return () => sub.remove();
}
