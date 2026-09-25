import { createContext, useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { View } from 'react-native';
import Animated, { FadeInDown, FadeOutDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Check, CircleAlert } from 'lucide-react-native';
import { Text } from '@/components/ui/text';
import { Icon } from '@/components/ui/icon';

export type ToastInput = { type: 'success' | 'error'; message: string };
type ToastItem = ToastInput & { id: number };
export const ToastContext = createContext<{ showToast: (input: ToastInput) => void }>({ showToast: () => {} });

export function ToastProvider({ children }: { children: ReactNode }) {
  const insets = useSafeAreaInsets();
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
    <View pointerEvents="box-none" className="absolute left-4 right-4 z-50 items-center gap-2" style={{ bottom: Math.max(80, insets.bottom + 64) }}>
      {items.map((item) => <Animated.View key={item.id} entering={FadeInDown.duration(220)} exiting={FadeOutDown.duration(220)} style={{ width: '100%', maxWidth: 448 }}>
        <View className={item.type === 'success' ? 'w-full flex-row items-center gap-3 rounded-2xl bg-success px-5 py-4 shadow-lg' : 'w-full flex-row items-center gap-3 rounded-2xl bg-destructive px-5 py-4 shadow-lg'}>
          <Icon as={item.type === 'success' ? Check : CircleAlert} size={20} className={item.type === 'success' ? 'text-success-foreground' : 'text-destructive-foreground'} />
          <Text accessibilityRole="alert" className={item.type === 'success' ? 'flex-1 text-success-foreground' : 'flex-1 text-destructive-foreground'}>{item.message}</Text>
        </View>
      </Animated.View>)}
    </View>
  </ToastContext.Provider>;
}
