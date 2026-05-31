import React, { useEffect, useState } from 'react';
import { Layout } from '@/components/layout';
import { ProtectedRoute } from '@/components/protected-route';
import { useAuth } from '@/components/auth-provider';
import { useToast } from '@/hooks/use-toast';
import { db } from '@/lib/firebase';
import { collection, getDocs, query, orderBy, doc, deleteDoc } from 'firebase/firestore';
import { useGetWork } from '@workspace/api-client-react';
import { WorkCard } from '@/components/work-card';
import { Bookmark, Loader2, Trash2 } from 'lucide-react';
import { Link } from 'wouter';

function MyListContent() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [workIds, setWorkIds] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);
  const [removing, setRemoving] = useState<number | null>(null);

  useEffect(() => {
    async function fetchList() {
      if (!user) return;
      try {
        const q = query(collection(db, `users/${user.uid}/myList`), orderBy('addedAt', 'desc'));
        const snapshot = await getDocs(q);
        const ids = snapshot.docs.map(d => d.data().workId as number);
        setWorkIds(ids);
      } catch (err) {
        console.error('Error fetching list:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchList();
  }, [user]);

  const handleRemove = async (workId: number, title?: string) => {
    if (!user) return;
    setRemoving(workId);
    try {
      await deleteDoc(doc(db, `users/${user.uid}/myList/${workId}`));
      setWorkIds(prev => prev.filter(id => id !== workId));
      toast({ title: 'Removido da lista', description: title || `Obra #${workId}` });
    } catch (err: any) {
      toast({
        title: 'Erro ao remover',
        description: err?.message || 'Tente novamente.',
        variant: 'destructive',
      });
    } finally {
      setRemoving(null);
    }
  };

  if (loading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 mt-16">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2.5 bg-primary/10 rounded-lg">
          <Bookmark className="h-5 w-5 text-primary" />
        </div>
        <h1 className="font-heading text-3xl font-black uppercase tracking-tight text-white">Minha Lista</h1>
        {workIds.length > 0 && (
          <span className="ml-1 text-sm text-zinc-500 font-medium">{workIds.length} {workIds.length === 1 ? 'obra' : 'obras'}</span>
        )}
      </div>

      {workIds.length > 0 ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
          {workIds.map(id => (
            <WorkItem
              key={id}
              id={id}
              removing={removing === id}
              onRemove={handleRemove}
            />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="h-24 w-24 rounded-full bg-white/5 flex items-center justify-center mb-6">
            <Bookmark className="h-10 w-10 text-zinc-600" />
          </div>
          <h2 className="font-heading text-xl font-black uppercase text-white mb-2">Sua lista está vazia</h2>
          <p className="text-zinc-400 max-w-md text-sm mb-6">
            Adicione animes clicando em "Minha Lista" na página de detalhes.
          </p>
          <Link href="/browse" className="inline-flex items-center gap-2 bg-primary text-white text-sm font-bold uppercase tracking-wider px-5 py-2.5 rounded hover:bg-primary/90 transition-colors">
            Explorar catálogo
          </Link>
        </div>
      )}
    </div>
  );
}

function WorkItem({
  id,
  removing,
  onRemove,
}: {
  id: number;
  removing: boolean;
  onRemove: (id: number, title?: string) => void;
}) {
  const { data: work, isLoading } = useGetWork(id);

  if (isLoading) {
    return <div className="aspect-[2/3] animate-pulse rounded-md bg-zinc-800" />;
  }

  if (!work) return null;

  return (
    <div className="group relative">
      <WorkCard work={work} />
      <button
        onClick={() => onRemove(id, work.title)}
        disabled={removing}
        aria-label="Remover da lista"
        className="absolute top-2 left-2 z-30 flex items-center justify-center h-8 w-8 rounded-full bg-black/70 text-white opacity-0 group-hover:opacity-100 transition-all duration-200 hover:bg-primary disabled:opacity-50 backdrop-blur-sm"
      >
        {removing ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Trash2 className="h-4 w-4" />
        )}
      </button>
    </div>
  );
}

export default function MyList() {
  return (
    <Layout>
      <ProtectedRoute>
        <MyListContent />
      </ProtectedRoute>
    </Layout>
  );
}
