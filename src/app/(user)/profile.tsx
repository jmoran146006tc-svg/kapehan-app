import { View } from 'react-native';
import { signOut } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';

export default function ProfileScreen() {
  return (
    <View className="flex-1 bg-background p-4 gap-4">
      <Text className="text-2xl font-bold">Profile</Text>
      {/* TODO: preferences form, per §8 — one screen with sane defaults, no wizard */}
      <Button variant="outline" onPress={() => signOut(auth)}>
        <Text>Log out</Text>
      </Button>
    </View>
  );
}
