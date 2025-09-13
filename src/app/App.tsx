// src/app/App.tsx
import RootNavigator from '@/app/navigation/RootNavigator';
import { Ionicons } from '@expo/vector-icons';
import { NavigationContainer } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useState } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { SettingsProvider } from '../context/SettingsContext';

const App: React.FC = () => {
  const [fontsReady, setFontsReady] = useState(false);

  useEffect(() => {
    // ensure Ionicons font is loaded (helps in some dev-client or custom setups)
    try {
      // Ionicons has a static loadFont method; call it then mark ready
      // @ts-ignore - loadFont might not be in the type definitions
      if (typeof Ionicons.loadFont === 'function') {
        Ionicons.loadFont();
      }
    } catch (e) {
      // ignore - we still render (fallback will show text)
      console.warn('Ionicons.loadFont failed', e);
    } finally {
      // small delay not required, but ensure we render promptly
      setFontsReady(true);
    }
  }, []);

  if (!fontsReady) {
    // keep it simple; optionally render a small splash / loader
    return null;
  }

  return (
    <SettingsProvider> 
      <SafeAreaProvider>
        <NavigationContainer>
          <RootNavigator />
        </NavigationContainer>
        <StatusBar style="auto" />
      </SafeAreaProvider>
    </SettingsProvider>
  );
};

export default App;