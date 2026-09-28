import { useEffect, useState } from 'react';
import { Keyboard, KeyboardAvoidingView, Platform, Pressable, ScrollView, View, useWindowDimensions } from 'react-native';
import { Link } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeIn, ReduceMotion, SlideInDown, ZoomIn, useAnimatedStyle, useReducedMotion, useSharedValue, withRepeat, withSpring, withTiming } from 'react-native-reanimated';
import { Logo } from '@/components/logo';
import { Text } from '@/components/ui/text';
import { PALETTE, SPRING } from '@/constants/theme';
import { select } from '@/lib/haptics';

interface AuthShellProps {
  active: 'login' | 'register';
  children: React.ReactNode;
}

let lastActive: 'login' | 'register' = 'login';

export function AuthShell({ active, children }: AuthShellProps) {
  const { width, height } = useWindowDimensions();
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const [segmentWidth, setSegmentWidth] = useState(0);
  const headerHeight = useSharedValue(height * 0.38);
  const float = useSharedValue(0);
  const tabPosition = useSharedValue(lastActive === 'login' ? 0 : 1);
  const reduced = useReducedMotion();

  useEffect(() => {
    const shown = Keyboard.addListener('keyboardDidShow', () => setKeyboardVisible(true));
    const hidden = Keyboard.addListener('keyboardDidHide', () => setKeyboardVisible(false));
    return () => { shown.remove(); hidden.remove(); };
  }, []);
  useEffect(() => {
    headerHeight.set(withTiming(keyboardVisible ? 72 : height * 0.38, { duration: 220, reduceMotion: ReduceMotion.System }));
  }, [headerHeight, height, keyboardVisible]);
  useEffect(() => {
    if (!reduced) float.set(withRepeat(withTiming(-4, { duration: 1800, reduceMotion: ReduceMotion.System }), -1, true));
  }, [float, reduced]);
  useEffect(() => {
    tabPosition.set(withSpring(active === 'login' ? 0 : 1, { ...SPRING.gentle, reduceMotion: ReduceMotion.System }));
    lastActive = active;
  }, [active, tabPosition]);

  const headerStyle = useAnimatedStyle(() => ({ height: headerHeight.value }));
  const logoStyle = useAnimatedStyle(() => ({ transform: [{ translateY: float.value }] }));
  const indicatorStyle = useAnimatedStyle(() => ({ transform: [{ translateX: tabPosition.value * (segmentWidth / 2) }] }));
  const logoSize = Math.min(120, Math.max(72, Math.floor(height * 0.38 - 100)));

  return (
    <KeyboardAvoidingView className="flex-1 bg-primary" behavior={Platform.OS === 'ios' ? 'padding' : 'height'} keyboardVerticalOffset={0}>
      <Animated.View style={headerStyle} className="overflow-hidden">
        <LinearGradient colors={[PALETTE.primary, PALETTE.espresso2]} className="flex-1 items-center justify-center gap-2 px-6">
          <View pointerEvents="none" className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-accent/10" />
          <View pointerEvents="none" className="absolute -bottom-12 -left-12 h-36 w-36 rounded-full bg-gold/10" />
          {!keyboardVisible ? (
            <Animated.View entering={ZoomIn.springify().damping(16).reduceMotion(ReduceMotion.System)} style={logoStyle}>
              <Logo width={logoSize} height={logoSize} accessibilityLabel="Kapehan" />
            </Animated.View>
          ) : null}
          <Text className={keyboardVisible ? 'font-display text-2xl text-primary-foreground' : 'font-display text-4xl text-primary-foreground'}>Kapehan</Text>
          {!keyboardVisible ? (
            <Animated.View entering={FadeIn.delay(100).duration(220).reduceMotion(ReduceMotion.System)}>
              <Text className="text-center text-sm text-primary-foreground/75">Discover your perfect cup in Tagum City</Text>
            </Animated.View>
          ) : null}
        </LinearGradient>
      </Animated.View>
      <Animated.View entering={SlideInDown.springify().damping(18).reduceMotion(ReduceMotion.System)} className="flex-1 overflow-hidden rounded-t-[32px] bg-background">
        <ScrollView className="flex-1" contentContainerClassName="items-center pb-8" keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag">
          <View className="gap-5 py-6" style={{ width: Math.min(Math.max(width - 48, 0), 624) }}>
            <View
              className="relative flex-row rounded-full bg-secondary p-1"
              onLayout={(event) => setSegmentWidth(event.nativeEvent.layout.width - 8)}>
              {segmentWidth > 0 ? <Animated.View pointerEvents="none" className="absolute bottom-1 left-1 top-1 rounded-full bg-primary" style={[{ width: segmentWidth / 2 }, indicatorStyle]} /> : null}
              <Link href="/(auth)/login" asChild>
                <Pressable className="min-h-11 flex-1 items-center justify-center rounded-full px-3" onPressIn={() => select()} accessibilityRole="tab" accessibilityState={{ selected: active === 'login' }}>
                  <Text className={active === 'login' ? 'text-center font-semibold text-primary-foreground' : 'text-center font-semibold'}>Log In</Text>
                </Pressable>
              </Link>
              <Link href="/(auth)/register" asChild>
                <Pressable className="min-h-11 flex-1 items-center justify-center rounded-full px-3" onPressIn={() => select()} accessibilityRole="tab" accessibilityState={{ selected: active === 'register' }}>
                  <Text className={active === 'register' ? 'text-center font-semibold text-primary-foreground' : 'text-center font-semibold'}>Register</Text>
                </Pressable>
              </Link>
            </View>
            <Animated.View entering={FadeIn.duration(220).reduceMotion(ReduceMotion.System)}>{children}</Animated.View>
          </View>
        </ScrollView>
      </Animated.View>
    </KeyboardAvoidingView>
  );
}
