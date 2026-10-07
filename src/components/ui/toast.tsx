import { createContext, useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { View } from 'react-native';
import Animated, { Easing, FadeInDown, FadeOutDown, ReduceMotion } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Text } from '@/components/ui/text';
import { success, warning } from '@/lib/haptics';

export type ToastInput = { type: 'success' | 'error' | 'info'; message: string };
type ToastItem = ToastInput & { id: number };
export const ToastContext = createContext<{ showToast: (input: ToastInput) => void }>({ showToast: () => {} });

export function ToastProvider({ children }: { children: ReactNode }) {
  const insets = useSafeAreaInsets();
  const [items, setItems] = useState<ToastItem[]>([]);
  const nextId = useRef(0);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  const showToast = useCallback((input: ToastInput) => {
    if (input.type === 'success') success(); else if (input.type === 'error') warning();
    const id = ++nextId.current;
    setItems((current) => [...current.slice(-1), { ...input, id }]);
    timers.current.push(setTimeout(() => setItems((current) => current.filter((item) => item.id !== id)), 3000));
  }, []);

  return <ToastContext.Provider value={{ showToast }}>
    {children}
    <View pointerEvents="box-none" className="absolute left-4 right-4 z-50 items-center gap-2" style={{ bottom: Math.max(80, insets.bottom + 64) }}>
      {items.map((item) => <Animated.View key={item.id} entering={FadeInDown.duration(220).easing(Easing.out(Easing.cubic)).reduceMotion(ReduceMotion.System)} exiting={FadeOutDown.duration(150).reduceMotion(ReduceMotion.System)} style={{ width: '100%', maxWidth: 448 }}>
        <View className={item.type === 'info' ? 'rounded-md border border-border bg-secondary px-4 py-3' : item.type === 'success' ? 'rounded-md bg-primary px-4 py-3' : 'rounded-md bg-destructive px-4 py-3'}>
          <Text accessibilityRole="alert" className={item.type === 'info' ? 'text-sm font-medium text-foreground' : 'text-sm font-medium text-primary-foreground'}>{item.message}</Text>
        </View>
      </Animated.View>)}
    </View>
  </ToastContext.Provider>;
}
