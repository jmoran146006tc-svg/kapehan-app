import { Stack } from 'expo-router';
import { AuthShell } from '@/components/auth-shell';

export default function AuthLayout() {
  return (
    <AuthShell>
      <Stack screenOptions={{ headerShown: false, animation: 'fade', animationDuration: 180, contentStyle: { backgroundColor: 'transparent' } }}>
        <Stack.Screen name="login" />
        <Stack.Screen name="register" />
        <Stack.Screen name="forgot-password" options={{ animation: 'slide_from_right', animationDuration: 220 }} />
        <Stack.Screen name="suspended" />
      </Stack>
    </AuthShell>
  );
}
