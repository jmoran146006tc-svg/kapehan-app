import { useEffect, useState } from 'react';
import { arrayRemove, arrayUnion, doc, getDoc, onSnapshot, serverTimestamp, setDoc, writeBatch } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/hooks/useAuth';
import { getUserFriendlyError } from '@/lib/errors';
import { withTimeout } from '@/lib/timeout';
import { useToast } from '@/hooks/useToast';

// Shared by every useSavedShops instance, including screens mounted later in this app session.
const followerSyncAttempts = new Set<string>();

export function useSavedShops() {
  const { user } = useAuth();
  const { showToast } = useToast();
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
  const savedKey = savedShopIds.join('|');

  useEffect(() => {
    if (!user || savedSnapshot.userId !== user.uid) return;
    for (const shopId of savedSnapshot.ids) {
      const attemptKey = `${user.uid}/${shopId}`;
      if (followerSyncAttempts.has(attemptKey)) continue;
      followerSyncAttempts.add(attemptKey);
      const followerRef = doc(db, 'shops', shopId, 'followers', user.uid);
      void getDoc(followerRef).then((snap) => {
        if (!snap.exists()) return setDoc(followerRef, { createdAt: serverTimestamp() });
      }).catch((syncError) => console.warn('Favorite follower sync skipped:', syncError instanceof Error ? syncError.message : syncError));
    }
  }, [savedKey, savedSnapshot.ids, savedSnapshot.userId, user]);

  async function toggleSavedShop(shopId: string) {
    if (!user) {
      showToast({ type: 'error', message: 'Log in to save shops.' });
      return;
    }

    setError(null);
    setSavingShopId(shopId);
    try {
      const removing = savedShopIds.includes(shopId);
      const batch = writeBatch(db);
      batch.set(doc(db, 'users', user.uid), { savedShopIds: removing ? arrayRemove(shopId) : arrayUnion(shopId) }, { merge: true });
      const followerRef = doc(db, 'shops', shopId, 'followers', user.uid);
      if (removing) batch.delete(followerRef);
      else batch.set(followerRef, { createdAt: serverTimestamp() });
      await withTimeout(batch.commit());
      showToast({ type: 'success', message: savedShopIds.includes(shopId) ? 'Removed from favorites' : 'Added to favorites' });
    } catch (saveError) {
      showToast({ type: 'error', message: getUserFriendlyError(saveError, 'We could not update your saved shops. Please try again.') });
    } finally {
      setSavingShopId(null);
    }
  }

  return { savedShopIds, savingShopId, error, toggleSavedShop };
}
