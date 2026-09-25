import { useEffect, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { doc, getDoc } from 'firebase/firestore';
import { SafeAreaView } from 'react-native-safe-area-context';
import { db } from '@/lib/firebase';
import { ShopForm } from '@/components/shop-form';
import { Text } from '@/components/ui/text';
import type { ShopFormValues } from '@/lib/schemas/shop';
import { getUserFriendlyError } from '@/lib/errors';
import { goBack } from '@/lib/navigation';
import { useToast } from '@/hooks/useToast';
import { notifyFavoriteShopUpdate } from '@/lib/favorite-shop-updates';
import { Skeleton } from '@/components/ui/skeleton';
import { saveOwnerShopUpdate } from '@/lib/owner-shop-update';

export default function EditListingScreen() {
  const { showToast } = useToast();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [initialValues, setInitialValues] = useState<Partial<ShopFormValues> | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    let active = true;
    getDoc(doc(db, 'shops', id)).then((snap) => {
      if (!active) return;
      if (!snap.exists()) {
        setLoadError('This listing could not be found.');
        return;
      }
      setInitialValues(snap.data() as ShopFormValues);
    }).catch((error) => {
      if (active) setLoadError(getUserFriendlyError(error, 'We could not load this listing. Please try again.'));
    });
    return () => { active = false; };
  }, [id]);

  async function handleUpdate(values: ShopFormValues) {
    if (!id) throw new Error('This listing could not be found.');
    await saveOwnerShopUpdate(id, values);
    showToast({ type: 'success', message: 'Changes saved — your listing is back in review' });
    if (JSON.stringify(initialValues?.hours) !== JSON.stringify(values.hours)) {
      try { await notifyFavoriteShopUpdate(id, values.name, 'shop_hours_updated'); }
      catch { showToast({ type: 'error', message: 'Changes saved, but followers could not be notified.' }); }
    }
    goBack('/(owner)');
  }

  if (!initialValues || !id) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        {loadError || !id ? <Text className="text-destructive">{loadError ?? 'This listing could not be found.'}</Text> : <View className="w-full max-w-2xl gap-4 p-4"><Skeleton className="h-12 w-2/3" /><Skeleton className="h-32 w-full" /><Skeleton className="h-32 w-full" /></View>}
      </View>
    );
  }

  return (
    <SafeAreaView edges={['bottom']} className="flex-1">
      <ScrollView className="flex-1 bg-background p-4" contentContainerClassName="gap-4 pb-8">
        <Text className="text-2xl font-bold">Edit Listing</Text>
        <ShopForm defaultValues={initialValues} onSubmit={handleUpdate} submitLabel="Save changes" />
      </ScrollView>
    </SafeAreaView>
  );
}
