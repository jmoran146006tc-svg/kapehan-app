import { useEffect, useState } from 'react';
import { arrayRemove, arrayUnion, doc, onSnapshot, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/hooks/useAuth';
import { getUserFriendlyError } from '@/lib/errors';
import { withTimeout } from '@/lib/timeout';

export function useSavedShops() {
  const { user } = useAuth();
  const [savedShopIds, setSavedShopIds] = useState<string[]>([]);
  const [savingShopId, setSavingShopId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      setSavedShopIds([]);
      return;
    }

    return onSnapshot(
      doc(db, 'users', user.uid),
      (snapshot) => setSavedShopIds(snapshot.data()?.savedShopIds ?? []),
      (snapshotError) => setError(getUserFriendlyError(snapshotError, 'We could not load your saved shops. Please try again.')),
    );
  }, [user]);

  async function toggleSavedShop(shopId: string) {
    if (!user) {
      setError('Log in to save shops.');
      return;
    }

    setError(null);
    setSavingShopId(shopId);
    try {
      await withTimeout(updateDoc(doc(db, 'users', user.uid), {
        savedShopIds: savedShopIds.includes(shopId) ? arrayRemove(shopId) : arrayUnion(shopId),
      }));
    } catch (saveError) {
      setError(getUserFriendlyError(saveError, 'We could not update your saved shops. Please try again.'));
    } finally {
      setSavingShopId(null);
    }
  }

  return { savedShopIds, savingShopId, error, toggleSavedShop };
}
