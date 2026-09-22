import { useEffect, useState } from 'react';
import { arrayRemove, arrayUnion, doc, onSnapshot, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/hooks/useAuth';
import { getUserFriendlyError } from '@/lib/errors';
import { withTimeout } from '@/lib/timeout';

export function useSavedShops() {
  const { user } = useAuth();
  const [savedSnapshot, setSavedSnapshot] = useState<{ userId: string | null; ids: string[] }>({ userId: null, ids: [] });
  const [savingShopId, setSavingShopId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;

    return onSnapshot(
      doc(db, 'users', user.uid),
      (snapshot) => setSavedSnapshot({ userId: user.uid, ids: snapshot.data()?.savedShopIds ?? [] }),
      (snapshotError) => setError(getUserFriendlyError(snapshotError, 'We could not load your saved shops. Please try again.')),
    );
  }, [user]);

  const savedShopIds = savedSnapshot.userId === user?.uid ? savedSnapshot.ids : [];

  async function toggleSavedShop(shopId: string) {
    if (!user) {
      setError('Log in to save shops.');
      return;
    }

    setError(null);
    setSavingShopId(shopId);
    try {
      await withTimeout(setDoc(doc(db, 'users', user.uid), {
        savedShopIds: savedShopIds.includes(shopId) ? arrayRemove(shopId) : arrayUnion(shopId),
      }, { merge: true }));
    } catch (saveError) {
      setError(getUserFriendlyError(saveError, 'We could not update your saved shops. Please try again.'));
    } finally {
      setSavingShopId(null);
    }
  }

  return { savedShopIds, savingShopId, error, toggleSavedShop };
}
