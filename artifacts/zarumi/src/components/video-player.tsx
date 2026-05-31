import React, { useState } from 'react';
import { Loader2, AlertCircle, ExternalLink } from 'lucide-react';

interface VideoPlayerProps {
  slug: string;
  title?: string;
}

const PROXY_BASE = import.meta.env.VITE_VIDEO_PROXY_BASE_URL || 'https://sitescrapingwally.onrender.com';

export function VideoPlayer({ slug, title }: VideoPlayerProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const proxyUrl = `${PROXY_BASE}/proxy/v/${slug}`;

  return (
    <div className="w-full bg-black rounded-xl overflow-hidden border border-white/10">
      <div className="relative w-full aspect-video bg-zinc-950">
        {loading && !error && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 z-10 bg-zinc-950">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <span className="text-zinc-400 text-sm">Carregando player...</span>
          </div>
        )}
        {error && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 z-10 bg-zinc-950">
            <AlertCircle className="h-10 w-10 text-destructive" />
            <p className="text-zinc-300 font-semibold">Erro ao carregar o vídeo</p>
            <a
              href={proxyUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-sm text-primary hover:underline"
            >
              <ExternalLink className="h-4 w-4" />
              Abrir link direto
            </a>
          </div>
        )}
        <iframe
          src={proxyUrl}
          title={title || 'Player de vídeo'}
          className={`w-full h-full border-0 ${loading || error ? 'opacity-0' : 'opacity-100'} transition-opacity duration-300`}
          allowFullScreen
          allow="autoplay; fullscreen; picture-in-picture"
          onLoad={() => setLoading(false)}
          onError={() => { setLoading(false); setError(true); }}
        />
      </div>
    </div>
  );
}
