import { Stack } from 'expo-router';

// Match the active (light) --primary and --primary-foreground CSS tokens.
const HEADER_BACKGROUND = 'hsl(20, 45%, 15%)';
const HEADER_FOREGROUND = 'hsl(40, 30%, 99%)';

export default function AdminLayout() {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="listing/[id]" options={{ title: 'Review Listing', headerStyle: { backgroundColor: HEADER_BACKGROUND }, headerTintColor: HEADER_FOREGROUND }} />
    </Stack>
  );
}
