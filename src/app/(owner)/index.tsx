import { View } from 'react-native';
import { router } from 'expo-router';
import { signOut } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';

export default function OwnerDashboard() {
  return (
    <View className="flex-1 bg-background p-4 gap-3">
      <Text className="text-2xl font-bold">Owner Dashboard</Text>
      {/* TODO: show the owner's shop (status: pending/approved/rejected), or a
          "create listing" prompt if they don't have one yet */}
      <Button onPress={() => router.push('/(owner)/listing/create')}>
        <Text>Create listing</Text>
      </Button>
      <Button variant="outline" onPress={() => router.push('/(owner)/reviews')}>
        <Text>View reviews</Text>
      </Button>
      <Button variant="ghost" onPress={() => signOut(auth)}>
        <Text>Log out</Text>
      </Button>
    </View>
  );
}
