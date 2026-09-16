import { ScrollView } from 'react-native';
import { addDoc, collection } from 'firebase/firestore';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { db } from '@/lib/firebase';
import { useAuth } from '@/hooks/useAuth';
import { ShopForm } from '@/components/shop-form';
import { Text } from '@/components/ui/text';
import type { ShopFormValues } from '@/lib/schemas/shop';

export default function CreateListingScreen() {
  const { user } = useAuth();

  async function handleCreate(values: ShopFormValues) {
    if (!user) throw new Error('You must be logged in to create a listing.');
    await addDoc(collection(db, 'shops'), {
      ...values, ownerId: user.uid, status: 'pending', avgRating: 0, reviewCount: 0,
    });
    router.replace('/(owner)');
  }

  return (
    <SafeAreaView edges={['bottom']} className="flex-1">
      <ScrollView className="flex-1 bg-background p-4" contentContainerClassName="gap-4 pb-8">
        <Text className="text-2xl font-bold">New Listing</Text>
        <ShopForm onSubmit={handleCreate} submitLabel="Submit for approval" />
      </ScrollView>
    </SafeAreaView>
  );
}
