import { Stack } from 'expo-router';

export default function AdminLayout() {
  return (
    <Stack screenOptions={{ headerShown: true }}>
      <Stack.Screen name="index" options={{ title: 'Pending Listings' }} />
      <Stack.Screen name="listing/[id]" options={{ title: 'Review Listing' }} />
    </Stack>
  );
}