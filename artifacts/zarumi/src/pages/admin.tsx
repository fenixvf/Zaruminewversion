import React, { useState, useEffect } from 'react';
import { Layout } from '@/components/layout';
import { ProtectedRoute } from '@/components/protected-route';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
  useGetTop10,
  getListWorksQueryKey,
  getGetSiteStatsQueryKey,
  getListEpisodesQueryKey,
  getGetTop10QueryKey,
} from '@workspace/api-client-react';
import { useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import {
  Loader2, Search, Trash2, Edit, Plus, Tv, Film, Eye, ListVideo,
  Save, Link, Images, ChevronLeft, LayoutDashboard, Library,
  PlusCircle, Trophy, TrendingUp, Star, BarChart3, Menu, X, Download
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import type { Episode, Work } from '@workspace/api-client-react';

const TMDB_IMG = 'https://image.tmdb.org/t/p';

function tmdbPoster(path: string | null | undefined, size = 'w342') {
  return path ? `${TMDB_IMG}/${size}${path}` : '';
}
function tmdbBackdrop(path: string | null | undefined, size = 'w780') {
  return path ? `${TMDB_IMG}/${size}${path}` : '';
}
function tmdbStill(path: string | null | undefined, size = 'w300') {
  return path ? `${TMDB_IMG}/${size}${path}` : '';
}

async function fetchTmdb(path: string) {
  const apiKey = import.meta.env.VITE_TMDB_API_KEY;
  if (!apiKey) throw new Error('VITE_TMDB_API_KEY não configurada.');
  const res = await fetch(`https://api.themoviedb.org/3${path}?api_key=${apiKey}&language=pt-BR`);
  if (!res.ok) throw new Error(`TMDB erro ${res.status}`);
  return res.json();
}

type AdminTab = 'dashboard' | 'catalog' | 'add' | 'top10';

const NAV_ITEMS: { id: AdminTab; label: string; icon: React.ReactNode; accent?: boolean }[] = [
  { id: 'dashboard', label: 'Resumo', icon: <LayoutDashboard className="h-4 w-4" /> },
  { id: 'catalog', label: 'Catálogo', icon: <Library className="h-4 w-4" /> },
  { id: 'add', label: 'Adicionar Obra', icon: <PlusCircle className="h-4 w-4" />, accent: true },
  { id: 'top10', label: 'Top 10', icon: <Trophy className="h-4 w-4" /> },
];

function DashboardTab() {
  const { data: stats, isLoading } = useGetSiteStats();
  if (isLoading) return <div className="py-10 flex justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  if (!stats) return null;
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-white mb-1">Visão Geral</h2>
        <p className="text-zinc-500 text-sm">Estatísticas gerais da plataforma.</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: 'Total de Obras', value: stats.totalWorks, icon: <Tv className="h-5 w-5" />, color: 'text-blue-400', bg: 'bg-blue-500/10' },
          { label: 'Episódios', value: stats.totalEpisodes, icon: <ListVideo className="h-5 w-5" />, color: 'text-purple-400', bg: 'bg-purple-500/10' },
          { label: 'Visualizações', value: stats.totalViews.toLocaleString(), icon: <Eye className="h-5 w-5" />, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
          { label: 'Em Lançamento', value: stats.ongoingCount || 0, icon: <TrendingUp className="h-5 w-5" />, color: 'text-amber-400', bg: 'bg-amber-500/10' },
        ].map(({ label, value, icon, color, bg }) => (
          <Card key={label} className="bg-zinc-900/60 border-white/8 hover:border-white/15 transition-colors">
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500">{label}</span>
                <div className={`${bg} ${color} p-2 rounded-lg`}>{icon}</div>
              </div>
              <div className="text-3xl font-black text-white">{value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <Card className="bg-zinc-900/60 border-white/8">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-zinc-400 flex items-center gap-2">
              <BarChart3 className="h-4 w-4" /> Distribuição por Status
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {[
              { label: 'Completos', value: stats.completedCount ?? 0, color: 'bg-zinc-500' },
              { label: 'Em Lançamento', value: stats.ongoingCount ?? 0, color: 'bg-emerald-500' },
              { label: 'Em Breve', value: (stats.totalWorks - (stats.completedCount ?? 0) - (stats.ongoingCount ?? 0)), color: 'bg-amber-500' },
            ].map(({ label, value, color }) => (
              <div key={label} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className={`h-2 w-2 rounded-full ${color}`} />
                  <span className="text-sm text-zinc-400">{label}</span>
                </div>
                <span className="text-sm font-bold text-white">{value}</span>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="bg-zinc-900/60 border-white/8">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-zinc-400 flex items-center gap-2">
              <Star className="h-4 w-4" /> Métricas Rápidas
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-zinc-400">Episódios por Obra (média)</span>
              <span className="text-sm font-bold text-white">
                {stats.totalWorks > 0 ? (stats.totalEpisodes / stats.totalWorks).toFixed(1) : '0'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-zinc-400">Views por Obra (média)</span>
              <span className="text-sm font-bold text-white">
                {stats.totalWorks > 0 ? Math.round(stats.totalViews / stats.totalWorks).toLocaleString() : '0'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-zinc-400">Taxa de Lançamento</span>
              <span className="text-sm font-bold text-emerald-400">
                {stats.totalWorks > 0 ? Math.round(((stats.ongoingCount ?? 0) / stats.totalWorks) * 100) : 0}%
              </span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function EditWorkDialog({ work, onUpdated }: { work: Work; onUpdated: () => void }) {
  const [open, setOpen] = useState(false);
  const updateWork = useUpdateWork();
  const { toast } = useToast();

  const [form, setForm] = useState({
    title: work.title,
    synopsis: work.synopsis || '',
    status: work.status,
    isFeatured: work.isFeatured ?? false,
    genres: (work.genres ?? []).join(', '),
    customThumbnailUrl: work.customThumbnailUrl || '',
    customBannerUrl: work.customBannerUrl || '',
    posterPath: work.posterPath || '',
    backdropPath: work.backdropPath || '',
    rating: work.rating != null ? String(work.rating) : '',
  });

  useEffect(() => {
    if (open) {
      setForm({
        title: work.title,
        synopsis: work.synopsis || '',
        status: work.status,
        isFeatured: work.isFeatured ?? false,
        genres: (work.genres ?? []).join(', '),
        customThumbnailUrl: work.customThumbnailUrl || '',
        customBannerUrl: work.customBannerUrl || '',
        posterPath: work.posterPath || '',
        backdropPath: work.backdropPath || '',
        rating: work.rating != null ? String(work.rating) : '',
      });
    }
  }, [open, work]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await updateWork.mutateAsync({
        id: work.id,
        data: {
          title: form.title,
          synopsis: form.synopsis || null,
          status: form.status as any,
          isFeatured: form.isFeatured,
          genres: form.genres.split(',').map(s => s.trim()).filter(Boolean),
          customThumbnailUrl: form.customThumbnailUrl || null,
          customBannerUrl: form.customBannerUrl || null,
          posterPath: form.posterPath || null,
          backdropPath: form.backdropPath || null,
          rating: form.rating ? parseFloat(form.rating) : null,
        },
      });
      toast({ title: 'Sucesso', description: 'Obra atualizada.' });
      onUpdated();
      setOpen(false);
    } catch {
      toast({ title: 'Erro', description: 'Falha ao atualizar obra.', variant: 'destructive' });
    }
  };

  const thumbnailSrc = form.customThumbnailUrl || tmdbPoster(form.posterPath);
  const bannerSrc = form.customBannerUrl || tmdbBackdrop(form.backdropPath);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="text-zinc-400 hover:text-primary hover:bg-primary/10" title="Editar obra">
          <Edit className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-zinc-950 border-white/10 max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl text-white flex items-center gap-2">
            <Edit className="h-5 w-5 text-primary" /> Editar — {work.title}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSave} className="space-y-5 mt-4">
          <div className="grid md:grid-cols-2 gap-5">
            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label className="text-zinc-400">Título *</Label>
                <Input required value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} className="bg-zinc-900 border-white/10" />
              </div>

              <div className="space-y-1.5">
                <Label className="text-zinc-400">Sinopse</Label>
                <textarea
                  value={form.synopsis}
                  onChange={e => setForm(p => ({ ...p, synopsis: e.target.value }))}
                  rows={4}
                  className="w-full rounded-md border border-white/10 bg-zinc-900 px-3 py-2 text-sm text-white resize-none focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-zinc-400">Status</Label>
                  <Select value={form.status} onValueChange={v => setForm(p => ({ ...p, status: v as any }))}>
                    <SelectTrigger className="bg-zinc-900 border-white/10">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ongoing">Em Lançamento</SelectItem>
                      <SelectItem value="completed">Completo</SelectItem>
                      <SelectItem value="upcoming">Em Breve</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-zinc-400">Nota (0–10)</Label>
                  <Input type="number" step="0.1" min="0" max="10" value={form.rating} onChange={e => setForm(p => ({ ...p, rating: e.target.value }))} className="bg-zinc-900 border-white/10" />
                </div>
              </div>

              <div className="flex items-center justify-between rounded-lg border border-white/10 bg-white/5 p-3">
                <Label className="text-white cursor-pointer">Destaque na home</Label>
                <Switch checked={form.isFeatured} onCheckedChange={v => setForm(p => ({ ...p, isFeatured: v }))} />
              </div>

              <div className="space-y-1.5">
                <Label className="text-zinc-400">Gêneros (separados por vírgula)</Label>
                <Input value={form.genres} onChange={e => setForm(p => ({ ...p, genres: e.target.value }))} className="bg-zinc-900 border-white/10" />
              </div>
            </div>

            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label className="text-zinc-400">Thumbnail Personalizada (URL)</Label>
                <Input value={form.customThumbnailUrl} onChange={e => setForm(p => ({ ...p, customThumbnailUrl: e.target.value }))} placeholder="Deixe em branco para usar TMDB" className="bg-zinc-900 border-white/10" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-zinc-400">Banner Personalizado (URL)</Label>
                <Input value={form.customBannerUrl} onChange={e => setForm(p => ({ ...p, customBannerUrl: e.target.value }))} placeholder="Deixe em branco para usar TMDB" className="bg-zinc-900 border-white/10" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-zinc-400">Poster Path (TMDB, ex: /abc.jpg)</Label>
                <Input value={form.posterPath} onChange={e => setForm(p => ({ ...p, posterPath: e.target.value }))} className="bg-zinc-900 border-white/10 font-mono text-xs" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-zinc-400">Backdrop Path (TMDB, ex: /xyz.jpg)</Label>
                <Input value={form.backdropPath} onChange={e => setForm(p => ({ ...p, backdropPath: e.target.value }))} className="bg-zinc-900 border-white/10 font-mono text-xs" />
              </div>

              <div className="grid grid-cols-2 gap-3 pt-1">
                {thumbnailSrc && (
                  <div>
                    <p className="text-xs text-zinc-500 mb-1">Thumbnail</p>
                    <img src={thumbnailSrc} alt="" className="w-full rounded-md object-cover h-32 bg-zinc-800" />
                  </div>
                )}
                {bannerSrc && (
                  <div>
                    <p className="text-xs text-zinc-500 mb-1">Banner</p>
                    <img src={bannerSrc} alt="" className="w-full rounded-md object-cover h-32 bg-zinc-800" />
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)} className="flex-1 border-white/10 text-zinc-400 hover:text-white">
              Cancelar
            </Button>
            <Button type="submit" disabled={updateWork.isPending} className="flex-1 bg-primary hover:bg-primary/90 text-white font-bold">
              {updateWork.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
              Salvar Alterações
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function TmdbEpisodePicker({ tmdbId, episodes, onApply }: {
  tmdbId: number;
  episodes: Episode[];
  onApply: (episodeNumber: number, seasonNumber: number, thumbnailUrl: string, title: string, synopsis: string) => void;
}) {
  const [seasons, setSeasons] = useState<any[]>([]);
  const [selectedSeason, setSelectedSeason] = useState<number | null>(null);
  const [seasonEpisodes, setSeasonEpisodes] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingEps, setLoadingEps] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    setLoading(true);
    fetchTmdb(`/tv/${tmdbId}`)
      .then(data => {
        const list = (data.seasons || []).filter((s: any) => s.season_number > 0);
        setSeasons(list);
        if (list.length > 0) setSelectedSeason(list[0].season_number);
      })
      .catch(err => toast({ title: 'TMDB', description: err.message, variant: 'destructive' }))
      .finally(() => setLoading(false));
  }, [tmdbId]);

  useEffect(() => {
    if (selectedSeason == null) return;
    setLoadingEps(true);
    setSeasonEpisodes([]);
    fetchTmdb(`/tv/${tmdbId}/season/${selectedSeason}`)
      .then(data => setSeasonEpisodes(data.episodes || []))
      .catch(err => toast({ title: 'TMDB', description: err.message, variant: 'destructive' }))
      .finally(() => setLoadingEps(false));
  }, [selectedSeason, tmdbId]);

  const episodesInSeason = React.useMemo(() => {
    if (selectedSeason == null) return new Set<number>();
    return new Set(
      episodes
        .filter(e => e.seasonNumber === selectedSeason || e.seasonNumber == null)
        .map(e => e.episodeNumber)
    );
  }, [episodes, selectedSeason]);

  const thumbnailedInSeason = React.useMemo(() => {
    if (selectedSeason == null) return new Set<number>();
    return new Set(
      episodes
        .filter(e =>
          (e.seasonNumber === selectedSeason || e.seasonNumber == null)
          && e.customThumbnailUrl
        )
        .map(e => e.episodeNumber)
    );
  }, [episodes, selectedSeason]);

  if (loading) return (
    <div className="flex items-center justify-center py-12">
      <Loader2 className="h-6 w-6 animate-spin text-primary mr-2" />
      <span className="text-zinc-400 text-sm">Carregando temporadas...</span>
    </div>
  );

  return (
    <div className="space-y-4">
      {seasons.length > 0 && (
        <div className="flex gap-2 flex-wrap">
          {seasons.map((s: any) => (
            <button
              key={s.season_number}
              onClick={() => setSelectedSeason(s.season_number)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${selectedSeason === s.season_number ? 'bg-primary text-white' : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-white'}`}
            >
              T{s.season_number} — {s.name}
            </button>
          ))}
        </div>
      )}

      {loadingEps ? (
        <div className="flex items-center justify-center py-10">
          <Loader2 className="h-5 w-5 animate-spin text-primary mr-2" />
          <span className="text-zinc-400 text-sm">Carregando episódios...</span>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-h-[50vh] overflow-y-auto pr-1">
          {seasonEpisodes.map((ep: any) => {
            const stillUrl = ep.still_path ? tmdbStill(ep.still_path, 'w300') : null;
            const episodeLinked = episodesInSeason.has(ep.episode_number);
            const thumbnailApplied = thumbnailedInSeason.has(ep.episode_number);
            return (
              <div key={ep.id} className={`rounded-lg overflow-hidden border transition-colors ${thumbnailApplied ? 'border-emerald-500/50 bg-emerald-500/5' : episodeLinked ? 'border-primary/40 bg-primary/5' : 'border-white/10 bg-zinc-900/60'}`}>
                {stillUrl ? (
                  <div className="relative">
                    <img src={stillUrl} alt={ep.name} className="w-full aspect-video object-cover" />
                    {thumbnailApplied && (
                      <div className="absolute inset-0 bg-emerald-500/20 flex items-center justify-center">
                        <div className="bg-emerald-500 rounded-full p-1">
                          <svg className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="w-full aspect-video bg-zinc-800 flex items-center justify-center">
                    <Film className="h-6 w-6 text-zinc-600" />
                  </div>
                )}
                <div className="p-2 space-y-1">
                  <div className="flex items-start justify-between gap-1">
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-zinc-300">EP {ep.episode_number}</p>
                      <p className="text-xs text-zinc-400 truncate leading-tight">{ep.name}</p>
                    </div>
                    {thumbnailApplied && (
                      <span className="text-[10px] text-emerald-400 font-bold bg-emerald-500/10 px-1.5 py-0.5 rounded shrink-0">✓ Aplicado</span>
                    )}
                    {episodeLinked && !thumbnailApplied && (
                      <span className="text-[10px] text-primary font-bold bg-primary/10 px-1.5 py-0.5 rounded shrink-0">Cadastrado</span>
                    )}
                  </div>
                  {stillUrl && (
                    <Button
                      size="sm"
                      className={`w-full h-7 text-xs text-white ${thumbnailApplied ? 'bg-emerald-600/80 hover:bg-emerald-600' : 'bg-primary/90 hover:bg-primary'}`}
                      onClick={() => onApply(
                        ep.episode_number,
                        selectedSeason!,
                        stillUrl,
                        ep.name,
                        ep.overview || ''
                      )}
                    >
                      {thumbnailApplied ? 'Atualizar thumbnail' : 'Aplicar thumbnail'}
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function EpisodesManager({ work }: { work: Work }) {
  const { data: episodes, isLoading } = useListEpisodes(work.id);
  const addEpisode = useAddEpisode();
  const updateEpisode = useUpdateEpisode();
  const deleteEpisode = useDeleteEpisode();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [panel, setPanel] = useState<'list' | 'add' | 'edit' | 'tmdb' | 'vlm'>('list');
  const [editingEpisode, setEditingEpisode] = useState<Episode | null>(null);

  const [tmdbLookupId, setTmdbLookupId] = useState<number>(work.tmdbId);
  const [tmdbLookupInput, setTmdbLookupInput] = useState(String(work.tmdbId));
  const [dbSeasonTarget, setDbSeasonTarget] = useState('');

  const [vlmUrl, setVlmUrl] = useState('');
  const [vlmImporting, setVlmImporting] = useState(false);

  const handleVlmImport = async () => {
    if (!vlmUrl.trim()) {
      toast({ title: 'URL obrigatória', description: 'Cole a URL do endpoint VLM antes de importar.', variant: 'destructive' });
      return;
    }
    setVlmImporting(true);
    try {
      const res = await fetch(vlmUrl.trim());
      if (!res.ok) throw new Error(`Erro HTTP ${res.status}`);
      const items: { episodeNumber: number; title: string; videoSlug?: string; duration?: number; customThumbnailUrl?: string }[] = await res.json();
      if (!Array.isArray(items)) throw new Error('Resposta não é um array JSON.');
      let imported = 0;
      for (const item of items) {
        await addEpisode.mutateAsync({
          id: work.id,
          data: {
            episodeNumber: item.episodeNumber,
            seasonNumber: null,
            title: item.title || `Episódio ${item.episodeNumber}`,
            duration: item.duration ?? null,
            customThumbnailUrl: item.customThumbnailUrl ?? null,
            videoSlug: item.videoSlug ?? null,
          },
        });
        imported++;
      }
      queryClient.invalidateQueries({ queryKey: getListEpisodesQueryKey(work.id) });
      queryClient.invalidateQueries({ queryKey: getGetSiteStatsQueryKey() });
      toast({ title: 'Importação concluída', description: `${imported} episódio(s) importado(s) com sucesso.` });
      setVlmUrl('');
      setPanel('list');
    } catch (err: any) {
      toast({ title: 'Erro na importação', description: err?.message ?? 'Falha ao importar do VLM.', variant: 'destructive' });
    } finally {
      setVlmImporting(false);
    }
  };

  const [addForm, setAddForm] = useState({
    episodeNumber: '', seasonNumber: '', title: '', duration: '', customThumbnailUrl: '', videoSlug: '',
  });

  const [editForm, setEditForm] = useState({
    episodeNumber: '', title: '', duration: '', customThumbnailUrl: '', videoSlug: '',
  });
  const [tmdbFetching, setTmdbFetching] = useState(false);

  const openEdit = (ep: Episode) => {
    setEditingEpisode(ep);
    setEditForm({
      episodeNumber: String(ep.episodeNumber),
      title: ep.title,
      duration: ep.duration ? String(ep.duration) : '',
      customThumbnailUrl: ep.customThumbnailUrl || '',
      videoSlug: ep.videoSlug || '',
    });
    setPanel('edit');
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await addEpisode.mutateAsync({
        id: work.id,
        data: {
          episodeNumber: parseInt(addForm.episodeNumber, 10),
          seasonNumber: addForm.seasonNumber ? parseInt(addForm.seasonNumber, 10) : null,
          title: addForm.title || `Episódio ${addForm.episodeNumber}`,
          duration: addForm.duration ? parseInt(addForm.duration, 10) : null,
          customThumbnailUrl: addForm.customThumbnailUrl || null,
          videoSlug: addForm.videoSlug || null,
        }
      });
      toast({ title: 'Sucesso', description: 'Episódio adicionado.' });
      queryClient.invalidateQueries({ queryKey: getListEpisodesQueryKey(work.id) });
      queryClient.invalidateQueries({ queryKey: getGetSiteStatsQueryKey() });
      setAddForm({ episodeNumber: '', seasonNumber: '', title: '', duration: '', customThumbnailUrl: '', videoSlug: '' });
      setPanel('list');
    } catch {
      toast({ title: 'Erro', description: 'Falha ao adicionar episódio.', variant: 'destructive' });
    }
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingEpisode) return;
    try {
      await updateEpisode.mutateAsync({
        workId: work.id,
        episodeId: editingEpisode.id,
        data: {
          episodeNumber: parseInt(editForm.episodeNumber, 10),
          title: editForm.title,
          duration: editForm.duration ? parseInt(editForm.duration, 10) : null,
          customThumbnailUrl: editForm.customThumbnailUrl || null,
          videoSlug: editForm.videoSlug || null,
        }
      });
      toast({ title: 'Sucesso', description: 'Episódio atualizado.' });
      queryClient.invalidateQueries({ queryKey: getListEpisodesQueryKey(work.id) });
      setPanel('list');
    } catch {
      toast({ title: 'Erro', description: 'Falha ao atualizar episódio.', variant: 'destructive' });
    }
  };

  const handleDelete = async (ep: Episode) => {
    if (!confirm(`Remover "${ep.title}"?`)) return;
    try {
      await deleteEpisode.mutateAsync({ workId: work.id, episodeId: ep.id });
      toast({ title: 'Removido', description: `${ep.title} foi removido.` });
      queryClient.invalidateQueries({ queryKey: getListEpisodesQueryKey(work.id) });
      queryClient.invalidateQueries({ queryKey: getGetSiteStatsQueryKey() });
    } catch {
      toast({ title: 'Erro', description: 'Falha ao remover episódio.', variant: 'destructive' });
    }
  };

  const handleFetchTmdbForEdit = async () => {
    if (!editingEpisode) return;
    const seasonNum = editingEpisode.seasonNumber ?? 1;
    const epNum = parseInt(editForm.episodeNumber, 10);
    if (!epNum) {
      toast({ title: 'Erro', description: 'Número do episódio inválido.', variant: 'destructive' });
      return;
    }
    setTmdbFetching(true);
    try {
      const data = await fetchTmdb(`/tv/${tmdbLookupId}/season/${seasonNum}/episode/${epNum}`);
      const stillUrl = data.still_path ? tmdbStill(data.still_path, 'w300') : '';
      setEditForm(p => ({
        ...p,
        title: data.name || p.title,
        customThumbnailUrl: stillUrl || p.customThumbnailUrl,
      }));
      toast({ title: 'TMDB', description: 'Título e thumbnail preenchidos. URL do servidor preservada.' });
    } catch (err: any) {
      toast({ title: 'TMDB', description: err.message, variant: 'destructive' });
    } finally {
      setTmdbFetching(false);
    }
  };

  const handleTmdbApply = async (
    episodeNumber: number,
    tmdbSeasonNumber: number,
    thumbnailUrl: string,
    title: string,
    synopsis: string
  ) => {
    const effectiveSeason = dbSeasonTarget ? parseInt(dbSeasonTarget, 10) : tmdbSeasonNumber;

    // Three-tier search by number/season
    const bySearch =
      episodes?.find(e => e.episodeNumber === episodeNumber && e.seasonNumber === effectiveSeason) ??
      episodes?.find(e => e.episodeNumber === episodeNumber && e.seasonNumber == null) ??
      episodes?.find(e => e.episodeNumber === episodeNumber);

    // If the user came from the edit panel, always prefer that episode
    // (handles TMDB/DB numbering mismatches and stale query state)
    const target = bySearch ?? editingEpisode ?? null;

    if (target) {
      try {
        await updateEpisode.mutateAsync({
          workId: work.id,
          episodeId: target.id,
          data: { customThumbnailUrl: thumbnailUrl },
        });
        toast({ title: 'Thumbnail aplicada', description: `EP ${target.episodeNumber} — ${target.title}` });
        queryClient.invalidateQueries({ queryKey: getListEpisodesQueryKey(work.id) });
      } catch {
        toast({ title: 'Erro', description: 'Falha ao aplicar thumbnail.', variant: 'destructive' });
      }
    } else {
      try {
        await addEpisode.mutateAsync({
          id: work.id,
          data: {
            episodeNumber,
            seasonNumber: effectiveSeason,
            title,
            synopsis: synopsis || null,
            customThumbnailUrl: thumbnailUrl,
            videoSlug: null,
          },
        });
        toast({
          title: 'Episódio criado',
          description: `EP ${episodeNumber} adicionado com thumbnail. Adicione o URL do vídeo pelo botão de edição.`,
        });
        queryClient.invalidateQueries({ queryKey: getListEpisodesQueryKey(work.id) });
        queryClient.invalidateQueries({ queryKey: getGetSiteStatsQueryKey() });
      } catch {
        toast({ title: 'Erro', description: 'Falha ao criar episódio.', variant: 'destructive' });
      }
    }
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="bg-white/5 border-white/10 text-zinc-300 hover:text-white">
          <ListVideo className="h-4 w-4 mr-2" />
          Episódios
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-zinc-950 border-white/10 max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl text-white">
            {work.title}
            <span className="text-sm font-normal text-zinc-500 ml-2">{episodes?.length ?? 0} episódios</span>
          </DialogTitle>
        </DialogHeader>

        <div className="flex gap-2 mt-3 border-b border-white/10 pb-3">
          <Button size="sm" variant={panel === 'list' ? 'default' : 'outline'} onClick={() => setPanel('list')}
            className={panel === 'list' ? 'bg-white/10 text-white' : 'border-white/10 text-zinc-400 hover:text-white'}>
            Lista
          </Button>
          <Button size="sm" variant={panel === 'add' ? 'default' : 'outline'} onClick={() => setPanel('add')}
            className={panel === 'add' ? 'bg-primary text-white' : 'border-white/10 text-zinc-400 hover:text-white'}>
            <Plus className="h-3.5 w-3.5 mr-1" /> Adicionar
          </Button>
          {work.type === 'tv' && (
            <Button size="sm" variant={panel === 'tmdb' ? 'default' : 'outline'} onClick={() => setPanel('tmdb')}
              className={panel === 'tmdb' ? 'bg-blue-600 text-white' : 'border-white/10 text-zinc-400 hover:text-white'}>
              <Images className="h-3.5 w-3.5 mr-1" /> Thumbnails TMDB
            </Button>
          )}
          <Button size="sm" variant={panel === 'vlm' ? 'default' : 'outline'} onClick={() => setPanel('vlm')}
            className={panel === 'vlm' ? 'bg-emerald-600 text-white' : 'border-white/10 text-zinc-400 hover:text-white'}>
            <Download className="h-3.5 w-3.5 mr-1" /> Importar VLM
          </Button>
        </div>

        {panel === 'list' && (
          <div className="space-y-2 mt-3">
            {isLoading ? (
              <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
            ) : episodes?.length === 0 ? (
              <div className="text-center py-10 text-zinc-500">
                <ListVideo className="h-8 w-8 mx-auto mb-2 opacity-40" />
                <p className="text-sm">Nenhum episódio cadastrado.</p>
                <Button size="sm" className="mt-3 bg-primary/80 hover:bg-primary text-white" onClick={() => setPanel('add')}>
                  <Plus className="h-3.5 w-3.5 mr-1" /> Adicionar primeiro episódio
                </Button>
              </div>
            ) : (
              episodes?.map(ep => (
                <div key={ep.id} className="flex items-center gap-3 p-3 rounded-lg border border-white/5 bg-zinc-900/50 hover:border-white/10 transition-colors">
                  {ep.customThumbnailUrl ? (
                    <img src={ep.customThumbnailUrl} alt="" className="w-20 h-[45px] rounded object-cover bg-zinc-800 shrink-0" />
                  ) : (
                    <div className="w-20 h-[45px] rounded bg-zinc-800 flex items-center justify-center shrink-0">
                      <Film className="h-4 w-4 text-zinc-600" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate">
                      {ep.seasonNumber ? `T${ep.seasonNumber} · ` : ''}EP {ep.episodeNumber} — {ep.title}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5">
                      {ep.duration && <span className="text-xs text-zinc-500">{ep.duration}min</span>}
                      {ep.videoSlug ? (
                        <span className="text-xs text-green-400">✓ Vídeo</span>
                      ) : (
                        <span className="text-xs text-red-400/70">Sem vídeo</span>
                      )}
                      {ep.customThumbnailUrl && (
                        <span className="text-xs text-blue-400">✓ Thumb</span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-zinc-400 hover:text-primary" onClick={() => openEdit(ep)}>
                      <Edit className="h-3.5 w-3.5" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-zinc-400 hover:text-destructive" onClick={() => handleDelete(ep)} disabled={deleteEpisode.isPending}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {panel === 'add' && (
          <div className="mt-4">
            <div className="flex items-center gap-2 mb-4">
              <Button variant="ghost" size="sm" onClick={() => setPanel('list')} className="text-zinc-400 hover:text-white -ml-2">
                <ChevronLeft className="h-4 w-4 mr-1" /> Voltar
              </Button>
              <span className="text-white font-semibold">Novo Episódio</span>
            </div>
            <form onSubmit={handleAdd} className="space-y-4">
              <div className={`grid gap-3 ${work.type === 'movie' ? 'grid-cols-1' : 'grid-cols-2'}`}>
                {work.type !== 'movie' && (
                  <div className="space-y-1.5">
                    <Label className="text-zinc-400 text-xs">Temporada</Label>
                    <Input type="number" value={addForm.seasonNumber} onChange={e => setAddForm(p => ({ ...p, seasonNumber: e.target.value }))} placeholder="Ex: 1" className="bg-zinc-900 border-white/10 h-9" />
                  </div>
                )}
                <div className="space-y-1.5">
                  <Label className="text-zinc-400 text-xs">{work.type === 'movie' ? 'Nome do Filme *' : 'Nº do Episódio *'}</Label>
                  <Input required type={work.type === 'movie' ? 'text' : 'number'} value={work.type === 'movie' ? addForm.title : addForm.episodeNumber} onChange={e => work.type === 'movie' ? setAddForm(p => ({ ...p, title: e.target.value, episodeNumber: '1' })) : setAddForm(p => ({ ...p, episodeNumber: e.target.value }))} placeholder={work.type === 'movie' ? 'Nome do filme' : ''} className="bg-zinc-900 border-white/10 h-9" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {work.type !== 'movie' && (
                  <div className="space-y-1.5">
                    <Label className="text-zinc-400 text-xs">Título</Label>
                    <Input value={addForm.title} onChange={e => setAddForm(p => ({ ...p, title: e.target.value }))} placeholder="Opcional" className="bg-zinc-900 border-white/10 h-9" />
                  </div>
                )}
                <div className={work.type === 'movie' ? 'col-span-2 space-y-1.5' : 'space-y-1.5'}>
                  <Label className="text-zinc-400 text-xs">Duração (min)</Label>
                  <Input type="number" value={addForm.duration} onChange={e => setAddForm(p => ({ ...p, duration: e.target.value }))} placeholder="Opcional" className="bg-zinc-900 border-white/10 h-9" />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-zinc-400 text-xs">Thumbnail (URL)</Label>
                <div className="flex gap-2">
                  <Input value={addForm.customThumbnailUrl} onChange={e => setAddForm(p => ({ ...p, customThumbnailUrl: e.target.value }))} placeholder="Cole URL ou use Thumbnails TMDB" className="bg-zinc-900 border-white/10 h-9 flex-1" />
                  {addForm.customThumbnailUrl && (
                    <img src={addForm.customThumbnailUrl} alt="" className="h-9 w-16 object-cover rounded border border-white/10 shrink-0" />
                  )}
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-zinc-300 text-xs font-semibold flex items-center gap-1.5">
                  <Link className="h-3.5 w-3.5 text-primary" /> URL do Servidor (Serve)
                </Label>
                <Input value={addForm.videoSlug} onChange={e => setAddForm(p => ({ ...p, videoSlug: e.target.value }))} placeholder="https://...replit.dev/api/links/1/serve" className="bg-zinc-900 border-primary/30 focus-visible:ring-primary font-mono text-xs h-9" />
              </div>
              <div className="flex gap-2 pt-1">
                <Button type="button" variant="outline" onClick={() => setPanel('list')} className="flex-1 border-white/10 text-zinc-400 h-9">Cancelar</Button>
                <Button type="submit" disabled={addEpisode.isPending} className="flex-1 bg-primary hover:bg-primary/90 text-white font-bold h-9">
                  {addEpisode.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Plus className="h-4 w-4 mr-1" />}
                  Adicionar
                </Button>
              </div>
            </form>
          </div>
        )}

        {panel === 'edit' && editingEpisode && (
          <div className="mt-4">
            <div className="flex items-center gap-2 mb-4">
              <Button variant="ghost" size="sm" onClick={() => setPanel('list')} className="text-zinc-400 hover:text-white -ml-2">
                <ChevronLeft className="h-4 w-4 mr-1" /> Voltar
              </Button>
              <span className="text-white font-semibold">Editando EP {editingEpisode.episodeNumber} — {editingEpisode.title}</span>
            </div>
            <form onSubmit={handleEdit} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-zinc-400 text-xs">Nº do Episódio *</Label>
                  <Input required type="number" value={editForm.episodeNumber} onChange={e => setEditForm(p => ({ ...p, episodeNumber: e.target.value }))} className="bg-zinc-900 border-white/10 h-9" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-zinc-400 text-xs">Duração (min)</Label>
                  <Input type="number" value={editForm.duration} onChange={e => setEditForm(p => ({ ...p, duration: e.target.value }))} placeholder="Opcional" className="bg-zinc-900 border-white/10 h-9" />
                </div>
              </div>
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label className="text-zinc-400 text-xs">Título *</Label>
                  {work.type === 'tv' && work.tmdbId && (
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={handleFetchTmdbForEdit}
                      disabled={tmdbFetching}
                      className="h-6 text-[11px] px-2 border-blue-500/40 text-blue-400 hover:bg-blue-500/10 hover:text-blue-300"
                    >
                      {tmdbFetching ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <Images className="h-3 w-3 mr-1" />}
                      Buscar no TMDB
                    </Button>
                  )}
                </div>
                <Input required value={editForm.title} onChange={e => setEditForm(p => ({ ...p, title: e.target.value }))} className="bg-zinc-900 border-white/10 h-9" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-zinc-400 text-xs">Thumbnail (URL)</Label>
                <div className="flex gap-2">
                  <Input value={editForm.customThumbnailUrl} onChange={e => setEditForm(p => ({ ...p, customThumbnailUrl: e.target.value }))} placeholder="Cole URL ou use Thumbnails TMDB" className="bg-zinc-900 border-white/10 h-9 flex-1" />
                  {editForm.customThumbnailUrl && (
                    <img src={editForm.customThumbnailUrl} alt="" className="h-9 w-16 object-cover rounded border border-white/10 shrink-0" />
                  )}
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-zinc-300 text-xs font-semibold flex items-center gap-1.5">
                  <Link className="h-3.5 w-3.5 text-primary" /> URL do Servidor (Serve)
                </Label>
                <Input value={editForm.videoSlug} onChange={e => setEditForm(p => ({ ...p, videoSlug: e.target.value }))} placeholder="https://...replit.dev/api/links/1/serve" className="bg-zinc-900 border-primary/30 focus-visible:ring-primary font-mono text-xs h-9" />
              </div>
              <div className="flex gap-2 pt-1">
                <Button type="button" variant="outline" onClick={() => setPanel('list')} className="flex-1 border-white/10 text-zinc-400 h-9">Cancelar</Button>
                <Button type="submit" disabled={updateEpisode.isPending} className="flex-1 bg-primary hover:bg-primary/90 text-white font-bold h-9">
                  {updateEpisode.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Save className="h-4 w-4 mr-1" />}
                  Salvar
                </Button>
              </div>
            </form>
          </div>
        )}

        {panel === 'tmdb' && (
          <div className="mt-4">
            <div className="flex items-center gap-2 mb-4">
              <Button variant="ghost" size="sm" onClick={() => setPanel('list')} className="text-zinc-400 hover:text-white -ml-2">
                <ChevronLeft className="h-4 w-4 mr-1" /> Voltar
              </Button>
              <span className="text-white font-semibold">Thumbnails do TMDB</span>
            </div>

            <div className="rounded-lg border border-white/8 bg-zinc-900/40 p-3 mb-4 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-zinc-400 text-xs">TMDB ID de busca</Label>
                  <div className="flex gap-1.5">
                    <Input
                      value={tmdbLookupInput}
                      onChange={e => setTmdbLookupInput(e.target.value)}
                      placeholder={String(work.tmdbId)}
                      className="bg-zinc-800 border-white/10 h-8 text-xs font-mono"
                    />
                    <Button
                      size="sm"
                      className="h-8 px-3 text-xs bg-blue-600 hover:bg-blue-500 text-white shrink-0"
                      onClick={() => {
                        const n = parseInt(tmdbLookupInput, 10);
                        if (!isNaN(n) && n > 0) setTmdbLookupId(n);
                        else toast({ title: 'ID inválido', description: 'Digite um número válido.', variant: 'destructive' });
                      }}
                    >
                      Buscar
                    </Button>
                  </div>
                  <p className="text-[10px] text-zinc-600">Se a temporada for uma entrada separada no TMDB, cole o ID dela aqui.</p>
                </div>
                <div className="space-y-1">
                  <Label className="text-zinc-400 text-xs">Salvar como temporada nº</Label>
                  <Input
                    type="number"
                    min="1"
                    value={dbSeasonTarget}
                    onChange={e => setDbSeasonTarget(e.target.value)}
                    placeholder="Automático (usa a do TMDB)"
                    className="bg-zinc-800 border-white/10 h-8 text-xs"
                  />
                  <p className="text-[10px] text-zinc-600">Força todos os EPs aplicados a pertencerem a esta temporada.</p>
                </div>
              </div>
            </div>

            <TmdbEpisodePicker
              tmdbId={tmdbLookupId}
              episodes={episodes || []}
              onApply={handleTmdbApply}
            />
          </div>
        )}

        {panel === 'vlm' && (
          <div className="mt-4">
            <div className="flex items-center gap-2 mb-4">
              <Button variant="ghost" size="sm" onClick={() => setPanel('list')} className="text-zinc-400 hover:text-white -ml-2">
                <ChevronLeft className="h-4 w-4 mr-1" /> Voltar
              </Button>
              <span className="text-white font-semibold">Importar do VLM</span>
            </div>

            <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-4 space-y-4">
              <div>
                <p className="text-sm text-zinc-300 font-medium mb-1">URL do endpoint VLM</p>
                <p className="text-xs text-zinc-500 mb-3">
                  Cole a URL no formato <span className="font-mono text-zinc-400">https://SEU-VLM.onrender.com/api/folders/5/episodes</span>
                </p>
                <div className="flex gap-2">
                  <Input
                    value={vlmUrl}
                    onChange={e => setVlmUrl(e.target.value)}
                    placeholder="https://seu-vlm.onrender.com/api/folders/5/episodes"
                    className="bg-zinc-900 border-white/10 font-mono text-xs h-9 flex-1"
                    disabled={vlmImporting}
                  />
                </div>
              </div>

              <Button
                onClick={handleVlmImport}
                disabled={vlmImporting || !vlmUrl.trim()}
                className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold h-10"
              >
                {vlmImporting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Importando...
                  </>
                ) : (
                  <>
                    <Download className="h-4 w-4 mr-2" />
                    Importar do VLM
                  </>
                )}
              </Button>

              <p className="text-xs text-zinc-600 text-center">
                Os episódios serão adicionados à obra sem sobrescrever os existentes.
              </p>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
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
  const [formData, setFormData] = useState({ customThumbnailUrl: '', customBannerUrl: '', status: 'completed', isFeatured: false, genres: '' });

  const searchTmdb = async () => {
    if (!tmdbId) return;
    setLoadingTmdb(true);
    setPreview(null);
    try {
      const data = await fetchTmdb(`/${tmdbType}/${tmdbId}`);
      setPreview({
        title: data.name || data.title,
        originalTitle: data.original_name || data.original_title,
        synopsis: data.overview,
        posterPath: data.poster_path,
        backdropPath: data.backdrop_path,
        releaseYear: data.first_air_date ? parseInt(data.first_air_date.substring(0, 4)) : data.release_date ? parseInt(data.release_date.substring(0, 4)) : null,
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
    } catch {
      toast({ title: 'Erro', description: 'Falha ao adicionar obra.', variant: 'destructive' });
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-white mb-1">Adicionar Nova Obra</h2>
        <p className="text-zinc-500 text-sm">Busque no TMDB e adicione ao catálogo.</p>
      </div>
      <div className="grid md:grid-cols-2 gap-8">
        <div className="space-y-6">
          <Card className="bg-zinc-900/60 border-white/8">
            <CardHeader><CardTitle className="text-white">Buscar no TMDB</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-zinc-400">Tipo</Label>
                  <Select value={tmdbType} onValueChange={(v: 'tv' | 'movie') => setTmdbType(v)}>
                    <SelectTrigger className="bg-white/5 border-white/10"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="tv">Série (TV)</SelectItem>
                      <SelectItem value="movie">Filme</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-zinc-400">TMDB ID</Label>
                  <div className="flex gap-2">
                    <Input value={tmdbId} onChange={e => setTmdbId(e.target.value)} onKeyDown={e => e.key === 'Enter' && searchTmdb()} placeholder="Ex: 37854" className="bg-white/5 border-white/10" />
                    <Button onClick={searchTmdb} disabled={loadingTmdb} className="bg-white/10 hover:bg-white/20 text-white">
                      {loadingTmdb ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
              </div>
              <div className="pt-4 space-y-4 border-t border-white/10">
                <div className="space-y-2">
                  <Label className="text-zinc-400">Status</Label>
                  <Select value={formData.status} onValueChange={v => setFormData(p => ({ ...p, status: v }))}>
                    <SelectTrigger className="bg-white/5 border-white/10"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ongoing">Em Lançamento</SelectItem>
                      <SelectItem value="completed">Completo</SelectItem>
                      <SelectItem value="upcoming">Em Breve</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center justify-between rounded-lg border border-white/10 bg-white/5 p-4">
                  <div>
                    <Label className="text-base text-white">Destaque</Label>
                    <p className="text-sm text-zinc-500">Mostrar no banner da página inicial</p>
                  </div>
                  <Switch checked={formData.isFeatured} onCheckedChange={v => setFormData(p => ({ ...p, isFeatured: v }))} />
                </div>
                <div className="space-y-2">
                  <Label className="text-zinc-400">Thumbnail Personalizada (URL)</Label>
                  <Input value={formData.customThumbnailUrl} onChange={e => setFormData(p => ({ ...p, customThumbnailUrl: e.target.value }))} placeholder="Deixe em branco para usar TMDB" className="bg-white/5 border-white/10" />
                </div>
                <div className="space-y-2">
                  <Label className="text-zinc-400">Banner Personalizado (URL)</Label>
                  <Input value={formData.customBannerUrl} onChange={e => setFormData(p => ({ ...p, customBannerUrl: e.target.value }))} placeholder="Deixe em branco para usar TMDB" className="bg-white/5 border-white/10" />
                </div>
                <div className="space-y-2">
                  <Label className="text-zinc-400">Gêneros (separados por vírgula)</Label>
                  <Input value={formData.genres} onChange={e => setFormData(p => ({ ...p, genres: e.target.value }))} className="bg-white/5 border-white/10" />
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
            <Card className="bg-zinc-900/60 border-white/8 overflow-hidden sticky top-24">
              <div className="aspect-video w-full relative">
                <img src={formData.customBannerUrl || tmdbBackdrop(preview.backdropPath)} className="w-full h-full object-cover" alt="Banner" />
                <div className="absolute inset-0 bg-gradient-to-t from-zinc-900 to-transparent" />
              </div>
              <CardContent className="relative -mt-16 flex gap-4">
                <img src={formData.customThumbnailUrl || tmdbPoster(preview.posterPath)} className="w-24 h-36 rounded-md object-cover border-2 border-zinc-800 shadow-xl bg-zinc-800" alt="Poster" />
                <div className="pt-16 space-y-1">
                  <h3 className="font-heading text-xl font-bold text-white leading-tight">{preview.title}</h3>
                  <p className="text-sm text-zinc-400">{preview.originalTitle}</p>
                  <div className="flex gap-2 text-xs text-zinc-500 mt-2">
                    <span>{preview.releaseYear}</span><span>•</span><span>{preview.rating?.toFixed(1)}/10</span>
                  </div>
                </div>
              </CardContent>
              <div className="px-6 pb-6 text-sm text-zinc-300 line-clamp-6">{preview.synopsis}</div>
            </Card>
          ) : (
            <div className="h-full min-h-[400px] border-2 border-dashed border-white/10 rounded-xl flex items-center justify-center text-zinc-500 flex-col gap-2">
              <Tv className="h-8 w-8" />
              <p>Faça uma busca para visualizar a obra</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function CatalogTab() {
  const { data, isLoading } = useListWorks({ limit: 100 });
  const deleteWork = useDeleteWork();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [search, setSearch] = useState('');

  const filteredWorks = React.useMemo(() => {
    if (!data?.works) return [];
    if (!search.trim()) return data.works;
    return data.works.filter(w => w.title.toLowerCase().includes(search.toLowerCase()));
  }, [data?.works, search]);

  const handleDelete = async (id: number) => {
    if (!confirm('Tem certeza que deseja remover esta obra e todos os seus episódios?')) return;
    try {
      await deleteWork.mutateAsync({ id });
      queryClient.invalidateQueries({ queryKey: getListWorksQueryKey() });
      toast({ title: 'Sucesso', description: 'Obra removida do catálogo.' });
    } catch {
      toast({ title: 'Erro', description: 'Não foi possível remover.', variant: 'destructive' });
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-white mb-1">Catálogo</h2>
        <p className="text-zinc-500 text-sm">Gerencie todas as obras da plataforma.</p>
      </div>

      {isLoading ? (
        <div className="py-10 flex justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
      ) : (
        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500 pointer-events-none" />
            <Input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Buscar obra por título..."
              className="pl-9 bg-zinc-900/50 border-white/10 text-white placeholder:text-zinc-500 focus-visible:ring-primary"
            />
          </div>
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
                  {filteredWorks.length === 0 && search && (
                    <tr>
                      <td colSpan={4} className="px-6 py-10 text-center text-zinc-500">Nenhuma obra encontrada para "{search}".</td>
                    </tr>
                  )}
                  {filteredWorks.map((work) => (
                    <tr key={work.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                      <td className="px-6 py-4 font-medium text-white">
                        <div className="flex items-center gap-3">
                          <img
                            src={work.customThumbnailUrl || tmdbPoster(work.posterPath, 'w92')}
                            className="w-10 h-14 object-cover rounded bg-zinc-800 shrink-0"
                            alt=""
                          />
                          <div>
                            <p className="line-clamp-1">{work.title}</p>
                            <p className="text-xs text-zinc-500 font-normal">{work.releaseYear}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 uppercase text-xs">{work.type}</td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded text-xs ${work.status === 'ongoing' ? 'bg-green-500/20 text-green-400' : work.status === 'upcoming' ? 'bg-yellow-500/20 text-yellow-400' : 'bg-zinc-800 text-zinc-400'}`}>
                          {work.status === 'ongoing' ? 'Em lançamento' : work.status === 'upcoming' ? 'Em breve' : 'Completo'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-1">
                          <EpisodesManager work={work} />
                          <EditWorkDialog work={work} onUpdated={() => queryClient.invalidateQueries({ queryKey: getListWorksQueryKey() })} />
                          <Button variant="ghost" size="icon" className="text-zinc-400 hover:text-destructive hover:bg-destructive/10" onClick={() => handleDelete(work.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Top10Tab() {
  const { data: top10, isLoading, refetch } = useGetTop10();
  const { data: worksData } = useListWorks({ limit: 200 });
  const updateWork = useUpdateWork();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editValue, setEditValue] = useState('');
  const [search, setSearch] = useState('');
  const [addingWork, setAddingWork] = useState(false);

  const allWorks = worksData?.works ?? [];
  const top10Ids = new Set((top10 ?? []).map(w => w.id));

  const filteredWorks = React.useMemo(() => {
    if (!search.trim()) return [];
    return allWorks.filter(w => !top10Ids.has(w.id) && w.title.toLowerCase().includes(search.toLowerCase())).slice(0, 6);
  }, [allWorks, search, top10Ids]);

  const startEdit = (id: number, current: number) => {
    setEditingId(id);
    setEditValue(String(current));
  };

  const saveViewCount = async (id: number) => {
    const val = parseInt(editValue, 10);
    if (isNaN(val) || val < 0) {
      toast({ title: 'Valor inválido', variant: 'destructive' });
      return;
    }
    try {
      await updateWork.mutateAsync({ id, data: { viewCount: val } });
      queryClient.invalidateQueries({ queryKey: getGetTop10QueryKey() });
      queryClient.invalidateQueries({ queryKey: getListWorksQueryKey() });
      setEditingId(null);
      toast({ title: 'Visualizações atualizadas' });
    } catch {
      toast({ title: 'Erro ao salvar', variant: 'destructive' });
    }
  };

  const boostWork = async (id: number, currentViews: number, addViews: number) => {
    try {
      await updateWork.mutateAsync({ id, data: { viewCount: currentViews + addViews } });
      queryClient.invalidateQueries({ queryKey: getGetTop10QueryKey() });
      queryClient.invalidateQueries({ queryKey: getListWorksQueryKey() });
      toast({ title: `+${addViews} visualizações adicionadas` });
    } catch {
      toast({ title: 'Erro', variant: 'destructive' });
    }
  };

  const addToTop10 = async (work: typeof allWorks[0]) => {
    const minViews = top10 && top10.length >= 10 ? (top10[9]?.viewCount ?? 0) + 1 : 1;
    try {
      await updateWork.mutateAsync({ id: work.id, data: { viewCount: minViews } });
      queryClient.invalidateQueries({ queryKey: getGetTop10QueryKey() });
      queryClient.invalidateQueries({ queryKey: getListWorksQueryKey() });
      setSearch('');
      setAddingWork(false);
      toast({ title: `"${work.title}" adicionado ao Top 10` });
    } catch {
      toast({ title: 'Erro', variant: 'destructive' });
    }
  };

  if (isLoading) return <div className="py-10 flex justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white mb-1 flex items-center gap-2">
            <Trophy className="h-5 w-5 text-amber-400" /> Top 10
          </h2>
          <p className="text-zinc-500 text-sm">Controle o ranking das obras mais populares. O ranking é baseado em visualizações.</p>
        </div>
        <Button
          size="sm"
          variant="outline"
          onClick={() => setAddingWork(v => !v)}
          className="border-white/10 text-zinc-300 hover:text-white gap-1.5"
        >
          <Plus className="h-4 w-4" />
          Adicionar ao Top 10
        </Button>
      </div>

      {addingWork && (
        <Card className="bg-zinc-900/60 border-white/8">
          <CardContent className="p-4 space-y-3">
            <p className="text-sm text-zinc-400">Busque uma obra para incluir no Top 10:</p>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500 pointer-events-none" />
              <Input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Buscar por título..."
                className="pl-9 bg-zinc-900 border-white/10"
                autoFocus
              />
            </div>
            {filteredWorks.length > 0 && (
              <div className="space-y-1">
                {filteredWorks.map(work => (
                  <button
                    key={work.id}
                    onClick={() => addToTop10(work)}
                    className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-white/5 transition-colors text-left"
                  >
                    <img
                      src={work.customThumbnailUrl || tmdbPoster(work.posterPath, 'w92')}
                      className="w-8 h-11 object-cover rounded bg-zinc-800 shrink-0"
                      alt=""
                    />
                    <div>
                      <p className="text-sm font-medium text-white">{work.title}</p>
                      <p className="text-xs text-zinc-500">{(work.viewCount ?? 0).toLocaleString()} views</p>
                    </div>
                  </button>
                ))}
              </div>
            )}
            {search && filteredWorks.length === 0 && (
              <p className="text-sm text-zinc-500 py-2">Nenhuma obra encontrada fora do Top 10.</p>
            )}
          </CardContent>
        </Card>
      )}

      <div className="space-y-2">
        {(top10 ?? []).map((work, idx) => (
          <div
            key={work.id}
            className={`flex items-center gap-4 p-3 rounded-xl border transition-colors ${idx === 0 ? 'border-amber-500/30 bg-amber-500/5' : idx === 1 ? 'border-zinc-500/30 bg-zinc-500/5' : idx === 2 ? 'border-orange-700/30 bg-orange-700/5' : 'border-white/8 bg-zinc-900/40'}`}
          >
            <div className={`text-3xl font-black w-10 text-center shrink-0 ${idx === 0 ? 'text-amber-400' : idx === 1 ? 'text-zinc-400' : idx === 2 ? 'text-orange-600' : 'text-zinc-600'}`}>
              {idx + 1}
            </div>
            <img
              src={work.customThumbnailUrl || tmdbPoster(work.posterPath, 'w92')}
              className="w-10 h-14 object-cover rounded bg-zinc-800 shrink-0"
              alt=""
            />
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-white truncate">{work.title}</p>
              <div className="flex items-center gap-1.5 mt-0.5">
                <Eye className="h-3 w-3 text-zinc-500" />
                {editingId === work.id ? (
                  <div className="flex items-center gap-1.5">
                    <Input
                      type="number"
                      value={editValue}
                      onChange={e => setEditValue(e.target.value)}
                      className="h-6 w-28 bg-zinc-800 border-white/20 text-xs px-2"
                      autoFocus
                      onKeyDown={e => {
                        if (e.key === 'Enter') saveViewCount(work.id);
                        if (e.key === 'Escape') setEditingId(null);
                      }}
                    />
                    <Button size="sm" className="h-6 px-2 text-xs bg-primary/90 hover:bg-primary text-white" onClick={() => saveViewCount(work.id)} disabled={updateWork.isPending}>
                      {updateWork.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <Save className="h-3 w-3" />}
                    </Button>
                    <Button size="sm" variant="ghost" className="h-6 px-2 text-xs text-zinc-400" onClick={() => setEditingId(null)}>
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ) : (
                  <button
                    onClick={() => startEdit(work.id, work.viewCount)}
                    className="text-xs text-zinc-400 hover:text-white transition-colors flex items-center gap-1"
                    title="Clique para editar"
                  >
                    {work.viewCount.toLocaleString()} visualizações
                    <Edit className="h-3 w-3 opacity-50" />
                  </button>
                )}
              </div>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <Button
                size="sm"
                variant="ghost"
                className="h-7 px-2 text-xs text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10"
                onClick={() => boostWork(work.id, work.viewCount, 100)}
                title="+100 visualizações"
              >
                +100
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="h-7 px-2 text-xs text-blue-400 hover:text-blue-300 hover:bg-blue-500/10"
                onClick={() => boostWork(work.id, work.viewCount, 1000)}
                title="+1000 visualizações"
              >
                +1K
              </Button>
            </div>
          </div>
        ))}

        {(top10 ?? []).length === 0 && (
          <div className="text-center py-12 text-zinc-500">
            <Trophy className="h-10 w-10 mx-auto mb-3 opacity-30" />
            <p className="text-sm">Nenhuma obra com visualizações ainda.</p>
          </div>
        )}
      </div>
    </div>
  );
}

function AdminSidebar({ active, onChange }: { active: AdminTab; onChange: (tab: AdminTab) => void }) {
  return (
    <aside className="hidden lg:flex flex-col w-60 shrink-0">
      <div className="sticky top-20 space-y-1">
        <div className="px-3 pb-3 mb-2 border-b border-white/8">
          <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-600">Administração</p>
        </div>
        {NAV_ITEMS.map(item => (
          <button
            key={item.id}
            onClick={() => onChange(item.id)}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
              active === item.id
                ? item.accent
                  ? 'bg-primary text-white shadow-lg shadow-primary/20'
                  : 'bg-white/10 text-white'
                : item.accent
                  ? 'text-primary hover:bg-primary/10'
                  : 'text-zinc-400 hover:bg-white/5 hover:text-white'
            }`}
          >
            <span className={active === item.id && !item.accent ? 'text-primary' : ''}>{item.icon}</span>
            {item.label}
            {item.id === 'top10' && (
              <span className="ml-auto text-[10px] bg-amber-500/20 text-amber-400 font-bold px-1.5 py-0.5 rounded">RANK</span>
            )}
          </button>
        ))}
      </div>
    </aside>
  );
}

function MobileNavBar({ active, onChange }: { active: AdminTab; onChange: (tab: AdminTab) => void }) {
  const [open, setOpen] = useState(false);
  const current = NAV_ITEMS.find(n => n.id === active);
  return (
    <div className="lg:hidden mb-6">
      <button
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center justify-between px-4 py-3 rounded-xl bg-zinc-900/70 border border-white/10 text-white"
      >
        <div className="flex items-center gap-2 text-sm font-semibold">
          {current?.icon}
          {current?.label}
        </div>
        <Menu className="h-4 w-4 text-zinc-400" />
      </button>
      {open && (
        <div className="mt-1 rounded-xl bg-zinc-900/90 border border-white/10 overflow-hidden shadow-xl">
          {NAV_ITEMS.map(item => (
            <button
              key={item.id}
              onClick={() => { onChange(item.id); setOpen(false); }}
              className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium transition-colors ${
                active === item.id ? 'bg-white/10 text-white' : 'text-zinc-400 hover:bg-white/5 hover:text-white'
              }`}
            >
              {item.icon}
              {item.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default function AdminPanel() {
  const [activeTab, setActiveTab] = useState<AdminTab>('dashboard');

  return (
    <Layout>
      <ProtectedRoute requireAdmin>
        <div className="container mx-auto px-4 py-8 md:py-10 mt-14">
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-1">
              <div className="h-8 w-1 rounded-full bg-primary" />
              <h1 className="font-heading text-3xl font-black text-white">Painel Admin</h1>
            </div>
            <p className="text-zinc-500 ml-4">Gerencie o catálogo, episódios e configurações da plataforma.</p>
          </div>

          <div className="flex gap-8 items-start">
            <AdminSidebar active={activeTab} onChange={setActiveTab} />
            <main className="flex-1 min-w-0">
              <MobileNavBar active={activeTab} onChange={setActiveTab} />
              {activeTab === 'dashboard' && <DashboardTab />}
              {activeTab === 'catalog' && <CatalogTab />}
              {activeTab === 'add' && <AddWorkTab />}
              {activeTab === 'top10' && <Top10Tab />}
            </main>
          </div>
        </div>
      </ProtectedRoute>
    </Layout>
  );
}
