// File: src/components/OrbotLauncher.tsx
import React, { useEffect, useState } from 'react';
import { Linking, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const ORBOT_PACKAGE = 'org.torproject.android';
const ORBOT_MARKET = `market://details?id=${ORBOT_PACKAGE}`;
const ORBOT_PLAY_URL = `https://play.google.com/store/apps/details?id=${ORBOT_PACKAGE}`;

export default function OrbotLauncher() {
  const [isInstalled, setIsInstalled] = useState<boolean | null>(null);

  useEffect(() => {
    async function check() {
      try {
        // attempt to open package URI on Android; fallback logic is conservative
        const canOpen = await Linking.canOpenURL(`market://details?id=${ORBOT_PACKAGE}`);
        setIsInstalled(canOpen);
      } catch (e) {
        setIsInstalled(false);
      }
    }
    check();
  }, []);

  const openOrbot = async () => {
    try {
      // Try deep link to the Orbot app first
      const orbotUri = `${ORBOT_PACKAGE}://`;
      const canOpen = await Linking.canOpenURL(orbotUri);
      if (canOpen) {
        await Linking.openURL(orbotUri);
        return;
      }
      // If deep link not available, open Play Store
      await Linking.openURL(Platform.OS === 'android' ? ORBOT_MARKET : ORBOT_PLAY_URL);
    } catch (err) {
      // Fallback to web Play Store
      await Linking.openURL(ORBOT_PLAY_URL);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Orbot</Text>
      <Text style={styles.body}>
        {isInstalled === null
          ? 'Checking Orbot...'
          : isInstalled
          ? 'Orbot may be available on this device. Use the button below to open or check status.'
          : 'Orbot does not appear to be installed. Open Play Store to install.'}
      </Text>
      <TouchableOpacity style={styles.button} onPress={openOrbot}>
        <Text style={styles.buttonText}>{isInstalled ? 'Open Orbot / Status' : 'Install Orbot on Play Store'}</Text>
      </TouchableOpacity>
      <Text style={styles.note}>
        Note: Determining if Orbot is actually running requires a native bridge that listens for Orbot status intents. This component opens Orbot or Play Store; a native module can be wired to report runtime status.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {padding: 16, backgroundColor: 'white', borderRadius: 10, margin: 12},
  title: {fontSize: 18, fontWeight: '700', marginBottom: 6},
  body: {fontSize: 14, marginBottom: 12},
  button: {padding: 12, borderRadius: 8, backgroundColor: '#0f172a', alignItems: 'center'},
  buttonText: {color: 'white', fontWeight: '600'},
  note: {fontSize: 12, marginTop: 10, color: '#374151'},
});

