import { Redirect, Stack } from 'expo-router';
import { useAuth } from '@/hooks/useAuth';

export default function OwnerLayout() {
  const { status } = useAuth();
  if (status === 'suspended') return <Redirect href={'/(auth)/suspended' as never} />;
  return (
    <Stack>
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="reviews" options={{ headerShown: false }} />
      <Stack.Screen name="notifications" options={{ headerShown: false }} />
      <Stack.Screen name="listing/create" options={{ headerShown: false }} />
      <Stack.Screen name="listing/[id]" options={{ headerShown: false }} />
      <Stack.Screen name="owner/shop/[id]" options={{ headerShown: false }} />
    </Stack>
  );
}
