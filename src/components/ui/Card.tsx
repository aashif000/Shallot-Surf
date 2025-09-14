// src/components/ui/Card.tsx
import React from 'react';
import { Text, View } from 'react-native';

export function Card({ title, children }: { title?: string; children: React.ReactNode }) {
  return (
    <View className="bg-white rounded-xl p-4 shadow-md">
      {title ? (
        <Text className="text-base font-semibold mb-2 text-gray-900">
          {title}
        </Text>
      ) : null}
      <View>{children}</View>
    </View>
  );
}
