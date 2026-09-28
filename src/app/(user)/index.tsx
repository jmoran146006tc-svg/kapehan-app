import { ImageBackground, RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { MapPin, Moon, Search, Sun } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { useFilteredShops } from '@/hooks/useFilteredShops';
import { useCompareStore } from '@/store/compareStore';
import { useSavedShops } from '@/hooks/useSavedShops';
import { DiscoveryFilterRow } from '@/components/discovery-filter-row';
import { ShopCard } from '@/components/shop-card';
import { ShopCardSkeleton } from '@/components/shop-card-skeleton';
import { UserNotificationButton } from '@/components/user-notification-button';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { GradientHeader } from '@/components/gradient-header';
import { PressableScale } from '@/components/ui/pressable-scale';
import { PALETTE, SHADOW } from '@/constants/theme';

export default function HomeScreen() {
  const { shops, loading, refreshing, refresh, error } = useFilteredShops({ featuredOnly: true });
  const featured = [...shops].sort((a, b) => b.avgRating - a.avgRating).slice(0, 5);
  const ids = useCompareStore((state) => state.ids);
  const toggle = useCompareStore((state) => state.toggle);
  const { savedShopIds, savingShopId, toggleSavedShop } = useSavedShops();

  return (
    <View className="flex-1 bg-background">
      <StatusBar style="light" />
      <ScrollView className="flex-1" contentContainerClassName="gap-6 pb-8" refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => void refresh()} tintColor={PALETTE.accent} />}>
        <GradientHeader className="gap-4">
          <View className="flex-row items-start justify-between">
            <View>
              <View className="flex-row items-center gap-2"><Icon as={greeting().icon} size={16} className="text-primary-foreground/70" /><Text className="text-sm text-primary-foreground/70">{greeting().label}</Text></View>
              <Text className="mt-1 font-display text-3xl text-primary-foreground">Find Your Kape</Text>
            </View>
            <UserNotificationButton />
          </View>
          <Button variant="secondary" className="justify-start rounded-full bg-card" style={SHADOW.e2} onPress={() => router.push('/(user)/search')}>
            <Icon as={Search} size={18} className="text-muted-foreground" />
            <Text className="text-muted-foreground">Search coffee shops…</Text>
          </Button>
          <DiscoveryFilterRow />
        </GradientHeader>

        <View className="mx-auto w-full max-w-2xl gap-4 px-4">
          <PressableScale onPress={() => router.push('/(user)/map' as never)} scaleTo={0.98} className="overflow-hidden rounded-3xl" accessibilityLabel="Explore on Maps">
            <ImageBackground source={require('../../../assets/images/map-preview.png')} resizeMode="cover" className="px-6 py-6">
              <LinearGradient
                colors={[`${PALETTE.primary}88`, `${PALETTE.primary}E0`]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={StyleSheet.absoluteFill}
              />
              <View className="flex-row items-center justify-between">
                <View className="flex-1 gap-1">
                  <Text className="text-lg font-bold text-white">Explore on Maps</Text>
                  <Text className="text-sm text-white/70">Find your next stop in Tagum City</Text>
                </View>
                <View className="h-11 w-11 items-center justify-center rounded-full bg-accent">
                  <Icon as={MapPin} size={20} className="text-white" />
                </View>
              </View>
            </ImageBackground>
          </PressableScale>

          <View className="flex-row items-center justify-between">
            <View className="flex-row items-center gap-2">
              <View className="h-5 w-1 rounded-full bg-accent" />
              <Text className="font-display text-xl">Featured Today</Text>
            </View>
            <Button size="sm" variant="link" onPress={() => router.push('/(user)/search')}><Text>See all</Text></Button>
          </View>
          <View className="gap-3">
            {loading ? [0, 1, 2].map((index) => <ShopCardSkeleton key={index} />) : featured.map((shop, index) => (
              <ShopCard key={shop.id} index={index} shop={shop} onPress={() => router.push({ pathname: '/(user)/shop/[id]', params: { id: shop.id } })} saved={savedShopIds.includes(shop.id)} saving={savingShopId === shop.id} onToggleSaved={() => void toggleSavedShop(shop.id)} compared={ids.includes(shop.id)} onToggleCompare={() => toggle(shop.id)} />
            ))}
            {!loading && featured.length === 0 ? <Text className="py-8 text-center text-muted-foreground">{error ? 'Coffee shops are unavailable. Pull down to retry.' : 'No approved coffee shops match these filters yet.'}</Text> : null}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

function greeting(): { label: string; icon: typeof Sun } {
  const hour = new Date().getHours();
  if (hour < 12) return { label: 'Good morning', icon: Sun };
  if (hour < 18) return { label: 'Good afternoon', icon: Sun };
  return { label: 'Good evening', icon: Moon };
}
