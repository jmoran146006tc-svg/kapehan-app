import { collection, deleteDoc, doc, getDocFromServer, serverTimestamp, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { withTimeout } from '@/lib/timeout';

/**
 * Verifies that this signed-in account can write to and read from Firestore's
 * server, rather than only its local cache. The short-lived document is always
 * cleaned up in the background.
 */
export async function verifyFirestoreConnectivity(uid: string) {
  const checkRef = doc(collection(db, 'users', uid, 'connectivity'));

  try {
    await withTimeout(setDoc(checkRef, { checkedAt: serverTimestamp() }));
    const snapshot = await withTimeout(getDocFromServer(checkRef));

    if (!snapshot.exists()) {
      throw new Error('Firestore did not return the connectivity check.');
    }
  } finally {
    void withTimeout(deleteDoc(checkRef)).catch(() => undefined);
  }
}
