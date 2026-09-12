import { ScrollView } from 'react-native';
import { Text } from '@/components/ui/text';

export default function CompareScreen() {
  return (
    <ScrollView horizontal className="flex-1 bg-background p-4">
      <Text className="text-2xl font-bold">Compare</Text>
      {/* TODO: pull selected ids from useCompareStore(), render the table from §12 */}
    </ScrollView>
  );
}
