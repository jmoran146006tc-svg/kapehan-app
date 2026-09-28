import { Platform, StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { ReduceMotion, useAnimatedStyle, useSharedValue, withSequence, withSpring } from 'react-native-reanimated';
import { Heart, MapPin, Star } from 'lucide-react-native';
import type { Shop } from '@/types/shop';
import { isOpenNow } from '@/utils/hours';
import { formatPriceRange } from '@/utils/price';
import { RemoteImage } from '@/components/ui/remote-image';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Icon } from '@/components/ui/icon';
import { PressableScale } from '@/components/ui/pressable-scale';
import { Text } from '@/components/ui/text';
import { PALETTE, SHADOW, SPRING } from '@/constants/theme';
import { useToast } from '@/hooks/useToast';
import { cloudinaryImageUrl } from '@/lib/cloudinary';
import { success, tap } from '@/lib/haptics';
import { enter } from '@/lib/motion';
import { cn } from '@/lib/utils';
import { MAX_COMPARED_SHOPS, useCompareStore } from '@/store/compareStore';

type ShopCardShop = Shop & { distanceKm?: number | null; openNow?: boolean };

interface ShopCardProps {
  shop: ShopCardShop;
  onPress: () => void;
  saved?: boolean;
  saving?: boolean;
  onToggleSaved?: () => void;
  compared?: boolean;
  onToggleCompare?: () => void;
  index?: number;
}

export function ShopCard({ shop, onPress, saved = false, saving = false, onToggleSaved, compared = false, onToggleCompare, index = 0 }: ShopCardProps) {
  const { showToast } = useToast();
  const compareCount = useCompareStore((state) => state.ids.length);
  const heartScale = useSharedValue(1);
  const compareScale = useSharedValue(1);
  const heartStyle = useAnimatedStyle(() => ({ transform: [{ scale: heartScale.value }] }));
  const compareStyle = useAnimatedStyle(() => ({ transform: [{ scale: compareScale.value }] }));
  const openNow = shop.openNow ?? isOpenNow(shop.hours);

  function toggleCompare() {
    if (!compared && compareCount >= MAX_COMPARED_SHOPS) {
      showToast({ type: 'error', message: `Compare up to ${MAX_COMPARED_SHOPS} shops at a time.` });
      return;
    }
    compareScale.set(withSequence(
      withSpring(1.12, { ...SPRING.bouncy, reduceMotion: ReduceMotion.System }),
      withSpring(1, { ...SPRING.bouncy, reduceMotion: ReduceMotion.System }),
    ));
    onToggleCompare?.();
    showToast({ type: 'success', message: compared ? 'Removed from comparison' : 'Added to comparison' });
  }

  return (
    <Animated.View entering={enter(index)}>
      <Card className={cn('overflow-hidden rounded-3xl py-0', Platform.select({ web: 'transition-all duration-200 hover:-translate-y-0.5' }))}>
        <PressableScale onPress={onPress} scaleTo={0.98} className="gap-3" accessibilityLabel={`View ${shop.name}`}>
          <View className="relative h-52 overflow-hidden bg-accent-soft">
            {shop.photos[0] ? (
              <RemoteImage
                source={{ uri: cloudinaryImageUrl(shop.photos[0], 900) }}
                recyclingKey={shop.id}
                className="h-full w-full"
                contentFit="cover"
                transition={220}
              />
            ) : (
              <LinearGradient colors={[PALETTE.accentSoft, PALETTE.accent]} className="h-full w-full items-center justify-center">
                <Text className="font-display text-7xl text-primary/50">{shop.name.slice(0, 1).toUpperCase()}</Text>
              </LinearGradient>
            )}
            <LinearGradient colors={['transparent', `${PALETTE.primary}E6`]} style={StyleSheet.absoluteFill} />
            <View className="absolute left-3 top-3 flex-row gap-2">
              <View className="rounded-full bg-card/90 px-3 py-1">
                <Text className={openNow ? 'text-xs font-semibold text-success-foreground' : 'text-xs font-semibold text-primary'}>{openNow ? 'Open' : 'Closed'}</Text>
              </View>
              <View className="rounded-full bg-card/90 px-3 py-1">
                <Text className="text-xs text-primary">{shop.hasWifi ? 'WiFi' : 'No WiFi'}</Text>
              </View>
            </View>
            <View className="absolute bottom-4 left-4 right-4 gap-1">
              <Text numberOfLines={1} className="font-display text-2xl text-white">{shop.name}</Text>
              <View className="flex-row items-center gap-3">
                <View className="flex-row items-center gap-1">
                  <Icon as={Star} size={14} fill="currentColor" className="text-gold" />
                  <Text className="text-sm font-semibold text-white">{shop.avgRating.toFixed(1)} ({shop.reviewCount})</Text>
                </View>
                {shop.distanceKm != null ? (
                  <View className="flex-row items-center gap-1">
                    <Icon as={MapPin} size={14} className="text-white" />
                    <Text className="text-sm text-white">{shop.distanceKm.toFixed(1)} km</Text>
                  </View>
                ) : null}
              </View>
            </View>
          </View>
          {shop.description ? <Text numberOfLines={1} className="px-4 text-sm text-muted-foreground">{shop.description}</Text> : null}
        </PressableScale>

        <View className="flex-row flex-wrap items-center gap-2 px-4 pb-4 pt-3">
          <View className="rounded-full bg-secondary px-3 py-1"><Text className="text-xs text-primary">{formatPriceRange(shop.priceMin, shop.priceMax)}</Text></View>
          {(shop.tags ?? []).slice(0, 2).map((tag) => (
            <View key={tag} className="rounded-full bg-accent-soft px-3 py-1"><Text className="text-xs text-accent">{tag}</Text></View>
          ))}
          {onToggleCompare ? (
            <Button size="sm" variant={compared ? 'default' : 'outline'} className="ml-auto rounded-full" onPress={toggleCompare}>
              <Animated.View style={compareStyle}><Text>{compared ? 'Added to compare' : '+ Compare'}</Text></Animated.View>
            </Button>
          ) : null}
        </View>

        {onToggleSaved ? (
          <Button
            size="icon"
            variant="secondary"
            className="absolute right-3 top-3 rounded-full bg-card/95"
            style={SHADOW.e1}
            loading={saving}
            loadingLabel="…"
            accessibilityLabel={saved ? `Remove ${shop.name} from saved shops` : `Save ${shop.name}`}
            onPress={() => {
              heartScale.set(withSequence(
                withSpring(1.28, { ...SPRING.bouncy, reduceMotion: ReduceMotion.System }),
                withSpring(1, { ...SPRING.bouncy, reduceMotion: ReduceMotion.System }),
              ));
              if (saved) tap(); else success();
              onToggleSaved();
            }}>
            <Animated.View style={heartStyle}>
              <Icon as={Heart} size={18} fill={saved ? 'currentColor' : 'none'} className={saved ? 'text-accent' : 'text-foreground'} />
            </Animated.View>
          </Button>
        ) : null}
      </Card>
    </Animated.View>
  );
}
