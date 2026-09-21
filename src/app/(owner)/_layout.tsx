import { Redirect, Stack } from 'expo-router';
import { OwnerNotificationButton } from '@/components/owner-notification-button';
import { useAuth } from '@/hooks/useAuth';

export default function OwnerLayout() {
  const { status } = useAuth();
  if (status === 'suspended') return <Redirect href={'/(auth)/suspended' as never} />;
  return (
    <Stack screenOptions={{ headerShown: true }}>
      <Stack.Screen name="index" options={{ title: 'Owner Dashboard', headerRight: () => <OwnerNotificationButton /> }} />
      <Stack.Screen name="reviews" options={{ title: 'Reviews' }} />
      <Stack.Screen name="notifications" options={{ title: 'Notifications' }} />
      <Stack.Screen name="listing/create" options={{ title: 'New Listing' }} />
      <Stack.Screen name="listing/[id]" options={{ title: 'Edit Listing' }} />
      <Stack.Screen name="shop/[id]" options={{ headerShown: false }} />
    </Stack>
  );
}
