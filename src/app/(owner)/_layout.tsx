import { Redirect, Stack } from 'expo-router';
import { useAuth } from '@/hooks/useAuth';

// Match the active (light) --primary and --primary-foreground CSS tokens.
const HEADER_BACKGROUND = 'hsl(20, 45%, 15%)';
const HEADER_FOREGROUND = 'hsl(40, 30%, 99%)';

export default function OwnerLayout() {
  const { status } = useAuth();
  if (status === 'suspended') return <Redirect href={'/(auth)/suspended' as never} />;
  return (
    <Stack>
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="reviews" options={{ title: 'Reviews', headerStyle: { backgroundColor: HEADER_BACKGROUND }, headerTintColor: HEADER_FOREGROUND }} />
      <Stack.Screen name="notifications" options={{ headerShown: false }} />
      <Stack.Screen name="listing/create" options={{ title: 'New Listing', headerStyle: { backgroundColor: HEADER_BACKGROUND }, headerTintColor: HEADER_FOREGROUND }} />
      <Stack.Screen name="listing/[id]" options={{ title: 'Edit Listing', headerStyle: { backgroundColor: HEADER_BACKGROUND }, headerTintColor: HEADER_FOREGROUND }} />
      <Stack.Screen name="owner/shop/[id]" options={{ headerShown: false }} />
    </Stack>
  );
}
