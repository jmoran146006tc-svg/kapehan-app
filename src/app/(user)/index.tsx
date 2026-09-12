import { ScrollView } from 'react-native';
import { Text } from '@/components/ui/text';

export default function HomeScreen() {
  return (
    <ScrollView className="flex-1 bg-background p-4">
      <Text className="text-2xl font-bold">Home</Text>
      {/* TODO: saved shops + recent + top picks, per §8 — Dashboard folds in here */}
    </ScrollView>
  );
}
