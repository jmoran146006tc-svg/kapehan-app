import { useEffect, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { SafeAreaView } from 'react-native-safe-area-context';
import { db } from '@/lib/firebase';
import { ShopForm } from '@/components/shop-form';
import { Text } from '@/components/ui/text';
import type { ShopFormValues } from '@/lib/schemas/shop';
import { getUserFriendlyError } from '@/lib/errors';

export default function EditListingScreen() {
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
    // Resets status to "pending" on every save — an edited listing goes
    // back through admin review before it's visible again.
    await updateDoc(doc(db, 'shops', id), { ...values, status: 'pending' });
    router.back();
  }

  if (!initialValues || !id) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <Text className={loadError || !id ? 'text-destructive' : 'text-muted-foreground'}>{loadError ?? (!id ? 'This listing could not be found.' : 'Loading…')}</Text>
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
