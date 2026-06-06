import React, { useEffect, useState } from 'react';
import { Play, X, Clock } from 'lucide-react';
import { getContinueWatching, getContinueWatchingFromFirestore, removeContinueWatching, type ContinueWatchingItem } from '@/lib/continue-watching';
import { useAuth } from '@/components/auth-provider';

interface ContinueWatchingRowProps {
  onPlay: (item: ContinueWatchingItem) => void;
}

export function ContinueWatchingRow({ onPlay }: ContinueWatchingRowProps) {
  const { user } = useAuth();
  const [items, setItems] = useState<ContinueWatchingItem[]>([]);

  useEffect(() => {
    if (user) {
      getContinueWatchingFromFirestore(user).then(setItems);
    } else {
      setItems(getContinueWatching());
    }
  }, [user]);

  const handleRemove = (e: React.MouseEvent, workId: number) => {
    e.preventDefault();
    e.stopPropagation();
    removeContinueWatching(workId, user);
    setItems(prev => prev.filter(i => i.workId !== workId));
  };

  if (items.length === 0) return null;

  return (
    <section className="py-4 md:py-6">
      <div className="container mx-auto px-3 md:px-6">
        <h2 className="mb-3 font-heading text-xl font-black uppercase tracking-wider text-white flex items-center gap-2">
          <Clock className="h-5 w-5 text-primary" />
          Continue Assistindo
        </h2>
        <div className="flex overflow-x-auto pb-3 gap-3 scrollbar-hide snap-x -mx-3 px-3 md:mx-0 md:px-0">
          {items.map((item) => (
            <div
              key={`${item.workId}-${item.episodeId}`}
              className="group relative flex-shrink-0 snap-start w-[220px] md:w-[260px] cursor-pointer"
              onClick={() => onPlay(item)}
            >
              <div className="relative aspect-video rounded-xl overflow-hidden bg-zinc-900 border border-white/10 transition-all duration-300 group-hover:border-primary/50 group-hover:shadow-lg group-hover:shadow-primary/10">
                {item.thumbnail ? (
                  <img
                    src={item.thumbnail}
                    alt={item.epTitle}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-zinc-800">
                    <Play className="h-8 w-8 text-zinc-600" />
                  </div>
                )}
                <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <div className="h-12 w-12 rounded-full bg-primary/90 flex items-center justify-center shadow-lg">
                    <Play className="h-6 w-6 fill-white text-white" />
                  </div>
                </div>
                <button
                  onClick={(e) => handleRemove(e, item.workId)}
                  className="absolute top-2 right-2 h-6 w-6 rounded-full bg-black/70 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black text-white z-10"
                  title="Remover"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
              <div className="mt-2 px-0.5">
                <p className="text-xs text-zinc-500 font-semibold uppercase tracking-wider truncate">{item.workTitle}</p>
                <p className="text-sm font-bold text-white truncate leading-tight">
                  {item.seasonNumber ? `T${item.seasonNumber} · ` : ''}Ep. {item.episodeNumber} — {item.epTitle}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
