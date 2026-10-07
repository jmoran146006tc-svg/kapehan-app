import { useEffect, useState } from 'react';
import { Keyboard, KeyboardAvoidingView, Platform, Pressable, View, useWindowDimensions } from 'react-native';
import { router, usePathname } from 'expo-router';
import Animated, { Easing, FadeIn, ReduceMotion, SlideInDown, ZoomIn, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AnimatedView } from '@/components/ui/animated';
import { LinearGradient } from '@/components/ui/linear-gradient';
import { Logo } from '@/components/logo';
import { Text } from '@/components/ui/text';
import { PALETTE } from '@/constants/theme';
import { select } from '@/lib/haptics';

type AuthTab = 'login' | 'register' | null;

export function AuthShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const active: AuthTab = pathname.endsWith('/register') ? 'register' : pathname.endsWith('/login') ? 'login' : null;
  const { width, height } = useWindowDimensions();
  const pillWidth = Math.min(Math.max(width - 48, 0), 624);
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const logoSize = Math.min(120, Math.max(72, Math.floor(height * 0.38 - 100)));
  const headerHeight = useSharedValue(height * 0.38);
  const logoVisibility = useSharedValue(1);
  const segmentWidth = useSharedValue(0);
  const tabPosition = useSharedValue(active === 'register' ? 1 : 0);
  const pillVisibility = useSharedValue(active ? 1 : 0);

  useEffect(() => {
    const shown = Keyboard.addListener(Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow', () => setKeyboardVisible(true));
    const hidden = Keyboard.addListener(Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide', () => setKeyboardVisible(false));
    return () => { shown.remove(); hidden.remove(); };
  }, []);

  useEffect(() => {
    const timing = { duration: 200, easing: Easing.out(Easing.cubic), reduceMotion: ReduceMotion.System };
    headerHeight.set(withTiming(keyboardVisible ? 72 : height * 0.38, timing));
    logoVisibility.set(withTiming(keyboardVisible ? 0 : 1, timing));
  }, [headerHeight, height, keyboardVisible, logoVisibility]);

  useEffect(() => {
    const timing = { duration: 220, easing: Easing.out(Easing.cubic), reduceMotion: ReduceMotion.System };
    if (active) tabPosition.set(withTiming(active === 'register' ? 1 : 0, timing));
    pillVisibility.set(withTiming(active ? 1 : 0, { ...timing, duration: 180 }));
  }, [active, pillVisibility, tabPosition]);

  const headerStyle = useAnimatedStyle(() => ({ height: headerHeight.value }));
  const logoStyle = useAnimatedStyle(() => ({
    height: logoSize * logoVisibility.value,
    opacity: logoVisibility.value,
    transform: [{ scale: 0.85 + logoVisibility.value * 0.15 }],
  }));
  const taglineStyle = useAnimatedStyle(() => ({ opacity: logoVisibility.value, height: 20 * logoVisibility.value }));
  const pillStyle = useAnimatedStyle(() => ({
    height: 52 * pillVisibility.value,
    marginTop: 24 * pillVisibility.value,
    opacity: pillVisibility.value,
  }));
  const indicatorStyle = useAnimatedStyle(() => ({
    width: segmentWidth.value / 2,
    opacity: segmentWidth.value > 0 ? 1 : 0,
    transform: [{ translateX: tabPosition.value * (segmentWidth.value / 2) }],
  }));

  return (
    <SafeAreaView edges={['bottom']} className="flex-1 bg-primary">
      <KeyboardAvoidingView className="flex-1 bg-primary" behavior={Platform.OS === 'ios' ? 'padding' : 'height'} keyboardVerticalOffset={0}>
        <AnimatedView style={headerStyle} className="overflow-hidden">
          <LinearGradient colors={[PALETTE.primary, PALETTE.espresso2]} className="flex-1 items-center justify-center gap-2 px-6">
            <View pointerEvents="none" className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-accent/10" />
            <View pointerEvents="none" className="absolute -bottom-12 -left-12 h-36 w-36 rounded-full bg-gold/10" />
            <AnimatedView entering={ZoomIn.duration(280).easing(Easing.out(Easing.cubic)).reduceMotion(ReduceMotion.System)} style={logoStyle}>
              <Logo width={logoSize} height={logoSize} accessibilityLabel="Kapehan" />
            </AnimatedView>
            <Text className={keyboardVisible ? 'font-display text-2xl text-primary-foreground' : 'font-display text-4xl text-primary-foreground'}>Kapehan</Text>
            <AnimatedView entering={FadeIn.delay(100).duration(280).easing(Easing.out(Easing.cubic)).reduceMotion(ReduceMotion.System)} style={taglineStyle}>
              <Text className="text-center text-sm text-primary-foreground/75">Discover your perfect cup in Tagum City</Text>
            </AnimatedView>
          </LinearGradient>
        </AnimatedView>
        <AnimatedView entering={SlideInDown.duration(280).easing(Easing.out(Easing.cubic)).reduceMotion(ReduceMotion.System)} className="flex-1 overflow-hidden rounded-t-[32px] bg-background">
          <View style={{ width: pillWidth, alignSelf: 'center' }}>
            <Animated.View style={[pillStyle, { overflow: 'hidden' }]} pointerEvents={active ? 'auto' : 'none'} accessibilityElementsHidden={!active} importantForAccessibility={active ? 'auto' : 'no-hide-descendants'}>
              <View style={{ flexDirection: 'row', padding: 4, borderRadius: 999, backgroundColor: PALETTE.creamDeep }} onLayout={(event) => segmentWidth.set(Math.max(event.nativeEvent.layout.width - 8, 0))}>
                <Animated.View pointerEvents="none" style={[{ position: 'absolute', top: 4, bottom: 4, left: 4, borderRadius: 999, backgroundColor: PALETTE.primary }, indicatorStyle]} />
                <Pressable style={{ flex: 1, minHeight: 44, alignItems: 'center', justifyContent: 'center' }} onPress={() => { select(); router.replace('/(auth)/login'); }} accessibilityRole="tab" accessibilityState={{ selected: active === 'login' }}>
                  <Text className="text-center font-semibold" style={{ color: active === 'login' ? PALETTE.card : PALETTE.primary }}>Log In</Text>
                </Pressable>
                <Pressable style={{ flex: 1, minHeight: 44, alignItems: 'center', justifyContent: 'center' }} onPress={() => { select(); router.replace('/(auth)/register'); }} accessibilityRole="tab" accessibilityState={{ selected: active === 'register' }}>
                  <Text className="text-center font-semibold" style={{ color: active === 'register' ? PALETTE.card : PALETTE.primary }}>Register</Text>
                </Pressable>
              </View>
            </Animated.View>
          </View>
          <View className="min-h-0 flex-1">{children}</View>
        </AnimatedView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
