import { View } from 'react-native';
import { Text } from '@/components/ui/text';

export default function SavedScreen() {
  return (
    <View className="flex-1 bg-background p-4">
      <Text className="text-2xl font-bold">Saved</Text>
      {/* TODO: read savedShopIds off the user doc, render matching shops */}
    </View>
  );
}
