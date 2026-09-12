import { Stack } from 'expo-router';

export default function OwnerLayout() {
  return (
    <Stack screenOptions={{ headerShown: true }}>
      <Stack.Screen name="index" options={{ title: 'Owner Dashboard' }} />
      <Stack.Screen name="reviews" options={{ title: 'Reviews' }} />
      <Stack.Screen name="listing/create" options={{ title: 'New Listing' }} />
      <Stack.Screen name="listing/[id]" options={{ title: 'Edit Listing' }} />
    </Stack>
  );
}
