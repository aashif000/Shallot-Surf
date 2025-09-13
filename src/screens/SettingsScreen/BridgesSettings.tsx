import { settingsStore } from '@/services/storage/settingsStore';
import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const BRIDGES = ['obfs4', 'meek', 'snowflake'] as const;

export default function BridgesSettings() {
  const [selected, setSelected] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      const s = await settingsStore.get();
      setSelected(s.selectedBridge ?? null);
    };
    load();
  }, []);

  const selectBridge = async (bridge: typeof BRIDGES[number]) => {
    setSelected(bridge);
    await settingsStore.set({ selectedBridge: bridge });
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Tor Bridges (UI Placeholder)</Text>
      {BRIDGES.map((b) => (
        <TouchableOpacity
          key={b}
          style={[
            styles.bridgeBtn,
            selected === b && { backgroundColor: '#0a84ff' },
          ]}
          onPress={() => selectBridge(b)}
        >
          <Text style={[styles.bridgeText, selected === b && { color: '#fff' }]}>{b}</Text>
        </TouchableOpacity>
      ))}
      <Text style={styles.note}>* Native integration pending</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16 },
  title: { fontSize: 18, fontWeight: 'bold', marginBottom: 12 },
  bridgeBtn: {
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#0a84ff',
    marginBottom: 8,
  },
  bridgeText: { color: '#0a84ff', textAlign: 'center' },
  note: { marginTop: 12, fontSize: 12, color: '#888' },
});
