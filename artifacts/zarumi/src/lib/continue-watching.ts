import { db } from './firebase';
import { doc, setDoc, deleteDoc, getDocs, collection, orderBy, query } from 'firebase/firestore';
import type { User } from 'firebase/auth';

const CW_KEY = 'zarumi_continue_watching';
const MAX_ITEMS = 10;

export interface ContinueWatchingItem {
  workId: number;
  episodeId: number;
  videoSlug: string;
  thumbnail: string | null;
  workTitle: string;
  epTitle: string;
  episodeNumber: number;
  seasonNumber: number | null;
  savedAt: number;
}

export function getContinueWatching(): ContinueWatchingItem[] {
  try {
    const raw = localStorage.getItem(CW_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export async function getContinueWatchingFromFirestore(user: User): Promise<ContinueWatchingItem[]> {
  try {
    const q = query(
      collection(db, `users/${user.uid}/continueWatching`),
      orderBy('savedAt', 'desc'),
    );
    const snap = await getDocs(q);
    const items = snap.docs.map(d => d.data() as ContinueWatchingItem).slice(0, MAX_ITEMS);
    return items;
  } catch {
    return getContinueWatching();
  }
}

export function saveContinueWatching(item: Omit<ContinueWatchingItem, 'savedAt'>, user?: User | null) {
  const fullItem: ContinueWatchingItem = { ...item, savedAt: Date.now() };

  try {
    const existing = getContinueWatching().filter(i => i.workId !== item.workId);
    const updated = [fullItem, ...existing].slice(0, MAX_ITEMS);
    localStorage.setItem(CW_KEY, JSON.stringify(updated));
  } catch {}

  if (user) {
    const ref = doc(db, `users/${user.uid}/continueWatching/${item.workId}`);
    setDoc(ref, fullItem).catch(() => {});
  }
}

export function removeContinueWatching(workId: number, user?: User | null) {
  try {
    const updated = getContinueWatching().filter(i => i.workId !== workId);
    localStorage.setItem(CW_KEY, JSON.stringify(updated));
  } catch {}

  if (user) {
    const ref = doc(db, `users/${user.uid}/continueWatching/${workId}`);
    deleteDoc(ref).catch(() => {});
  }
}
