import { ScrollView, View } from 'react-native';
import { useShops } from '@/hooks/useShops';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Text } from '@/components/ui/text';

export default function HomeScreen() {
  const { shops } = useShops();
  const topPicks = [...shops].sort((a, b) => b.avgRating - a.avgRating).slice(0, 5);

  return (
    <ScrollView className="flex-1 bg-background p-4" contentContainerClassName="gap-4">
      <Text className="text-2xl font-bold">Home</Text>
      <Text className="font-semibold text-lg">Top picks</Text>
      <View className="gap-3">
        {topPicks.map((shop) => (
          <Card key={shop.id}>
            <CardHeader>
              <CardTitle>{shop.name}</CardTitle>
              <CardDescription>{shop.priceRange} · ⭐ {shop.avgRating.toFixed(1)} ({shop.reviewCount})</CardDescription>
            </CardHeader>
          </Card>
        ))}
        {topPicks.length === 0 && <Text className="text-muted-foreground">No shops yet — check back soon.</Text>}
      </View>
    </ScrollView>
  );
}