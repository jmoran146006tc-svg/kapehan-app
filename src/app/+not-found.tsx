import { View } from 'react-native';
import { router } from 'expo-router';
import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';

export default function NotFoundScreen() {
  return <View className="flex-1 items-center justify-center gap-4 bg-background p-6"><Text className="text-3xl font-bold">Page not found</Text><Text className="text-center text-muted-foreground">That Kapehan page does not exist or may have moved.</Text><Button onPress={() => router.replace('/')}><Text>Go home</Text></Button></View>;
}
