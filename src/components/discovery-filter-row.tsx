import { ScrollView } from 'react-native';
import { FilterChip } from '@/components/filter-chip';
import { useFilterStore } from '@/store/filterStore';
import { PRICE_BUCKET_LABELS, type PriceBucket } from '@/utils/price';
import { TAG_OPTIONS } from '@/constants/tags';

export function DiscoveryFilterRow() {
  const { priceBuckets, wifiOnly, tags, openNowOnly, setFilter, toggleArrayFilter, reset } = useFilterStore();
  const hasActiveFilter = wifiOnly || openNowOnly || priceBuckets.length > 0 || tags.length > 0;

  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerClassName="gap-2 pr-4">
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
  );
}
