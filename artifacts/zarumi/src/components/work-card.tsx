import React from 'react';
import { Link } from 'wouter';
import { Play } from 'lucide-react';
import type { Work } from '@workspace/api-client-react';

interface WorkCardProps {
  work: Work;
  rank?: number;
}

export function WorkCard({ work, rank }: WorkCardProps) {
  const imageUrl = work.customThumbnailUrl 
    ? work.customThumbnailUrl 
    : work.posterPath 
      ? `https://image.tmdb.org/t/p/w500${work.posterPath}`
      : 'https://via.placeholder.com/500x750?text=No+Image';

  return (
    <Link href={`/anime/${work.id}`} className="group relative block w-full overflow-hidden rounded-md transition-transform duration-300 hover:scale-[1.02] hover:z-10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background">
      <div className="aspect-[2/3] w-full overflow-hidden bg-zinc-900">
        <img
          src={imageUrl}
          alt={work.title}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          loading="lazy"
        />
        
        {/* Overlay gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-background/20 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
        
        {/* Play Icon */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 transition-all duration-300 group-hover:opacity-100 scale-90 group-hover:scale-100">
          <div className="rounded-full bg-primary/90 p-4 text-white shadow-lg backdrop-blur-sm">
            <Play className="h-8 w-8 fill-current" />
          </div>
        </div>

        {/* Badges / Info */}
        <div className="absolute top-2 right-2 flex gap-1">
          {work.type === 'movie' && (
            <span className="rounded bg-black/60 px-2 py-1 text-xs font-semibold text-white backdrop-blur-md">
              Filme
            </span>
          )}
        </div>
        
        <div className="absolute bottom-0 left-0 right-0 p-4 translate-y-4 opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100">
          <h3 className="font-heading text-lg font-bold leading-tight text-white line-clamp-2">
            {work.title}
          </h3>
          <div className="mt-1 flex items-center gap-2 text-xs text-zinc-300">
            {work.releaseYear && <span>{work.releaseYear}</span>}
            {work.status === 'ongoing' && <span className="text-green-400">Em Lançamento</span>}
          </div>
        </div>
      </div>
      
      {/* Rank number for Top 10 */}
      {rank && (
        <div className="absolute -left-4 -bottom-4 z-20 font-heading text-[120px] font-black leading-none tracking-tighter text-transparent" style={{ WebkitTextStroke: '2px rgba(255, 255, 255, 0.4)', textShadow: '2px 4px 10px rgba(0,0,0,0.5)' }}>
          {rank}
        </div>
      )}
    </Link>
  );
}
