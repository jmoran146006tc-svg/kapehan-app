import { ScrollView, View } from 'react-native';
import { router } from 'expo-router';
import { ArrowRight, MapPin, Moon, Search, Sun } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFilteredShops } from '@/hooks/useFilteredShops';
import { useCompareStore } from '@/store/compareStore';
import { useSavedShops } from '@/hooks/useSavedShops';
import { DiscoveryFilterRow } from '@/components/discovery-filter-row';
import { ShopCard } from '@/components/shop-card';
import { UserNotificationButton } from '@/components/user-notification-button';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { isOpenNow } from '@/utils/hours';

export default function HomeScreen() {
  const shops = useFilteredShops();
  const featured = [...shops].sort((a, b) => b.avgRating - a.avgRating).slice(0, 5);
  const openCount = shops.filter((shop) => isOpenNow(shop.hours)).length;
  const ids = useCompareStore((state) => state.ids);
  const toggle = useCompareStore((state) => state.toggle);
  const { savedShopIds, savingShopId, toggleSavedShop, error: savedError } = useSavedShops();

  return (
    <SafeAreaView edges={['top']} className="flex-1 bg-background">
      <ScrollView className="flex-1" contentContainerClassName="gap-4 pb-8">
        <View className="gap-4 bg-primary px-4 pb-5 pt-3">
          <View className="flex-row items-start justify-between">
            <View>
              <View className="flex-row items-center gap-2"><Icon as={greeting().icon} size={16} className="text-primary-foreground/70" /><Text className="text-sm text-primary-foreground/70">{greeting().label}</Text></View>
              <Text className="mt-1 text-3xl font-bold text-primary-foreground">Find Your Kape</Text>
            </View>
            <UserNotificationButton />
          </View>
          <Button variant="secondary" className="justify-start bg-card" onPress={() => router.push('/(user)/search')}>
            <Icon as={Search} size={18} className="text-muted-foreground" />
            <Text className="text-muted-foreground">Search coffee shops…</Text>
          </Button>
          <DiscoveryFilterRow />
        </View>

        <View className="gap-4 px-4">
          <Button variant="secondary" className="h-auto items-center justify-between rounded-2xl bg-secondary px-5 py-5" onPress={() => router.push('/(user)/map' as never)}>
            <View className="flex-1 gap-2">
              <View className="flex-row items-center gap-3"><Icon as={MapPin} size={18} className="text-primary" /><Text className="font-bold">Explore on Maps</Text></View>
              <Text className="text-sm text-muted-foreground">{openCount} shop{openCount === 1 ? '' : 's'} open near you</Text>
            </View>
            <View className="h-9 w-9 items-center justify-center rounded-full bg-accent"><Icon as={ArrowRight} size={18} className="text-white" /></View>
          </Button>

          <View className="flex-row items-center justify-between">
            <Text className="text-xl font-bold">Featured Today</Text>
            <Button size="sm" variant="link" onPress={() => router.push('/(user)/search')}><Text>See all</Text></Button>
          </View>
          {savedError ? <Text accessibilityRole="alert" className="text-destructive">{savedError}</Text> : null}
          <View className="gap-3">
            {featured.map((shop) => (
              <ShopCard key={shop.id} shop={shop} onPress={() => router.push({ pathname: '/(user)/shop/[id]', params: { id: shop.id } })} saved={savedShopIds.includes(shop.id)} saving={savingShopId === shop.id} onToggleSaved={() => void toggleSavedShop(shop.id)} compared={ids.includes(shop.id)} onToggleCompare={() => toggle(shop.id)} />
            ))}
            {featured.length === 0 ? <Text className="py-8 text-center text-muted-foreground">No approved coffee shops match these filters yet.</Text> : null}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function greeting(): { label: string; icon: typeof Sun } {
  const hour = new Date().getHours();
  if (hour < 12) return { label: 'Good morning', icon: Sun };
  if (hour < 18) return { label: 'Good afternoon', icon: Sun };
  return { label: 'Good evening', icon: Moon };
}
