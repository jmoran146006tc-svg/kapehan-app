import type { ReactNode } from 'react';
import { ScrollView, View, useWindowDimensions } from 'react-native';

export function AuthBody({ children }: { children: ReactNode }) {
  const { width } = useWindowDimensions();
  return (
    <ScrollView className="flex-1" contentContainerClassName="items-center pb-8" keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag">
      <View className="gap-5 py-6" style={{ width: Math.min(Math.max(width - 48, 0), 624) }}>
        {children}
      </View>
    </ScrollView>
  );
}
