import React, { useEffect, useState } from 'react';
import { useRoute, useLocation } from 'wouter';
import { useGetWork, useListEpisodes, useRecordView } from '@workspace/api-client-react';
import { Layout } from '@/components/layout';
import { Button } from '@/components/ui/button';
import { VideoPlayer } from '@/components/video-player';
import { Play, Plus, Check, Star, Clock, Loader2, X } from 'lucide-react';
import { useAuth } from '@/components/auth-provider';
import { useToast } from '@/hooks/use-toast';
import { db } from '@/lib/firebase';
import { doc, getDoc, setDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import type { Episode } from '@workspace/api-client-react';

export default function AnimeDetail() {
  const [, params] = useRoute('/anime/:id');
  const id = params?.id ? parseInt(params.id, 10) : 0;

  const { data: work, isLoading } = useGetWork(id, { query: { enabled: !!id } });
  const { data: episodes } = useListEpisodes(id, { query: { enabled: !!id } });
  const recordView = useRecordView();

  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [inList, setInList] = useState(false);
  const [listLoading, setListLoading] = useState(false);
  const [activeEpisode, setActiveEpisode] = useState<Episode | null>(null);

  useEffect(() => {
    if (id) recordView.mutate({ id });
  }, [id]);

  useEffect(() => {
    async function checkList() {
      if (!user || !id) return;
      try {
        const docRef = doc(db, `users/${user.uid}/myList/${id}`);
        const docSnap = await getDoc(docRef);
        setInList(docSnap.exists());
      } catch (err) {
        console.error('Error checking list:', err);
      }
    }
    checkList();
  }, [user, id]);

  const toggleList = async () => {
    if (!user) { setLocation('/login'); return; }
    if (!work) return;
    setListLoading(true);
    try {
      const docRef = doc(db, `users/${user.uid}/myList/${work.id}`);
      if (inList) {
        await deleteDoc(docRef);
        setInList(false);
        toast({ title: 'Removido da lista', description: work.title });
      } else {
        await setDoc(docRef, { addedAt: serverTimestamp(), workId: work.id });
        setInList(true);
        toast({ title: 'Adicionado à lista!', description: work.title });
      }
    } catch (err: any) {
      toast({ title: 'Erro ao salvar na lista', description: err?.message, variant: 'destructive' });
    } finally {
      setListLoading(false);
    }
  };

  if (isLoading || !work) {
    return (
      <Layout>
        <div className="flex h-screen items-center justify-center">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  const bannerUrl = work.customBannerUrl || (work.backdropPath ? `https://image.tmdb.org/t/p/original${work.backdropPath}` : '');
  const posterUrl = work.customThumbnailUrl || (work.posterPath ? `https://image.tmdb.org/t/p/w500${work.posterPath}` : '');

  return (
    <Layout>
      {/* Player modal */}
      {activeEpisode && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm p-4">
          <div className="w-full max-w-5xl">
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="text-zinc-400 text-xs uppercase tracking-wider font-semibold">{work.title}</p>
                <h3 className="font-heading text-lg font-black uppercase text-white">
                  Ep. {activeEpisode.episodeNumber} — {activeEpisode.title}
                </h3>
              </div>
              <button
                onClick={() => setActiveEpisode(null)}
                className="flex items-center justify-center h-9 w-9 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            {activeEpisode.videoSlug ? (
              <VideoPlayer videoUrl={activeEpisode.videoSlug} title={`${work.title} - Ep. ${activeEpisode.episodeNumber}`} />
            ) : (
              <div className="aspect-video bg-zinc-900 rounded-xl flex flex-col items-center justify-center gap-3 border border-white/10">
                <Play className="h-10 w-10 text-zinc-600" />
                <p className="text-zinc-400 text-sm">Vídeo não configurado para este episódio.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Hero Banner */}
      <div className="relative h-[60vh] md:h-[80vh] w-full bg-background -mt-12">
        <div className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-40" style={{ backgroundImage: `url(${bannerUrl})` }} />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/80 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-background via-background/40 to-transparent md:w-2/3" />

        <div className="absolute inset-0 flex flex-col justify-end pb-12 md:pb-24">
          <div className="container mx-auto px-4 md:px-8">
            <div className="flex flex-col md:flex-row gap-8 items-end">
              <div className="hidden md:block w-56 shrink-0 rounded-lg overflow-hidden shadow-2xl border border-white/10 z-10 translate-y-12">
                <img src={posterUrl} alt={work.title} className="w-full object-cover aspect-[2/3]" />
              </div>

              <div className="max-w-3xl space-y-3 relative z-10">
                <h1 className="font-heading text-4xl md:text-6xl font-black uppercase tracking-tight text-white drop-shadow-md">
                  {work.title}
                </h1>
                <div className="flex flex-wrap items-center gap-3 text-sm font-medium text-zinc-300">
                  {work.rating && (
                    <span className="flex items-center text-yellow-400">
                      <Star className="mr-1 h-4 w-4 fill-current" /> {work.rating.toFixed(1)}
                    </span>
                  )}
                  {work.releaseYear && <span>{work.releaseYear}</span>}
                  {work.totalEpisodes && <span>{work.totalEpisodes} eps</span>}
                  <span className="uppercase text-zinc-400 border border-zinc-600 rounded px-1.5 py-0.5 text-xs">{work.type}</span>
                </div>
                <p className="text-zinc-300 text-base line-clamp-3 leading-relaxed max-w-2xl">
                  {work.synopsis}
                </p>
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {work.genres?.map(g => (
                    <span key={g} className="text-xs font-bold uppercase px-2 py-0.5 bg-white/10 rounded text-zinc-300 tracking-wider">
                      {g}
                    </span>
                  ))}
                </div>
                <div className="flex items-center gap-3 pt-2">
                  {episodes && episodes.length > 0 && (
                    <Button
                      size="lg"
                      className="font-black uppercase tracking-wider bg-primary hover:bg-primary/90 text-white"
                      onClick={() => setActiveEpisode(episodes[0])}
                    >
                      <Play className="mr-2 h-5 w-5 fill-current" />
                      Assistir EP 1
                    </Button>
                  )}
                  <Button
                    size="lg"
                    variant="outline"
                    className={`font-semibold border-white/20 backdrop-blur-md ${inList ? 'bg-white/20 text-white' : 'bg-black/40 text-white hover:bg-white/20'}`}
                    onClick={toggleList}
                    disabled={listLoading}
                  >
                    {listLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : inList ? <Check className="mr-2 h-5 w-5" /> : <Plus className="mr-2 h-5 w-5" />}
                    {inList ? 'Na Lista' : 'Minha Lista'}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 md:px-8 py-10 md:pt-20">
        <div className="flex flex-col md:flex-row gap-10">
          {/* Episodes List */}
          <div className="flex-1">
            <h2 className="font-heading text-2xl font-black uppercase tracking-tight text-white mb-4 flex items-center gap-2">
              Episódios
              <span className="text-sm font-normal text-zinc-500 normal-case tracking-normal">{episodes?.length || 0} disponíveis</span>
            </h2>

            {episodes && episodes.length > 0 ? (
              <div className="space-y-2">
                {episodes.map((ep) => {
                  const thumb = ep.customThumbnailUrl || (ep.thumbnailPath ? `https://image.tmdb.org/t/p/w300${ep.thumbnailPath}` : null);
                  const hasVideo = !!ep.videoSlug;
                  return (
                    <button
                      key={ep.id}
                      onClick={() => setActiveEpisode(ep)}
                      className={`group w-full flex gap-4 p-3 rounded-xl transition-colors border text-left ${hasVideo ? 'hover:bg-white/5 border-transparent hover:border-white/10 cursor-pointer' : 'border-transparent opacity-60 cursor-default'}`}
                      disabled={!hasVideo}
                      title={!hasVideo ? 'Vídeo não disponível' : undefined}
                    >
                      <div className="relative w-36 shrink-0 aspect-video rounded-lg overflow-hidden bg-zinc-900">
                        {thumb ? (
                          <img src={thumb} alt={ep.title} className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-zinc-800">
                            <Play className="h-6 w-6 text-zinc-600" />
                          </div>
                        )}
                        {hasVideo && (
                          <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <div className="h-10 w-10 rounded-full bg-primary/90 flex items-center justify-center">
                              <Play className="h-5 w-5 fill-white text-white" />
                            </div>
                          </div>
                        )}
                      </div>
                      <div className="flex-1 py-0.5">
                        <div className="flex justify-between items-start gap-2">
                          <h3 className="font-heading font-bold uppercase text-white text-base leading-tight">
                            <span className="text-zinc-500 mr-1.5">{ep.episodeNumber}.</span>
                            {ep.title}
                          </h3>
                          <div className="flex items-center gap-2 shrink-0">
                            {ep.duration && <span className="text-xs text-zinc-500 flex items-center"><Clock className="h-3 w-3 mr-0.5" />{ep.duration}m</span>}
                            {!hasVideo && <span className="text-[10px] uppercase tracking-wider text-zinc-600 border border-zinc-700 rounded px-1.5 py-0.5">Em breve</span>}
                          </div>
                        </div>
                        {ep.synopsis && <p className="text-xs text-zinc-400 mt-1 line-clamp-2">{ep.synopsis}</p>}
                      </div>
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="p-8 text-center rounded-xl bg-white/5 border border-white/10 text-zinc-400">
                Nenhum episódio cadastrado ainda.
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="w-full md:w-72 space-y-4 shrink-0">
            <div className="p-5 rounded-xl bg-zinc-900/50 border border-white/10">
              <h3 className="font-heading text-base font-black uppercase tracking-tight text-white mb-3">Informações</h3>
              <dl className="space-y-2.5 text-sm">
                <div>
                  <dt className="text-zinc-500 text-xs uppercase tracking-wider">Título Original</dt>
                  <dd className="text-zinc-200 font-medium mt-0.5">{work.originalTitle || work.title}</dd>
                </div>
                <div>
                  <dt className="text-zinc-500 text-xs uppercase tracking-wider">Status</dt>
                  <dd className="text-zinc-200 font-medium capitalize mt-0.5">{work.status === 'ongoing' ? 'Em Lançamento' : work.status === 'completed' ? 'Completo' : 'Em Breve'}</dd>
                </div>
                <div>
                  <dt className="text-zinc-500 text-xs uppercase tracking-wider">Visualizações</dt>
                  <dd className="text-zinc-200 font-medium mt-0.5">{work.viewCount?.toLocaleString()}</dd>
                </div>
              </dl>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
