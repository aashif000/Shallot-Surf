// src/components/UI/OptionRow.tsx
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';

type OptionRowProps = {
  label: string;
  subtitle?: string;
  onPress: () => void;
  testID?: string;
};

export default function OptionRow({ label, subtitle, onPress, testID }: OptionRowProps) {
  return (
    <Pressable onPress={onPress} style={styles.row} testID={testID}>
      <View>
        <Text style={styles.label}>{label}</Text>
        {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
      </View>
      <Ionicons name="chevron-forward" size={20} color="#334155" />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 14,
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 6,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOpacity: 0.02, shadowRadius: 2, shadowOffset: { width: 0, height: 1 } },
      android: { elevation: 1 },
    }),
  },
  label: { fontSize: 15, fontWeight: '600', color: '#081226' },
  subtitle: { fontSize: 13, color: '#556', marginTop: 2 },
});
