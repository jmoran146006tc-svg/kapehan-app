import { Stack } from 'expo-router';

// Derived from the light-theme --primary and --primary-foreground HSL values.
const PRIMARY_HEX = '#372C15';
const PRIMARY_FOREGROUND_HEX = '#FDFDFC';

export default function AdminLayout() {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="listing/[id]" options={{ title: 'Review Listing', headerStyle: { backgroundColor: PRIMARY_HEX }, headerTintColor: PRIMARY_FOREGROUND_HEX }} />
    </Stack>
  );
}
