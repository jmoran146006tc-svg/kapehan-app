import { View } from 'react-native';
import { Text } from '@/components/ui/text';

export default function SearchScreen() {
  return (
    <View className="flex-1 bg-background p-4">
      <Text className="text-2xl font-bold">Search</Text>
      {/* TODO: search Input + filter Dialog + useFilteredShops() list, per §12 */}
    </View>
  );
}
