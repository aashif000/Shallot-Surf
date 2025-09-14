// src/screens/SettingsScreen/BridgesSettingsScreen.tsx
import { Settings, settingsStore } from '@/services/storage/settingsStore';
import React, { useEffect, useState } from 'react';
import { Alert, Platform, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

const BRIDGES: Array<'obfs4' | 'meek' | 'snowflake' | 'custom'> = ['obfs4', 'meek', 'snowflake', 'custom'];

export default function BridgesSettingsScreen() {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [customBridge, setCustomBridge] = useState('');

  useEffect(() => {
    (async () => {
      const s = await settingsStore.get();
      setSettings(s);
      if (s.customBridge) setCustomBridge(s.customBridge);
    })();
  }, []);

  const updateBridgeType = async (type: typeof BRIDGES[number]) => {
    const updated = await settingsStore.set({ bridgeType: type });
    setSettings(updated);

    if (type === 'custom' && Platform.OS === 'ios') {
  Alert.prompt(
    'Custom Bridge',
    'Enter custom bridge configuration:',
    [
      {
        text: 'Cancel',
        style: 'cancel',
      },
      {
        text: 'Save',
        onPress: async (value: string | undefined) => {
          const updatedCustom = await settingsStore.set({ customBridge: value || '' });
          setCustomBridge(value || '');
          setSettings(updatedCustom);
        },
      },
    ],
    'plain-text',
    customBridge
  );}
}

  const renderBridgeButton = (type: typeof BRIDGES[number]) => (
    <TouchableOpacity
      key={type}
      style={[
        styles.bridgeBtn,
        settings?.bridgeType === type && { backgroundColor: '#0a84ff' },
      ]}
      onPress={() => updateBridgeType(type)}
    >
      <Text style={[styles.bridgeText, settings?.bridgeType === type && { color: '#fff' }]}>
        {type.toUpperCase()}
      </Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>Tor Bridges Configuration</Text>

      <View style={styles.bridgesContainer}>
        {BRIDGES.map(renderBridgeButton)}
      </View>

      {settings?.bridgeType === 'custom' && Platform.OS === 'android' && (
        <TextInput
          style={styles.input}
          placeholder="Enter custom bridge"
          value={customBridge}
          onChangeText={setCustomBridge}
          onEndEditing={async () => {
            const updated = await settingsStore.set({ customBridge });
            setSettings(updated);
          }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: '#f6fbff' },
  heading: { fontSize: 20, fontWeight: 'bold', marginBottom: 12 },
  bridgesContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  bridgeBtn: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: '#e2e8f0',
    margin: 4,
  },
  bridgeText: { fontWeight: 'bold', color: '#334155' },
  input: {
    marginTop: 16,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 12,
    padding: 10,
    backgroundColor: '#fff',
  },
});
