import { Redirect, Stack } from 'expo-router';
import { useAuth } from '@/hooks/useAuth';

// Derived from the light-theme --primary and --primary-foreground HSL values.
const PRIMARY_HEX = '#372C15';
const PRIMARY_FOREGROUND_HEX = '#FDFDFC';

export default function OwnerLayout() {
  const { status } = useAuth();
  if (status === 'suspended') return <Redirect href={'/(auth)/suspended' as never} />;
  return (
    <Stack>
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="reviews" options={{ title: 'Reviews', headerStyle: { backgroundColor: PRIMARY_HEX }, headerTintColor: PRIMARY_FOREGROUND_HEX }} />
      <Stack.Screen name="notifications" options={{ headerShown: false }} />
      <Stack.Screen name="listing/create" options={{ title: 'New Listing', headerStyle: { backgroundColor: PRIMARY_HEX }, headerTintColor: PRIMARY_FOREGROUND_HEX }} />
      <Stack.Screen name="listing/[id]" options={{ title: 'Edit Listing', headerStyle: { backgroundColor: PRIMARY_HEX }, headerTintColor: PRIMARY_FOREGROUND_HEX }} />
      <Stack.Screen name="shop/[id]" options={{ headerShown: false }} />
    </Stack>
  );
}
