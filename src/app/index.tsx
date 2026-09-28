import { Redirect } from 'expo-router';
import { useAuth } from '@/hooks/useAuth';
import { Logo } from '@/components/logo';
import { LinearGradient } from '@/components/ui/linear-gradient';
import Animated, { ReduceMotion, useAnimatedStyle, useReducedMotion, useSharedValue, withRepeat, withTiming } from 'react-native-reanimated';
import { useEffect } from 'react';
import { PALETTE } from '@/constants/theme';

function BrandedLoader() {
  const reduced = useReducedMotion();
  const scale = useSharedValue(1);
  useEffect(() => {
    if (!reduced) scale.set(withRepeat(withTiming(1.04, { duration: 1300, reduceMotion: ReduceMotion.System }), -1, true));
  }, [reduced, scale]);
  const style = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  return (
    <LinearGradient colors={[PALETTE.primary, PALETTE.espresso2]} className="flex-1 items-center justify-center">
      <Animated.View style={style}><Logo width={140} height={140} accessibilityLabel="Kapehan" /></Animated.View>
    </LinearGradient>
  );
}

export default function Index() {
  const { user, role, status, loading } = useAuth();

  if (loading) {
    return <BrandedLoader />;
  }

  if (!user) return <Redirect href="/(auth)/login" />;
  if (status === 'suspended') return <Redirect href={'/(auth)/suspended' as never} />;
  if (role === 'owner') return <Redirect href="/(owner)" />;
  if (role === 'admin') return <Redirect href="/(admin)" />;
  return <Redirect href="/(user)" />;
}
