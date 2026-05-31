import React, { useState } from 'react';
import { Layout } from '@/components/layout';
import { ProtectedRoute } from '@/components/protected-route';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { 
  useGetSiteStats, 
  useListWorks, 
  useCreateWork, 
  useDeleteWork,
  useUpdateWork,
  useListEpisodes,
  useAddEpisode,
  useUpdateEpisode,
  useDeleteEpisode,
  getListWorksQueryKey,
  getGetSiteStatsQueryKey,
  getListEpisodesQueryKey
} from '@workspace/api-client-react';
import { useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Search, Trash2, Edit, Plus, Tv, Film, Eye, ListVideo, X, Save, Link } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import type { Episode } from '@workspace/api-client-react';

function DashboardTab() {
  const { data: stats, isLoading } = useGetSiteStats();

  if (isLoading) return <div className="py-10 flex justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  if (!stats) return null;

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card className="bg-zinc-900/50 border-white/10">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-zinc-400">Total de Obras</CardTitle>
          <Tv className="h-4 w-4 text-zinc-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-white">{stats.totalWorks}</div>
        </CardContent>
      </Card>
      <Card className="bg-zinc-900/50 border-white/10">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-zinc-400">Episódios</CardTitle>
          <ListVideo className="h-4 w-4 text-zinc-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-white">{stats.totalEpisodes}</div>
        </CardContent>
      </Card>
      <Card className="bg-zinc-900/50 border-white/10">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-zinc-400">Visualizações Totais</CardTitle>
          <Eye className="h-4 w-4 text-zinc-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-white">{stats.totalViews.toLocaleString()}</div>
        </CardContent>
      </Card>
      <Card className="bg-zinc-900/50 border-white/10">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-zinc-400">Em Lançamento</CardTitle>
          <Tv className="h-4 w-4 text-green-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-white">{stats.ongoingCount || 0}</div>
        </CardContent>
      </Card>
    </div>
  );
}

function AddWorkTab() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const createWork = useCreateWork();

  const [tmdbType, setTmdbType] = useState<'tv' | 'movie'>('tv');
  const [tmdbId, setTmdbId] = useState('');
  const [loadingTmdb, setLoadingTmdb] = useState(false);
  const [preview, setPreview] = useState<any>(null);

  const [formData, setFormData] = useState({
    customThumbnailUrl: '',
    customBannerUrl: '',
    status: 'completed',
    isFeatured: false,
    genres: ''
  });

  const searchTmdb = async () => {
    if (!tmdbId) return;
    setLoadingTmdb(true);
    setPreview(null);
    try {
      const apiKey = import.meta.env.VITE_TMDB_API_KEY;
      if (!apiKey) {
        toast({ title: 'Erro', description: 'VITE_TMDB_API_KEY não configurada.', variant: 'destructive' });
        return;
      }
      
      const res = await fetch(`https://api.themoviedb.org/3/${tmdbType}/${tmdbId}?api_key=${apiKey}&language=pt-BR`);
      if (!res.ok) throw new Error('Não encontrado no TMDB');
      const data = await res.json();
      
      setPreview({
        title: data.name || data.title,
        originalTitle: data.original_name || data.original_title,
        synopsis: data.overview,
        posterPath: data.poster_path,
        backdropPath: data.backdrop_path,
        releaseYear: data.first_air_date ? parseInt(data.first_air_date.substring(0,4)) : data.release_date ? parseInt(data.release_date.substring(0,4)) : null,
        rating: data.vote_average,
        genres: data.genres?.map((g: any) => g.name) || [],
      });
      
      setFormData(prev => ({ ...prev, genres: data.genres?.map((g: any) => g.name).join(', ') || '' }));
    } catch (err: any) {
      toast({ title: 'Erro', description: err.message, variant: 'destructive' });
    } finally {
      setLoadingTmdb(false);
    }
  };

  const handleCreate = async () => {
    if (!preview) return;
    
    try {
      await createWork.mutateAsync({
        data: {
          tmdbId: parseInt(tmdbId, 10),
          type: tmdbType,
          title: preview.title,
          originalTitle: preview.originalTitle,
          synopsis: preview.synopsis,
          posterPath: preview.posterPath,
          backdropPath: preview.backdropPath,
          releaseYear: preview.releaseYear,
          rating: preview.rating,
          genres: formData.genres.split(',').map(s => s.trim()).filter(Boolean),
          customThumbnailUrl: formData.customThumbnailUrl || null,
          customBannerUrl: formData.customBannerUrl || null,
          status: formData.status as any,
          isFeatured: formData.isFeatured
        }
      });
      
      toast({ title: 'Sucesso', description: 'Obra adicionada com sucesso.' });
      queryClient.invalidateQueries({ queryKey: getListWorksQueryKey() });
      queryClient.invalidateQueries({ queryKey: getGetSiteStatsQueryKey() });
      setPreview(null);
      setTmdbId('');
    } catch (err: any) {
      toast({ title: 'Erro', description: 'Falha ao adicionar obra.', variant: 'destructive' });
    }
  };

  return (
    <div className="grid md:grid-cols-2 gap-8">
      <div className="space-y-6">
        <Card className="bg-zinc-900/50 border-white/10">
          <CardHeader>
            <CardTitle className="text-white">Buscar no TMDB</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-zinc-400">Tipo</Label>
                <Select value={tmdbType} onValueChange={(v: 'tv' | 'movie') => setTmdbType(v)}>
                  <SelectTrigger className="bg-white/5 border-white/10">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="tv">Série (TV)</SelectItem>
                    <SelectItem value="movie">Filme</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-zinc-400">TMDB ID</Label>
                <div className="flex gap-2">
                  <Input 
                    value={tmdbId} 
                    onChange={e => setTmdbId(e.target.value)} 
                    placeholder="Ex: 37854" 
                    className="bg-white/5 border-white/10"
                  />
                  <Button onClick={searchTmdb} disabled={loadingTmdb} className="bg-white/10 hover:bg-white/20 text-white">
                    {loadingTmdb ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
            </div>
            
            <div className="pt-4 space-y-4 border-t border-white/10">
              <div className="space-y-2">
                <Label className="text-zinc-400">Status</Label>
                <Select value={formData.status} onValueChange={v => setFormData(prev => ({ ...prev, status: v }))}>
                  <SelectTrigger className="bg-white/5 border-white/10">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ongoing">Em Lançamento</SelectItem>
                    <SelectItem value="completed">Completo</SelectItem>
                    <SelectItem value="upcoming">Em Breve</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center justify-between rounded-lg border border-white/10 bg-white/5 p-4">
                <div className="space-y-0.5">
                  <Label className="text-base text-white">Destaque</Label>
                  <p className="text-sm text-zinc-500">Mostrar no banner da página inicial</p>
                </div>
                <Switch checked={formData.isFeatured} onCheckedChange={v => setFormData(prev => ({ ...prev, isFeatured: v }))} />
              </div>
              <div className="space-y-2">
                <Label className="text-zinc-400">Thumbnail Personalizada (URL)</Label>
                <Input value={formData.customThumbnailUrl} onChange={e => setFormData(prev => ({ ...prev, customThumbnailUrl: e.target.value }))} placeholder="Deixe em branco para usar TMDB" className="bg-white/5 border-white/10" />
              </div>
              <div className="space-y-2">
                <Label className="text-zinc-400">Banner Personalizado (URL)</Label>
                <Input value={formData.customBannerUrl} onChange={e => setFormData(prev => ({ ...prev, customBannerUrl: e.target.value }))} placeholder="Deixe em branco para usar TMDB" className="bg-white/5 border-white/10" />
              </div>
              <div className="space-y-2">
                <Label className="text-zinc-400">Gêneros (separados por vírgula)</Label>
                <Input value={formData.genres} onChange={e => setFormData(prev => ({ ...prev, genres: e.target.value }))} className="bg-white/5 border-white/10" />
              </div>
            </div>
            
            <Button onClick={handleCreate} disabled={!preview || createWork.isPending} className="w-full bg-primary hover:bg-primary/90 text-white font-bold mt-4">
              {createWork.isPending ? <Loader2 className="h-5 w-5 animate-spin mr-2" /> : <Plus className="h-5 w-5 mr-2" />}
              Adicionar ao Catálogo
            </Button>
          </CardContent>
        </Card>
      </div>

      <div>
        {preview ? (
          <Card className="bg-zinc-900/50 border-white/10 overflow-hidden sticky top-24">
            <div className="aspect-video w-full relative">
              <img 
                src={formData.customBannerUrl || (preview.backdropPath ? `https://image.tmdb.org/t/p/w780${preview.backdropPath}` : '')} 
                className="w-full h-full object-cover"
                alt="Banner"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-zinc-900 to-transparent" />
            </div>
            <CardContent className="relative -mt-16 flex gap-4">
              <img 
                src={formData.customThumbnailUrl || (preview.posterPath ? `https://image.tmdb.org/t/p/w342${preview.posterPath}` : '')} 
                className="w-24 h-36 rounded-md object-cover border-2 border-zinc-800 shadow-xl bg-zinc-800"
                alt="Poster"
              />
              <div className="pt-16 space-y-1">
                <h3 className="font-heading text-xl font-bold text-white leading-tight">{preview.title}</h3>
                <p className="text-sm text-zinc-400">{preview.originalTitle}</p>
                <div className="flex gap-2 text-xs text-zinc-500 mt-2">
                  <span>{preview.releaseYear}</span>
                  <span>•</span>
                  <span>{preview.rating?.toFixed(1)}/10</span>
                </div>
              </div>
            </CardContent>
            <div className="px-6 pb-6 text-sm text-zinc-300 line-clamp-6">
              {preview.synopsis}
            </div>
          </Card>
        ) : (
          <div className="h-full min-h-[400px] border-2 border-dashed border-white/10 rounded-xl flex items-center justify-center text-zinc-500 flex-col gap-2">
            <Tv className="h-8 w-8" />
            <p>Faça uma busca para visualizar a obra</p>
          </div>
        )}
      </div>
    </div>
  );
}

function EditEpisodeForm({ episode, workId, onClose }: { episode: Episode; workId: number; onClose: () => void }) {
  const updateEpisode = useUpdateEpisode();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    episodeNumber: String(episode.episodeNumber),
    title: episode.title,
    duration: episode.duration ? String(episode.duration) : '',
    customThumbnailUrl: episode.customThumbnailUrl || '',
    videoSlug: episode.videoSlug || '',
  });

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await updateEpisode.mutateAsync({
        workId,
        episodeId: episode.id,
        data: {
          episodeNumber: parseInt(formData.episodeNumber, 10),
          title: formData.title,
          duration: formData.duration ? parseInt(formData.duration, 10) : null,
          customThumbnailUrl: formData.customThumbnailUrl || null,
          videoSlug: formData.videoSlug || null,
        }
      });
      toast({ title: 'Sucesso', description: 'Episódio atualizado.' });
      queryClient.invalidateQueries({ queryKey: getListEpisodesQueryKey(workId) });
      onClose();
    } catch {
      toast({ title: 'Erro', description: 'Falha ao atualizar episódio.', variant: 'destructive' });
    }
  };

  return (
    <form onSubmit={handleSave} className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label className="text-zinc-400 text-xs">Nº do Episódio</Label>
          <Input required type="number" value={formData.episodeNumber} onChange={e => setFormData(p => ({...p, episodeNumber: e.target.value}))} className="bg-zinc-900 border-white/10 h-9" />
        </div>
        <div className="space-y-1.5">
          <Label className="text-zinc-400 text-xs">Duração (min)</Label>
          <Input type="number" value={formData.duration} onChange={e => setFormData(p => ({...p, duration: e.target.value}))} placeholder="Opcional" className="bg-zinc-900 border-white/10 h-9" />
        </div>
      </div>
      <div className="space-y-1.5">
        <Label className="text-zinc-400 text-xs">Título</Label>
        <Input required value={formData.title} onChange={e => setFormData(p => ({...p, title: e.target.value}))} className="bg-zinc-900 border-white/10 h-9" />
      </div>
      <div className="space-y-1.5">
        <Label className="text-zinc-400 text-xs">Thumbnail (URL)</Label>
        <Input value={formData.customThumbnailUrl} onChange={e => setFormData(p => ({...p, customThumbnailUrl: e.target.value}))} placeholder="Opcional" className="bg-zinc-900 border-white/10 h-9" />
      </div>
      <div className="space-y-1.5">
        <Label className="text-zinc-300 text-xs font-semibold flex items-center gap-1.5">
          <Link className="h-3.5 w-3.5 text-primary" />
          URL do Servidor (Serve)
        </Label>
        <Input
          value={formData.videoSlug}
          onChange={e => setFormData(p => ({...p, videoSlug: e.target.value}))}
          placeholder="https://...replit.dev/api/links/1/serve"
          className="bg-zinc-900 border-primary/30 focus-visible:ring-primary font-mono text-xs h-9"
        />
      </div>
      <div className="flex gap-2 pt-1">
        <Button type="button" variant="outline" onClick={onClose} className="flex-1 border-white/10 text-zinc-400 hover:text-white h-9">
          Cancelar
        </Button>
        <Button type="submit" disabled={updateEpisode.isPending} className="flex-1 bg-primary hover:bg-primary/90 text-white font-bold h-9">
          {updateEpisode.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Save className="h-4 w-4 mr-1" />}
          Salvar
        </Button>
      </div>
    </form>
  );
}

function EpisodesManager({ workId, workTitle }: { workId: number, workTitle: string }) {
  const { data: episodes, isLoading } = useListEpisodes(workId);
  const addEpisode = useAddEpisode();
  const deleteEpisode = useDeleteEpisode();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [editingEpisode, setEditingEpisode] = useState<Episode | null>(null);
  const [formData, setFormData] = useState({
    episodeNumber: '',
    title: '',
    duration: '',
    customThumbnailUrl: '',
    videoSlug: '',
  });

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await addEpisode.mutateAsync({
        id: workId,
        data: {
          episodeNumber: parseInt(formData.episodeNumber, 10),
          title: formData.title || `Episódio ${formData.episodeNumber}`,
          duration: formData.duration ? parseInt(formData.duration, 10) : null,
          customThumbnailUrl: formData.customThumbnailUrl || null,
          videoSlug: formData.videoSlug || null,
        }
      });
      toast({ title: 'Sucesso', description: 'Episódio adicionado.' });
      queryClient.invalidateQueries({ queryKey: getListEpisodesQueryKey(workId) });
      queryClient.invalidateQueries({ queryKey: getGetSiteStatsQueryKey() });
      setFormData({ episodeNumber: '', title: '', duration: '', customThumbnailUrl: '', videoSlug: '' });
    } catch (err: any) {
      toast({ title: 'Erro', description: 'Falha ao adicionar episódio', variant: 'destructive' });
    }
  };

  const handleDelete = async (ep: Episode) => {
    if (!confirm(`Remover "${ep.title}"?`)) return;
    try {
      await deleteEpisode.mutateAsync({ workId, episodeId: ep.id });
      toast({ title: 'Removido', description: `${ep.title} foi removido.` });
      queryClient.invalidateQueries({ queryKey: getListEpisodesQueryKey(workId) });
      queryClient.invalidateQueries({ queryKey: getGetSiteStatsQueryKey() });
    } catch {
      toast({ title: 'Erro', description: 'Falha ao remover episódio.', variant: 'destructive' });
    }
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="bg-white/5 border-white/10 text-zinc-300 hover:text-white">
          <ListVideo className="h-4 w-4 mr-2" />
          Gerenciar Episódios
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-zinc-950 border-white/10 max-w-3xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl text-white">Episódios — {workTitle}</DialogTitle>
        </DialogHeader>

        {editingEpisode ? (
          <div className="my-4 p-4 border border-primary/20 rounded-lg bg-primary/5">
            <h4 className="font-semibold text-white mb-4 flex items-center gap-2">
              <Edit className="h-4 w-4 text-primary" />
              Editando EP {editingEpisode.episodeNumber} — {editingEpisode.title}
            </h4>
            <EditEpisodeForm
              episode={editingEpisode}
              workId={workId}
              onClose={() => setEditingEpisode(null)}
            />
          </div>
        ) : (
          <div className="my-4 p-4 border border-white/10 rounded-lg bg-white/5">
            <h4 className="font-semibold text-white mb-4">Adicionar Novo Episódio</h4>
            <form onSubmit={handleAdd} className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-zinc-400">Número do Episódio *</Label>
                <Input required type="number" value={formData.episodeNumber} onChange={e => setFormData(p => ({...p, episodeNumber: e.target.value}))} className="bg-zinc-900 border-white/10" />
              </div>
              <div className="space-y-2">
                <Label className="text-zinc-400">Título</Label>
                <Input value={formData.title} onChange={e => setFormData(p => ({...p, title: e.target.value}))} placeholder="Opcional" className="bg-zinc-900 border-white/10" />
              </div>
              <div className="space-y-2">
                <Label className="text-zinc-400">Duração (minutos)</Label>
                <Input type="number" value={formData.duration} onChange={e => setFormData(p => ({...p, duration: e.target.value}))} placeholder="Opcional" className="bg-zinc-900 border-white/10" />
              </div>
              <div className="space-y-2">
                <Label className="text-zinc-400">Thumbnail (URL)</Label>
                <Input value={formData.customThumbnailUrl} onChange={e => setFormData(p => ({...p, customThumbnailUrl: e.target.value}))} placeholder="Opcional" className="bg-zinc-900 border-white/10" />
              </div>
              <div className="col-span-2 space-y-2">
                <Label className="text-zinc-300 font-semibold flex items-center gap-2">
                  <Link className="h-3.5 w-3.5 text-primary" />
                  URL do Servidor (Serve)
                </Label>
                <Input
                  value={formData.videoSlug}
                  onChange={e => setFormData(p => ({...p, videoSlug: e.target.value}))}
                  placeholder="https://...replit.dev/api/links/1/serve"
                  className="bg-zinc-900 border-primary/40 focus-visible:ring-primary font-mono text-sm"
                />
                {formData.videoSlug && (
                  <p className="text-xs text-zinc-500 font-mono truncate">
                    → {formData.videoSlug}
                  </p>
                )}
              </div>
              <Button type="submit" disabled={addEpisode.isPending} className="col-span-2 bg-primary hover:bg-primary/90 text-white font-bold uppercase tracking-wider">
                {addEpisode.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Plus className="h-4 w-4 mr-2" />}
                Adicionar Episódio
              </Button>
            </form>
          </div>
        )}

        <div className="space-y-2 mt-4">
          <h4 className="font-semibold text-white mb-2">
            Episódios Cadastrados
            <span className="ml-2 text-xs font-normal text-zinc-500">{episodes?.length || 0} episódios</span>
          </h4>
          {isLoading ? (
            <Loader2 className="h-6 w-6 animate-spin text-primary mx-auto" />
          ) : episodes?.length === 0 ? (
            <p className="text-zinc-500 text-sm">Nenhum episódio cadastrado.</p>
          ) : (
            episodes?.map(ep => (
              <div key={ep.id} className={`flex items-center justify-between p-3 rounded-lg border transition-colors ${editingEpisode?.id === ep.id ? 'bg-primary/10 border-primary/30' : 'bg-zinc-900/50 border-white/5 hover:border-white/10'}`}>
                <div className="flex items-center gap-4 min-w-0">
                  <div className="w-9 h-9 shrink-0 rounded bg-zinc-800 flex items-center justify-center font-bold text-zinc-400 text-sm">
                    {ep.episodeNumber}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-white truncate">{ep.title}</p>
                    <div className="flex items-center gap-3 mt-0.5">
                      {ep.duration && <span className="text-xs text-zinc-500">{ep.duration} min</span>}
                      {ep.videoSlug ? (
                        <span className="text-xs text-green-400 font-mono truncate max-w-[200px]" title={ep.videoSlug}>
                          ✓ Link configurado
                        </span>
                      ) : (
                        <span className="text-xs text-zinc-600">Sem vídeo</span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0 ml-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-zinc-400 hover:text-primary hover:bg-primary/10"
                    onClick={() => setEditingEpisode(ep)}
                    title="Editar episódio"
                  >
                    <Edit className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-zinc-400 hover:text-destructive hover:bg-destructive/10"
                    onClick={() => handleDelete(ep)}
                    disabled={deleteEpisode.isPending}
                    title="Remover episódio"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function CatalogTab() {
  const { data, isLoading } = useListWorks({ limit: 100 });
  const deleteWork = useDeleteWork();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const handleDelete = async (id: number) => {
    if (!confirm('Tem certeza que deseja remover esta obra?')) return;
    try {
      await deleteWork.mutateAsync({ id });
      queryClient.invalidateQueries({ queryKey: getListWorksQueryKey() });
      toast({ title: 'Sucesso', description: 'Obra removida do catálogo.' });
    } catch (err) {
      toast({ title: 'Erro', description: 'Não foi possível remover.', variant: 'destructive' });
    }
  };

  if (isLoading) return <div className="py-10 flex justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  return (
    <div className="rounded-xl border border-white/10 bg-zinc-900/50 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left text-zinc-300">
          <thead className="text-xs uppercase bg-white/5 text-zinc-400 border-b border-white/10">
            <tr>
              <th className="px-6 py-4">Obra</th>
              <th className="px-6 py-4">Tipo</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4 text-right">Ações</th>
            </tr>
          </thead>
          <tbody>
            {data?.works.map((work) => (
              <tr key={work.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                <td className="px-6 py-4 font-medium text-white flex items-center gap-3">
                  <img 
                    src={work.customThumbnailUrl || (work.posterPath ? `https://image.tmdb.org/t/p/w92${work.posterPath}` : '')} 
                    className="w-10 h-14 object-cover rounded bg-zinc-800" 
                    alt="" 
                  />
                  <div>
                    <p className="line-clamp-1">{work.title}</p>
                    <p className="text-xs text-zinc-500 font-normal">{work.releaseYear}</p>
                  </div>
                </td>
                <td className="px-6 py-4 uppercase text-xs">{work.type}</td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 rounded text-xs ${work.status === 'ongoing' ? 'bg-green-500/20 text-green-400' : 'bg-zinc-800 text-zinc-400'}`}>
                    {work.status}
                  </span>
                </td>
                <td className="px-6 py-4 text-right space-x-2">
                  <EpisodesManager workId={work.id} workTitle={work.title} />
                  <Button variant="ghost" size="icon" className="text-zinc-400 hover:text-destructive hover:bg-destructive/10" onClick={() => handleDelete(work.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default function AdminPanel() {
  return (
    <Layout>
      <ProtectedRoute requireAdmin>
        <div className="container mx-auto px-4 py-8 md:py-12 mt-16">
          <div className="mb-8">
            <h1 className="font-heading text-3xl font-bold text-white">Painel Administrativo</h1>
            <p className="text-zinc-400 mt-2">Gerencie o catálogo, episódios e configurações da plataforma.</p>
          </div>

          <Tabs defaultValue="dashboard" className="w-full">
            <TabsList className="bg-zinc-900/80 border border-white/10 p-1 mb-8 w-full max-w-md grid grid-cols-3">
              <TabsTrigger value="dashboard" className="data-[state=active]:bg-white/10 data-[state=active]:text-white">Resumo</TabsTrigger>
              <TabsTrigger value="catalog" className="data-[state=active]:bg-white/10 data-[state=active]:text-white">Catálogo</TabsTrigger>
              <TabsTrigger value="add" className="data-[state=active]:bg-primary data-[state=active]:text-white">Adicionar</TabsTrigger>
            </TabsList>
            
            <TabsContent value="dashboard" className="outline-none">
              <DashboardTab />
            </TabsContent>
            
            <TabsContent value="catalog" className="outline-none">
              <CatalogTab />
            </TabsContent>
            
            <TabsContent value="add" className="outline-none">
              <AddWorkTab />
            </TabsContent>
          </Tabs>
        </div>
      </ProtectedRoute>
    </Layout>
  );
}
