// src/components/Browser/AddressBar.tsx
import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { Platform, Pressable, StyleSheet, TextInput, View } from 'react-native';

type AddressBarProps = {
  value: string;
  onChange: (val: string) => void;
  onSubmit: () => void;
  onReload: () => void;
  onToggleIncognito: () => void;
  testID?: string;
};

export default function AddressBar({
  value,
  onChange,
  onSubmit,
  onReload,
  onToggleIncognito,
  testID,
}: AddressBarProps) {
  const [focused, setFocused] = useState(false);

  return (
    <View style={[styles.container, focused && styles.focused]}>
      <Pressable onPress={onReload} style={styles.iconBtn} accessibilityLabel="Reload">
        <Ionicons name="reload" size={20} color="#0a84ff" />
      </Pressable>

      <TextInput
        style={styles.input}
        value={value}
        onChangeText={onChange}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        onSubmitEditing={onSubmit}
        placeholder="Search or enter URL"
        returnKeyType="go"
        autoCapitalize="none"
        keyboardType="url"
        testID={testID ?? 'address-bar'}
      />

      <Pressable onPress={onToggleIncognito} style={styles.iconBtn} accessibilityLabel="Toggle Incognito">
        <Ionicons name="eye" size={20} color={focused ? '#0a84ff' : '#334155'} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 12,
    marginVertical: 8,
    paddingHorizontal: 8,
    paddingVertical: 6,
    backgroundColor: '#fff',
    borderRadius: 12,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOpacity: 0.02, shadowRadius: 4, shadowOffset: { width: 0, height: 2 } },
      android: { elevation: 1 },
    }),
  },
  focused: {
    borderColor: '#0a84ff',
    borderWidth: 1,
  },
  input: { flex: 1, marginHorizontal: 8, paddingVertical: 6, color: '#081226' },
  iconBtn: { padding: 6 },
});
