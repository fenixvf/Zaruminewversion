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

export function saveContinueWatching(item: Omit<ContinueWatchingItem, 'savedAt'>) {
  try {
    const existing = getContinueWatching().filter(i => i.workId !== item.workId);
    const updated = [{ ...item, savedAt: Date.now() }, ...existing].slice(0, MAX_ITEMS);
    localStorage.setItem(CW_KEY, JSON.stringify(updated));
  } catch {}
}

export function removeContinueWatching(workId: number) {
  try {
    const updated = getContinueWatching().filter(i => i.workId !== workId);
    localStorage.setItem(CW_KEY, JSON.stringify(updated));
  } catch {}
}
