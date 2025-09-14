
// File: src/screens/SettingsScreen/NetworkSecuritySettings.tsx
import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { useEffect, useState } from 'react';
import { Alert, StyleSheet, Switch, Text, TextInput, TouchableOpacity, View } from 'react-native';

const STORAGE_KEYS = {
  dohUrl: '@app:doh_url',
  certPins: '@app:cert_pins',
  dohEnabled: '@app:doh_enabled',
};

export default function NetworkSecuritySettings() {
  const [dohEnabled, setDohEnabled] = useState(false);
  const [dohUrl, setDohUrl] = useState('https://dns.google/dns-query');
  const [pins, setPins] = useState<string[]>([]);
  const [newPin, setNewPin] = useState('');

  useEffect(() => {
    (async () => {
      const storedDoh = await AsyncStorage.getItem(STORAGE_KEYS.dohUrl);
      const storedPins = await AsyncStorage.getItem(STORAGE_KEYS.certPins);
      const storedDohEnabled = await AsyncStorage.getItem(STORAGE_KEYS.dohEnabled);
      if (storedDoh) setDohUrl(storedDoh);
      if (storedPins) setPins(JSON.parse(storedPins));
      if (storedDohEnabled) setDohEnabled(storedDohEnabled === 'true');
    })();
  }, []);

  const saveDoh = async () => {
    await AsyncStorage.setItem(STORAGE_KEYS.dohUrl, dohUrl);
    await AsyncStorage.setItem(STORAGE_KEYS.dohEnabled, String(dohEnabled));
    Alert.alert('Saved', 'DOH settings saved. Native networking stack must respect DOH setting to be effective.');
  };

  const addPin = async () => {
    if (!newPin) return;
    const copy = [...pins, newPin.trim()];
    setPins(copy);
    setNewPin('');
    await AsyncStorage.setItem(STORAGE_KEYS.certPins, JSON.stringify(copy));
  };

  const removePin = async (idx: number) => {
    const copy = pins.filter((_, i) => i !== idx);
    setPins(copy);
    await AsyncStorage.setItem(STORAGE_KEYS.certPins, JSON.stringify(copy));
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Network Security</Text>

      <View style={styles.rowInlineCenter}>
        <Text style={styles.label}>Use DNS-over-HTTPS (DOH)</Text>
        <Switch value={dohEnabled} onValueChange={setDohEnabled} />
      </View>

      <TextInput value={dohUrl} onChangeText={setDohUrl} style={styles.input} placeholder="DOH URL (e.g. https://dns.google/dns-query)" />
      <TouchableOpacity style={styles.saveBtn} onPress={saveDoh}>
        <Text style={styles.saveText}>Save DOH Settings</Text>
      </TouchableOpacity>

      <Text style={styles.subTitle}>Certificate Pinning</Text>
      <Text style={styles.description}>Add base64-encoded SPKI hashes (sha256) to pin against TLS certificates for critical hosts.</Text>

      {pins.map((p, idx) => (
        <View key={idx} style={styles.pinRow}>
          <Text style={styles.pinText}>{p}</Text>
          <TouchableOpacity onPress={() => removePin(idx)}>
            <Text style={styles.removeText}>Remove</Text>
          </TouchableOpacity>
        </View>
      ))}

      <TextInput value={newPin} onChangeText={setNewPin} placeholder="sha256-base64-pin" style={styles.input} />
      <TouchableOpacity style={styles.addBtn} onPress={addPin}>
        <Text style={styles.addText}>Add Pin</Text>
      </TouchableOpacity>

      <Text style={styles.note}>
        Note: This UI stores pins and DOH URL in AsyncStorage. You must wire the native/network stack to read these values and enforce DOH and pinning at the transport layer (OkHttp network interceptor / native TLS pinning).
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {padding: 16},
  title: {fontSize: 18, fontWeight: '700', marginBottom: 8},
  rowInlineCenter: {flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8},
  label: {fontSize: 14},
  input: {borderWidth: 1, borderColor: '#e5e7eb', padding: 10, borderRadius: 8, marginBottom: 8},
  saveBtn: {padding: 12, borderRadius: 8, backgroundColor: '#0f172a', alignItems: 'center', marginBottom: 12},
  saveText: {color: 'white'},
  subTitle: {fontSize: 16, fontWeight: '700', marginTop: 12},
  description: {fontSize: 13, marginBottom: 8, color: '#6b7280'},
  pinRow: {flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8},
  pinText: {flex: 1, marginRight: 8},
  removeText: {color: '#ef4444'},
  addBtn: {padding: 10, borderRadius: 8, borderWidth: 1, borderColor: '#0f172a', alignItems: 'center'},
  addText: {fontWeight: '600'},
  note: {fontSize: 12, marginTop: 12, color: '#6b7280'},
});

