import { Stack } from 'expo-router';
import { OwnerNotificationButton } from '@/components/owner-notification-button';

export default function OwnerLayout() {
  return (
    <Stack screenOptions={{ headerShown: true }}>
      <Stack.Screen name="index" options={{ title: 'Owner Dashboard', headerRight: () => <OwnerNotificationButton /> }} />
      <Stack.Screen name="reviews" options={{ title: 'Reviews' }} />
      <Stack.Screen name="notifications" options={{ title: 'Notifications' }} />
      <Stack.Screen name="listing/create" options={{ title: 'New Listing' }} />
      <Stack.Screen name="listing/[id]" options={{ title: 'Edit Listing' }} />
    </Stack>
  );
}
