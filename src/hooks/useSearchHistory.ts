import { useEffect, useRef, useState } from 'react';
import { doc, onSnapshot, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { withTimeout } from '@/lib/timeout';
import { getUserFriendlyError } from '@/lib/errors';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/useToast';
import { MAX_RECENT_SEARCHES, MAX_SEARCH_LENGTH } from '@/constants/history';
import { MIN_SEARCH_LENGTH } from '@/utils/search';

export function useSearchHistory() {
  const { user } = useAuth();
  const uid = user?.uid;
  const { showToast } = useToast();
  const [view, setView] = useState<{ uid: string; searches: string[] } | null>(null);
  const latest = useRef<{ uid: string; searches: string[]; confirmed: string[]; pending: number; revision: number } | null>(null);

  useEffect(() => {
    if (!uid) return;
    const state = { uid, searches: [] as string[], confirmed: [] as string[], pending: 0, revision: 0 };
    latest.current = state;
    const unsubscribe = onSnapshot(doc(db, 'users', uid), { includeMetadataChanges: true }, (snapshot) => {
      const raw: unknown = snapshot.data()?.recentSearches;
      const searches = Array.isArray(raw) ? raw.filter((item): item is string => typeof item === 'string').slice(0, MAX_RECENT_SEARCHES) : [];
      if (!snapshot.metadata.hasPendingWrites) state.confirmed = searches;
      // An older write's snapshot must not replace a newer optimistic edit.
      if (!state.pending) {
        state.searches = searches;
        setView({ uid, searches });
      }
    }, (error) => showToast({ type: 'error', message: getUserFriendlyError(error, 'We could not load your search history.') }));
    return () => { unsubscribe(); latest.current = null; };
  }, [showToast, uid]);

  function write(searches: string[], critical: boolean) {
    const state = latest.current;
    if (!uid || state?.uid !== uid || JSON.stringify(state.searches) === JSON.stringify(searches)) return;
    state.searches = searches;
    state.pending += 1;
    const revision = ++state.revision;
    setView({ uid, searches });
    void withTimeout(updateDoc(doc(db, 'users', uid), { recentSearches: searches })).catch((error) => {
      console.warn('Search history update failed', error);
      if (latest.current !== state) return;
      if (state.revision === revision) {
        state.searches = state.confirmed;
        setView({ uid, searches: state.confirmed });
      }
      if (critical) showToast({ type: 'error', message: getUserFriendlyError(error, 'We could not update your search history. Please try again.') });
    }).finally(() => { state.pending -= 1; });
  }

  function record(query: string) {
    const normalized = query.trim().replace(/\s+/g, ' ').slice(0, MAX_SEARCH_LENGTH).trim();
    if (normalized.length < MIN_SEARCH_LENGTH || latest.current?.uid !== uid) return;
    const current = latest.current?.searches ?? [];
    write([normalized, ...current.filter((item) => item.toLowerCase() !== normalized.toLowerCase())].slice(0, MAX_RECENT_SEARCHES), false);
  }

  function remove(query: string) {
    write((latest.current?.searches ?? []).filter((item) => item.toLowerCase() !== query.toLowerCase()), true);
  }

  return { searches: view && view.uid === uid ? view.searches : [], record, remove, clear: () => write([], true) };
}
