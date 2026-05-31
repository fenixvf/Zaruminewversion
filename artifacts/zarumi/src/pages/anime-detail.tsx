import React, { useEffect, useState } from 'react';
import { useRoute } from 'wouter';
import { useGetWork, useListEpisodes, useRecordView } from '@workspace/api-client-react';
import { Layout } from '@/components/layout';
import { Button } from '@/components/ui/button';
import { Play, Plus, Check, Star, Calendar, Clock, Loader2 } from 'lucide-react';
import { useAuth } from '@/components/auth-provider';
import { db } from '@/lib/firebase';
import { doc, getDoc, setDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';

export default function AnimeDetail() {
  const [, params] = useRoute('/anime/:id');
  const id = params?.id ? parseInt(params.id, 10) : 0;
  
  const { data: work, isLoading } = useGetWork(id, { query: { enabled: !!id } });
  const { data: episodes } = useListEpisodes(id, { query: { enabled: !!id } });
  const recordView = useRecordView();
  
  const { user } = useAuth();
  const [inList, setInList] = useState(false);
  const [listLoading, setListLoading] = useState(false);

  // Record view count once
  useEffect(() => {
    if (id) {
      recordView.mutate({ id });
    }
  }, [id]);

  // Check if in user's list
  useEffect(() => {
    async function checkList() {
      if (!user || !id) return;
      try {
        const docRef = doc(db, `users/${user.uid}/myList/${id}`);
        const docSnap = await getDoc(docRef);
        setInList(docSnap.exists());
      } catch (err) {
        console.error("Error checking list:", err);
      }
    }
    checkList();
  }, [user, id]);

  const toggleList = async () => {
    if (!user || !work) return; // TODO: redirect to login if no user
    setListLoading(true);
    try {
      const docRef = doc(db, `users/${user.uid}/myList/${work.id}`);
      if (inList) {
        await deleteDoc(docRef);
        setInList(false);
      } else {
        await setDoc(docRef, {
          addedAt: serverTimestamp(),
          workId: work.id
        });
        setInList(true);
      }
    } catch (err) {
      console.error("Error toggling list:", err);
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
      {/* Hero Banner */}
      <div className="relative h-[60vh] md:h-[80vh] w-full bg-background -mt-16">
        <div className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-40" style={{ backgroundImage: `url(${bannerUrl})` }} />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/80 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-background via-background/40 to-transparent md:w-2/3" />
        
        <div className="absolute inset-0 flex flex-col justify-end pb-12 md:pb-24">
          <div className="container mx-auto px-4 md:px-8">
            <div className="flex flex-col md:flex-row gap-8 items-end">
              <div className="hidden md:block w-64 shrink-0 rounded-lg overflow-hidden shadow-2xl border border-white/10 z-10 translate-y-12">
                <img src={posterUrl} alt={work.title} className="w-full object-cover aspect-[2/3]" />
              </div>
              
              <div className="max-w-3xl space-y-4 relative z-10">
                <h1 className="font-heading text-4xl md:text-6xl font-black tracking-tight text-white drop-shadow-md">
                  {work.title}
                </h1>
                
                <div className="flex flex-wrap items-center gap-4 text-sm font-medium text-zinc-300">
                  {work.rating && (
                    <span className="flex items-center text-green-400">
                      <Star className="mr-1 h-4 w-4 fill-current" /> {work.rating.toFixed(1)} Classificação
                    </span>
                  )}
                  {work.releaseYear && <span>{work.releaseYear}</span>}
                  {work.totalEpisodes && <span>{work.totalEpisodes} Episódios</span>}
                  <span className="uppercase text-zinc-400 border border-zinc-600 rounded px-1">{work.type}</span>
                </div>
                
                <p className="text-zinc-300 text-lg line-clamp-4 leading-relaxed max-w-2xl drop-shadow">
                  {work.synopsis}
                </p>
                
                <div className="flex flex-wrap gap-2 pt-2">
                  {work.genres?.map(g => (
                    <span key={g} className="text-xs font-semibold px-2.5 py-1 bg-white/10 rounded text-zinc-200">
                      {g}
                    </span>
                  ))}
                </div>
                
                <div className="flex items-center gap-4 pt-4">
                  <Button size="lg" className="rounded-full px-8 font-bold bg-white text-black hover:bg-zinc-200">
                    <Play className="mr-2 h-5 w-5 fill-current" />
                    Assistir
                  </Button>
                  {user && (
                    <Button 
                      size="lg" 
                      variant="outline" 
                      className={`rounded-full px-6 font-semibold border-white/20 backdrop-blur-md ${inList ? 'bg-white/20 text-white' : 'bg-black/40 text-white hover:bg-white/20'}`}
                      onClick={toggleList}
                      disabled={listLoading}
                    >
                      {listLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : inList ? <Check className="mr-2 h-5 w-5" /> : <Plus className="mr-2 h-5 w-5" />}
                      {inList ? 'Na Lista' : 'Minha Lista'}
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 md:px-8 py-12">
        <div className="flex flex-col md:flex-row gap-12">
          {/* Episodes List */}
          <div className="flex-1">
            <h2 className="font-heading text-2xl font-bold text-white mb-6 flex items-center">
              Episódios <span className="ml-3 text-sm font-normal text-zinc-500">{episodes?.length || 0} disponíveis</span>
            </h2>
            
            {episodes && episodes.length > 0 ? (
              <div className="space-y-4">
                {episodes.map((ep) => (
                  <div key={ep.id} className="group flex gap-4 p-4 rounded-xl hover:bg-white/5 transition-colors border border-transparent hover:border-white/10">
                    <div className="relative w-40 shrink-0 aspect-video rounded-md overflow-hidden bg-zinc-900">
                      <img 
                        src={ep.customThumbnailUrl || (ep.thumbnailPath ? `https://image.tmdb.org/t/p/w500${ep.thumbnailPath}` : 'https://via.placeholder.com/320x180?text=No+Image')} 
                        alt={ep.title} 
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-colors flex items-center justify-center">
                        <Play className="h-8 w-8 text-white opacity-0 group-hover:opacity-100 transition-opacity fill-white" />
                      </div>
                    </div>
                    <div className="flex-1 py-1">
                      <div className="flex justify-between items-start">
                        <h3 className="font-bold text-white text-lg leading-tight">
                          <span className="text-zinc-500 mr-2">{ep.episodeNumber}.</span>
                          {ep.title}
                        </h3>
                        {ep.duration && <span className="text-sm text-zinc-500 flex items-center"><Clock className="h-3 w-3 mr-1" />{ep.duration}m</span>}
                      </div>
                      {ep.synopsis && <p className="text-sm text-zinc-400 mt-2 line-clamp-2">{ep.synopsis}</p>}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center rounded-xl bg-white/5 border border-white/10 text-zinc-400">
                Nenhum episódio cadastrado ainda.
              </div>
            )}
          </div>
          
          {/* Sidebar */}
          <div className="w-full md:w-80 space-y-6">
            <div className="p-6 rounded-xl bg-zinc-900/50 border border-white/10">
              <h3 className="font-heading text-lg font-bold text-white mb-4">Informações</h3>
              <dl className="space-y-3 text-sm">
                <div>
                  <dt className="text-zinc-500">Título Original</dt>
                  <dd className="text-zinc-200 font-medium">{work.originalTitle || work.title}</dd>
                </div>
                <div>
                  <dt className="text-zinc-500">Status</dt>
                  <dd className="text-zinc-200 font-medium capitalize">{work.status}</dd>
                </div>
                <div>
                  <dt className="text-zinc-500">Visualizações</dt>
                  <dd className="text-zinc-200 font-medium">{work.viewCount?.toLocaleString()}</dd>
                </div>
              </dl>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
