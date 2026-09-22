import { useEffect, useState } from 'react';
import { onAuthStateChanged, type User } from 'firebase/auth';
import { doc, onSnapshot, serverTimestamp, setDoc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';

export type Role = 'user' | 'owner' | 'admin';
export type AccountStatus = 'active' | 'suspended';

interface AuthState {
  user: User | null;
  role: Role | null;
  status: AccountStatus | null;
  loading: boolean;
}

export function useAuth(): AuthState {
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<Role | null>(null);
  const [status, setStatus] = useState<AccountStatus | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      if (!firebaseUser) {
        setRole(null);
        setStatus(null);
        setLoading(false);
      }
    });
    return unsubAuth;
  }, []);

  useEffect(() => {
    if (!user) return;
    const userRef = doc(db, 'users', user.uid);
    const unsubDoc = onSnapshot(
      userRef,
      (snap) => {
        if (!snap.exists()) {
          // Repairs an Auth account that never got, or later lost, its profile.
          // The original registration role cannot be inferred, so it defaults to user.
          void setDoc(
            userRef,
            {
              name: user.displayName ?? '',
              email: user.email ?? '',
              role: 'user',
              status: 'active',
              createdAt: serverTimestamp(),
              preferences: {},
              savedShopIds: [],
              recentlyViewed: [],
              visitCount: 0,
            },
            { merge: true },
          ).catch((error) => console.error('Failed to repair missing user profile', error));
          return;
        }
        setRole((snap.data()?.role as Role) ?? null);
        // Older profiles predate suspension support; treat them as active until
        // an admin explicitly assigns a status.
        setStatus((snap.data()?.status as AccountStatus | undefined) ?? 'active');
        setLoading(false);
      },
      (error) => console.error('useAuth role listener error:', error),
    );
    return unsubDoc;
  }, [user]);

  return { user, role, status, loading };
}
