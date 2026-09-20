import { useEffect, useState } from 'react';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Shop } from '@/types/shop';

export function useShops() {
  const [shops, setShops] = useState<Shop[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, 'shops'), where('status', '==', 'approved'));
    return onSnapshot(
  q,
  (snap) => {
    setShops(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Shop)));
    setLoading(false);
  },
  (error) => {
    console.error('useShops listener error:', error);
    setLoading(false);
  }
);
  }, []);

  return { shops, loading };
}