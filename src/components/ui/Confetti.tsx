// src/components/UI/Confetti.tsx
import React, { useEffect, useMemo, useRef } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';

type ConfettiProps = {
  visible: boolean;
  onComplete?: () => void;
  particleCount?: number;
  durationMs?: number;
};

/**
 * Small, dependency-free confetti micro-animation.
 * Plays a short burst of colored circles that float up and fade.
 * - No external libraries.
 * - Good for micro-feedback (New Identity).
 */
export default function Confetti({
  visible,
  onComplete,
  particleCount = 12,
  durationMs = 900,
}: ConfettiProps) {
  const anim = useRef(new Animated.Value(0)).current;

  // generate particle random seeds once
  const particles = useMemo(
    () =>
      new Array(particleCount).fill(0).map((_, i) => ({
        id: i,
        // horizontal offset -100..100
        x: (Math.random() * 200 - 100),
        // initial scale
        s: 0.8 + Math.random() * 0.7,
        // color palette
        color: ['#0A84FF', '#7C3AED', '#22C55E', '#F59E0B', '#EF4444'][Math.floor(Math.random() * 5)],
        // rotation
        r: Math.floor(Math.random() * 360),
      })),
    [particleCount],
  );

  useEffect(() => {
    if (!visible) return;
    anim.setValue(0);
    Animated.timing(anim, {
      toValue: 1,
      duration: durationMs,
      easing: Easing.out(Easing.exp),
      useNativeDriver: true,
    }).start(() => {
      // wait a moment and fire onComplete
      if (typeof onComplete === 'function') {
        try {
          onComplete();
        } catch {}
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  if (!visible) return null;

  return (
    <View pointerEvents="none" style={styles.container} testID="confetti-root">
      {particles.map(p => {
        const translateY = anim.interpolate({
          inputRange: [0, 1],
          outputRange: [0, -180 - Math.abs(p.x) * 0.2],
        });

        const translateX = anim.interpolate({
          inputRange: [0, 1],
          outputRange: [0, p.x],
        });

        const opacity = anim.interpolate({
          inputRange: [0, 0.6, 1],
          outputRange: [1, 0.9, 0],
        });

        const scale = anim.interpolate({
          inputRange: [0, 0.5, 1],
          outputRange: [0.2, p.s, p.s * 0.9],
        });

        const rotate = anim.interpolate({
          inputRange: [0, 1],
          outputRange: ['0deg', `${p.r + 360}deg`],
        });

        return (
          <Animated.View
            key={`c-${p.id}`}
            style={[
              styles.particle,
              {
                backgroundColor: p.color,
                transform: [{ translateX }, { translateY }, { scale }, { rotate }],
                opacity,
              },
            ]}
          />
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 80,
    height: 280,
    alignItems: 'center',
    justifyContent: 'flex-start',
    zIndex: 9999,
  },
  particle: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginHorizontal: 2,
    marginVertical: 2,
    // shadow for subtle depth
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
  },
});
