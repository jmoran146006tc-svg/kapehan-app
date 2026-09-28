import { ScrollView } from 'react-native';
import { addDoc, collection } from 'firebase/firestore';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { db } from '@/lib/firebase';
import { useAuth } from '@/hooks/useAuth';
import { ShopForm } from '@/components/shop-form';
import type { ShopFormValues } from '@/lib/schemas/shop';
import { withTimeout } from '@/lib/timeout';
import { useToast } from '@/hooks/useToast';
import { ScreenHeader } from '@/components/screen-header';

export default function CreateListingScreen() {
  const { user } = useAuth();
  const { showToast } = useToast();

  async function handleCreate(values: ShopFormValues) {
    if (!user) throw new Error('You must be logged in to create a listing.');
    await withTimeout(addDoc(collection(db, 'shops'), {
      ...values, ownerId: user.uid, status: 'pending', avgRating: 0, reviewCount: 0,
      ratingCounts: { '1': 0, '2': 0, '3': 0, '4': 0, '5': 0 }, viewCount: 0,
    }));
    showToast({ type: 'success', message: 'Listing saved' });
    router.replace('/(owner)');
  }

  return (
    <SafeAreaView edges={['bottom']} className="flex-1">
      <ScreenHeader title="New Listing" fallbackHref="/(owner)" />
      <ScrollView className="flex-1 bg-background p-4" contentContainerClassName="mx-auto w-full max-w-2xl gap-4 pb-8">
        <ShopForm onSubmit={handleCreate} submitLabel="Submit for approval" />
      </ScrollView>
    </SafeAreaView>
  );
}
