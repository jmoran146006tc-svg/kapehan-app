import { View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { Text } from '@/components/ui/text';

export default function EditListingScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();

  return (
    <View className="flex-1 bg-background p-4">
      <Text className="text-2xl font-bold">Edit Listing</Text>
      {/* TODO: same form as create.tsx, pre-filled from /shops/{id};
          resets status back to "pending" on save */}
    </View>
  );
}
