import { useEffect, useState } from 'react';
import { Animated, Easing, ScrollView, View, useWindowDimensions } from 'react-native';
import { Link, usePathname } from 'expo-router';
import { Logo } from '@/components/logo';
import { Text } from '@/components/ui/text';

interface AuthShellProps {
  active: 'login' | 'register';
  children: React.ReactNode;
}

export function AuthShell({ active, children }: AuthShellProps) {
  const { width } = useWindowDimensions();
  const pathname = usePathname();
  const [progress] = useState(() => new Animated.Value(0));
  useEffect(() => {
    Animated.timing(progress, { toValue: 1, duration: 260, easing: Easing.out(Easing.cubic), useNativeDriver: true }).start();
  }, [progress]);
  const offset = pathname.includes('forgot-password') ? 24 : 10;
  return (
    <View className="flex-1 bg-primary">
      <View className="h-[38%] items-center justify-center gap-2 px-6">
        <Logo width={96} height={96} accessibilityLabel="Kapehan" />
        <Text className="font-serif text-4xl font-bold text-primary-foreground">Kapehan</Text>
        <Text className="text-center text-sm text-primary-foreground/75">Discover your perfect cup in Tagum City</Text>
      </View>
      <ScrollView className="min-h-[62%] flex-1 rounded-t-3xl bg-background" contentContainerClassName="items-center" keyboardShouldPersistTaps="handled">
        <View className="gap-5 py-6" style={{ width: Math.min(Math.max(width - 48, 0), 624) }}>
        <View className="flex-row rounded-full bg-secondary p-1">
          <Link href="/(auth)/login" className={active === 'login' ? 'flex-1 rounded-full bg-primary px-3 py-2 text-center' : 'flex-1 rounded-full px-3 py-2 text-center'}>
            <Text className={active === 'login' ? 'text-center font-semibold text-primary-foreground' : 'text-center font-semibold'}>Log In</Text>
          </Link>
          <Link href="/(auth)/register" className={active === 'register' ? 'flex-1 rounded-full bg-primary px-3 py-2 text-center' : 'flex-1 rounded-full px-3 py-2 text-center'}>
            <Text className={active === 'register' ? 'text-center font-semibold text-primary-foreground' : 'text-center font-semibold'}>Register</Text>
          </Link>
        </View>
        <Animated.View style={{ opacity: progress, transform: [{ translateX: progress.interpolate({ inputRange: [0, 1], outputRange: [offset, 0] }) }] }}>
          {children}
        </Animated.View>
        </View>
      </ScrollView>
    </View>
  );
}
