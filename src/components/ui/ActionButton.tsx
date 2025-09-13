import { Colors, Motion, Radii, Shadows, Typography } from '@/constants/design';
import React from 'react';
import { Animated, Platform, Pressable, StyleSheet, Text } from 'react-native';

type ActionButtonProps = {
  label: string;
  icon?: React.ReactNode;
  onPress: () => void;
  testID?: string;
};

export default function ActionButton({ label, icon, onPress, testID }: ActionButtonProps) {
  const scale = new Animated.Value(1);

  const handlePressIn = () => Animated.spring(scale, { toValue: Motion.pressScale, useNativeDriver: true }).start();
  const handlePressOut = () => Animated.spring(scale, { toValue: 1, useNativeDriver: true }).start();

  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <Pressable
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={styles.button}
        accessibilityLabel={label}
        testID={testID}
      >
        {icon}
        <Text style={styles.label}>{label}</Text>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
    borderRadius: Radii.medium,
    paddingVertical: 10,
    paddingHorizontal: 16,
    minHeight: 44,
    ...Platform.select({
      ios: { ...Shadows.card },
      android: { elevation: 2 },
    }),
  },
  label: {
    fontSize: Typography.body.fontSize,
    fontWeight: '600',
    color: '#fff',
    marginLeft: 8,
  },
});
