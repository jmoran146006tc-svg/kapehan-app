import { useEffect, useState } from 'react';
import { ScrollView } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Text } from '@/components/ui/text';

export default function ShopDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [shop, setShop] = useState<any>(null);

  useEffect(() => {
    if (!id) return;
    return onSnapshot(doc(db, 'shops', id), (snap) => setShop({ id: snap.id, ...snap.data() }));
  }, [id]);

  if (!shop) return <Text className="p-4">Loading…</Text>;

  return (
    <ScrollView className="flex-1 bg-background p-4">
      <Text className="text-2xl font-bold">{shop.name}</Text>
      {/* TODO: photos, hours/open-now, map, reviews, Kapehan Check, save/compare actions */}
    </ScrollView>
  );
}
