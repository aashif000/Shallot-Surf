import { addTorStatusListener, isOrbotInstalled, openOrbotAppOrStore, requestOrbotStart, TorStatus } from '@/services/tor/orbot';
import React, { useEffect, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';

export default function OrbotStatusPanel() {
  const [installed, setInstalled] = useState<boolean | null>(null);
  const [status, setStatus] = useState<TorStatus>('UNKNOWN');

  useEffect(() => {
    let unsub: (() => void) | null = null;
    (async () => {
      const ok = await isOrbotInstalled();
      setInstalled(ok);

      if (ok) {
        try {
          await requestOrbotStart(); // ask Orbot to send status
        } catch {
          // ignore
        }
      }
    })();

    unsub = addTorStatusListener((s) => setStatus(s));

    return () => {
      if (unsub) unsub();
    };
  }, []);

  const onAction = async () => {
    if (!installed) {
      await openOrbotAppOrStore();
      return;
    }
    try {
      await openOrbotAppOrStore();
    } catch {
      Alert.alert('Orbot', 'Unable to launch Orbot.');
    }
  };

  const color = status === 'ON' ? '#10b981' : status === 'STARTING' ? '#f59e0b' : '#ef4444';
  const label = status === 'ON' ? 'Connected' : status === 'STARTING' ? 'Starting' : status === 'OFF' ? 'Not connected' : 'Unknown';

  return (
    <View style={styles.wrap}>
      <View style={styles.info}>
        <View style={[styles.dot, { backgroundColor: color }]} />
        <Text style={styles.title}>Tor: {label}</Text>
      </View>

      <Pressable onPress={onAction} style={styles.btn}>
        <Text style={styles.btnText}>{installed ? 'Open Orbot' : 'Install Orbot'}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 8 },
  info: { flexDirection: 'row', alignItems: 'center' },
  dot: { width: 12, height: 12, borderRadius: 6, marginRight: 8 },
  title: { fontSize: 13, color: '#0f172a' },
  btn: { backgroundColor: '#0a84ff', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10 },
  btnText: { color: '#fff', fontWeight: '700' },
});
