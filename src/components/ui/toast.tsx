import { createContext, useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { View } from 'react-native';
import Animated, { FadeInDown, FadeOutDown } from 'react-native-reanimated';
import { Text } from '@/components/ui/text';

export type ToastInput = { type: 'success' | 'error'; message: string };
type ToastItem = ToastInput & { id: number };
export const ToastContext = createContext<{ showToast: (input: ToastInput) => void }>({ showToast: () => {} });

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);
  const nextId = useRef(0);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  const showToast = useCallback((input: ToastInput) => {
    const id = ++nextId.current;
    setItems((current) => [...current.slice(-1), { ...input, id }]);
    timers.current.push(setTimeout(() => setItems((current) => current.filter((item) => item.id !== id)), 3000));
  }, []);

  return <ToastContext.Provider value={{ showToast }}>
    {children}
    <View pointerEvents="box-none" className="absolute bottom-20 left-4 right-4 z-50 items-center gap-2">
      {items.map((item) => <Animated.View key={item.id} entering={FadeInDown.duration(220)} exiting={FadeOutDown.duration(220)}
        className={item.type === 'success' ? 'max-w-md rounded-full bg-success px-5 py-3 shadow-lg' : 'max-w-md rounded-full bg-destructive px-5 py-3 shadow-lg'}>
        <Text accessibilityRole="alert" className={item.type === 'success' ? 'text-center text-success-foreground' : 'text-center text-destructive-foreground'}>{item.message}</Text>
      </Animated.View>)}
    </View>
  </ToastContext.Provider>;
}
