import { View, Pressable, Linking } from 'react-native';
import { Text } from '@/components/ui/text';
import type { Shop } from '@/types/shop';

export function ShopLocationMap({ shop }: {
  shop: Pick<Shop, 'lat' | 'lng' | 'name'>;
  userLocation: { lat: number; lng: number } | null;
}) {
  const mapsUrl = `https://www.google.com/maps?q=${shop.lat},${shop.lng}`;

  return (
    <View className="h-56 rounded-xl overflow-hidden bg-muted items-center justify-center gap-2 p-4">
      <Text className="text-muted-foreground text-center">
        Interactive maps aren't available in the web preview.
      </Text>
      <Pressable onPress={() => Linking.openURL(mapsUrl)}>
        <Text className="text-primary underline">Open {shop.name} in Google Maps</Text>
      </Pressable>
    </View>
  );
}