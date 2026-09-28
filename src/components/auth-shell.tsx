import { useEffect, useState } from 'react';
import { Animated, Easing, Keyboard, KeyboardAvoidingView, Platform, Pressable, ScrollView, View, useWindowDimensions } from 'react-native';
import { Link, usePathname } from 'expo-router';
import { Logo } from '@/components/logo';
import { Text } from '@/components/ui/text';

interface AuthShellProps {
  active: 'login' | 'register';
  children: React.ReactNode;
}

export function AuthShell({ active, children }: AuthShellProps) {
  const { width, height } = useWindowDimensions();
  const pathname = usePathname();
  const [progress] = useState(() => new Animated.Value(0));
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  useEffect(() => {
    Animated.timing(progress, { toValue: 1, duration: 260, easing: Easing.out(Easing.cubic), useNativeDriver: false }).start();
  }, [progress]);
  useEffect(() => {
    const shown = Keyboard.addListener('keyboardDidShow', () => setKeyboardVisible(true));
    const hidden = Keyboard.addListener('keyboardDidHide', () => setKeyboardVisible(false));
    return () => { shown.remove(); hidden.remove(); };
  }, []);
  const offset = pathname.includes('forgot-password') ? 24 : 10;
  const logoSize = Math.min(120, Math.max(72, Math.floor(height * 0.38 - 100)));
  return (
    <KeyboardAvoidingView className="flex-1 bg-primary" behavior={Platform.OS === 'ios' ? 'padding' : 'height'} keyboardVerticalOffset={0}>
      <View className="items-center justify-center gap-2 px-6" style={{ height: keyboardVisible ? 72 : height * 0.38 }}>
        {!keyboardVisible ? <Logo width={logoSize} height={logoSize} accessibilityLabel="Kapehan" /> : null}
        <Text className={keyboardVisible ? 'font-display text-2xl text-primary-foreground' : 'font-display text-4xl text-primary-foreground'}>Kapehan</Text>
        {!keyboardVisible ? <Text className="text-center text-sm text-primary-foreground/75">Discover your perfect cup in Tagum City</Text> : null}
      </View>
      <ScrollView className="flex-1 rounded-t-3xl bg-background" contentContainerClassName="items-center pb-8" keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag">
        <View className="gap-5 py-6" style={{ width: Math.min(Math.max(width - 48, 0), 624) }}>
        <View className="flex-row rounded-full bg-secondary p-1">
          <Link href="/(auth)/login" asChild>
            <Pressable className={active === 'login' ? 'flex-1 rounded-full bg-primary px-3 py-2' : 'flex-1 rounded-full px-3 py-2'}>
              <Text className={active === 'login' ? 'text-center font-semibold text-primary-foreground' : 'text-center font-semibold'}>Log In</Text>
            </Pressable>
          </Link>
          <Link href="/(auth)/register" asChild>
            <Pressable className={active === 'register' ? 'flex-1 rounded-full bg-primary px-3 py-2' : 'flex-1 rounded-full px-3 py-2'}>
              <Text className={active === 'register' ? 'text-center font-semibold text-primary-foreground' : 'text-center font-semibold'}>Register</Text>
            </Pressable>
          </Link>
        </View>
        <Animated.View style={{ opacity: progress, transform: [{ translateX: progress.interpolate({ inputRange: [0, 1], outputRange: [offset, 0] }) }] }}>
          {children}
        </Animated.View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
