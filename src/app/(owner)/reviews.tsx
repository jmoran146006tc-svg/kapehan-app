import { ScrollView } from 'react-native';
import { Text } from '@/components/ui/text';

export default function OwnerReviewsScreen() {
  return (
    <ScrollView className="flex-1 bg-background p-4">
      <Text className="text-2xl font-bold">Customer Reviews</Text>
      {/* TODO: query /shops/{ownerShopId}/reviews, render list */}
    </ScrollView>
  );
}
