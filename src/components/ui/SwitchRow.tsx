// src/components/UI/SwitchRow.tsx
import { Colors, Radii, Shadows, Typography } from '@/constants/design';
import React from 'react';
import {
  GestureResponderEvent,
  Platform,
  Pressable,
  StyleSheet,
  Switch,
  Text,
  View,
} from 'react-native';

type SwitchRowProps = {
  label: string;
  /** optional subtitle / hint shown under the label */
  subtitle?: string;
  value: boolean;
  /** called when Switch changes (or when the row is pressed) */
  onToggle: (v: boolean) => void;
  testID?: string;
  /** optional accessibility hint */
  accessibilityHint?: string;
};

/**
 * SwitchRow
 * Futuristic-minimal row with label + subtitle and a platform-native Switch.
 * - Uses centralized design tokens (Colors, Typography, Radii, Shadows)
 * - Large touch target: row itself is pressable to toggle
 * - Exposes testID & accessibilityLabel/hint
 */
export default function SwitchRow({
  label,
  subtitle,
  value,
  onToggle,
  testID,
  accessibilityHint,
}: SwitchRowProps) {
  const onPressRow = (_e?: GestureResponderEvent) => {
    onToggle(!value);
  };

  return (
    <Pressable
      onPress={onPressRow}
      style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
      testID={testID}
      accessibilityRole="switch"
      accessibilityState={{ checked: value }}
      accessibilityLabel={label}
      accessibilityHint={accessibilityHint}
    >
      <View style={styles.textWrap}>
        <Text style={styles.label}>{label}</Text>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      </View>

      <Switch
        value={value}
        onValueChange={onToggle}
        trackColor={{ true: Colors.primary, false: Colors.border }}
        thumbColor={Platform.OS === 'android' ? (value ? Colors.primary : Colors.surface) : undefined}
        ios_backgroundColor={Colors.border}
        accessibilityLabel={`${label} switch`}
        testID={testID ? `${testID}-switch` : undefined}
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 16,
    backgroundColor: Colors.surface,
    borderRadius: Radii.medium,
    marginBottom: 8,
    minHeight: 48,
    // Apply shadow tokens for a soft, futuristic lift
    ...Shadows.card,
  },
  rowPressed: {
    opacity: 0.96,
    transform: [{ scale: 0.998 }],
  },
  textWrap: {
    flex: 1,
    paddingRight: 12, // give space between text and switch
  },
  label: {
    fontSize: Typography.body.fontSize,
    fontWeight: (Typography.body.fontWeight as any) ?? '500',
    color: Colors.muted2,
  },
  subtitle: {
    marginTop: 4,
    fontSize: 13,
    color: Colors.muted,
  },
});
