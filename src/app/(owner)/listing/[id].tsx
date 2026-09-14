import { useEffect, useState } from 'react';
import { ScrollView, ActivityIndicator, View } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { SafeAreaView } from 'react-native-safe-area-context';
import { db } from '@/lib/firebase';
import { ShopForm } from '@/components/shop-form';
import { Text } from '@/components/ui/text';
import type { ShopFormValues } from '@/lib/schemas/shop';

export default function EditListingScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [initialValues, setInitialValues] = useState<Partial<ShopFormValues> | null>(null);

  useEffect(() => {
    if (!id) return;
    getDoc(doc(db, 'shops', id)).then((snap) => {
      setInitialValues(snap.exists() ? (snap.data() as ShopFormValues) : {});
    });
  }, [id]);

  async function handleUpdate(values: ShopFormValues) {
    if (!id) return;
    // Resets status to "pending" on every save — an edited listing goes
    // back through admin review before it's visible again.
    await updateDoc(doc(db, 'shops', id), { ...values, status: 'pending' });
    router.back();
  }

  if (!initialValues) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <ActivityIndicator size="large" />
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