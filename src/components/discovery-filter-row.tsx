import { useState } from 'react';
import { ScrollView, View } from 'react-native';
import { LinearGradient } from '@/components/ui/linear-gradient';
import { PALETTE } from '@/constants/theme';
import { FilterChip } from '@/components/filter-chip';
import { useFilterStore } from '@/store/filterStore';
import { PRICE_BUCKET_LABELS, type PriceBucket } from '@/utils/price';
import { TAG_OPTIONS } from '@/constants/tags';

export function DiscoveryFilterRow({ dark = false }: { dark?: boolean }) {
  const { priceBuckets, wifiOnly, tags, openNowOnly, setFilter, toggleArrayFilter, reset } = useFilterStore();
  const hasActiveFilter = wifiOnly || openNowOnly || priceBuckets.length > 0 || tags.length > 0;
  const [scrolled, setScrolled] = useState(false);

  // The header gradient runs primary (left) -> espresso2 (right), so each edge fades to its own color.
  const leftColor = dark ? PALETTE.primary : PALETTE.background;
  const rightColor = dark ? PALETTE.espresso2 : PALETTE.background;

  return (
    <View className="relative">
      <ScrollView
        horizontal
        className="min-h-11"
        showsHorizontalScrollIndicator={false}
        scrollEventThrottle={16}
        onScroll={(event) => setScrolled(event.nativeEvent.contentOffset.x > 4)}
        contentContainerClassName="items-center gap-2 py-1 pr-6">
        <FilterChip label="All" selected={!hasActiveFilter} onPress={reset} />
        <FilterChip label="Open Now" selected={openNowOnly} onPress={() => setFilter('openNowOnly', !openNowOnly)} />
        <FilterChip label="WiFi" selected={wifiOnly} onPress={() => setFilter('wifiOnly', !wifiOnly)} />
        {(['budget', 'moderate', 'premium'] as PriceBucket[]).map((bucket) => (
          <FilterChip key={bucket} label={PRICE_BUCKET_LABELS[bucket]} selected={priceBuckets.includes(bucket)} onPress={() => toggleArrayFilter('priceBuckets', bucket)} />
        ))}
        {TAG_OPTIONS.map((tag) => (
          <FilterChip key={tag} label={tag} selected={tags.includes(tag)} onPress={() => toggleArrayFilter('tags', tag)} />
        ))}
      </ScrollView>

      {scrolled ? (
        <LinearGradient
          pointerEvents="none"
          colors={[leftColor, `${leftColor}00`]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          className="absolute bottom-0 left-0 top-0 w-6"
        />
      ) : null}
      <LinearGradient
        pointerEvents="none"
        colors={[`${rightColor}00`, rightColor]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        className="absolute bottom-0 right-0 top-0 w-6"
      />
    </View>
  );
}