import { View, FlatList, Pressable } from 'react-native';
import { router } from 'expo-router';
import { useFilteredShops } from '@/hooks/useFilteredShops';
import { useFilterStore } from '@/store/filterStore';
import { useCompareStore } from '@/store/compareStore';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Text } from '@/components/ui/text';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

export default function SearchScreen() {
  const shops = useFilteredShops();
  const { search, priceRange, wifiRating, openNowOnly, setFilter, toggleArrayFilter, reset } = useFilterStore();
  const { ids, toggle } = useCompareStore();

  return (
    <View className="flex-1 bg-background p-4 gap-3">
      <Text className="text-2xl font-bold">Search</Text>

      <View className="flex-row gap-2">
        <Input className="flex-1" placeholder="Search coffee shops…" value={search}
          onChangeText={(t) => setFilter('search', t)} />
        <Dialog>
          <DialogTrigger asChild>
            <Button variant="outline"><Text>Filters</Text></Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Filter shops</DialogTitle></DialogHeader>

            <Text className="font-semibold">Price</Text>
            <View className="flex-row gap-2">
              {(['₱', '₱₱', '₱₱₱'] as const).map((p) => (
                <Button key={p} size="sm" variant={priceRange.includes(p) ? 'default' : 'outline'}
                  onPress={() => toggleArrayFilter('priceRange', p)}>
                  <Text>{p}</Text>
                </Button>
              ))}
            </View>

            <Text className="font-semibold">WiFi</Text>
            <View className="flex-row gap-2">
              {(['fast', 'moderate', 'none'] as const).map((w) => (
                <Button key={w} size="sm" variant={wifiRating.includes(w) ? 'default' : 'outline'}
                  onPress={() => toggleArrayFilter('wifiRating', w)}>
                  <Text className="capitalize">{w}</Text>
                </Button>
              ))}
            </View>

            <Button variant={openNowOnly ? 'default' : 'outline'} onPress={() => setFilter('openNowOnly', !openNowOnly)}>
              <Text>Open now</Text>
            </Button>
            <Button variant="ghost" onPress={reset}><Text>Clear filters</Text></Button>
          </DialogContent>
        </Dialog>
      </View>

      <FlatList
        data={shops}
        keyExtractor={(s) => s.id}
        contentContainerClassName="gap-3 pb-4"
        renderItem={({ item }) => (
          <Pressable onPress={() => router.push({ pathname: '/(user)/shop/[id]', params: { id: item.id } })}>
            <Card>
              <CardHeader>
                <View className="flex-row justify-between items-start">
                  <CardTitle className="flex-1">{item.name}</CardTitle>
                  <Badge variant={item.openNow ? 'default' : 'secondary'}>
                    <Text>{item.openNow ? 'Open now' : 'Closed'}</Text>
                  </Badge>
                </View>
                <CardDescription>
                  {item.priceRange} · {item.wifiRating} wifi
                  {item.distanceKm != null ? ` · ${item.distanceKm.toFixed(1)} km` : ''}
                </CardDescription>
              </CardHeader>
              <Button size="sm" variant={ids.includes(item.id) ? 'default' : 'outline'} className="mx-6"
                onPress={() => toggle(item.id)}>
                <Text>{ids.includes(item.id) ? 'Added to compare' : '+ Compare'}</Text>
              </Button>
            </Card>
          </Pressable>
        )}
      />
    </View>
  );
}