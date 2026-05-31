import React, { useEffect, useState } from 'react';
import { Layout } from '@/components/layout';
import { ProtectedRoute } from '@/components/protected-route';
import { useAuth } from '@/components/auth-provider';
import { db } from '@/lib/firebase';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { useGetWork } from '@workspace/api-client-react';
import { WorkCard } from '@/components/work-card';
import { Bookmark, Loader2 } from 'lucide-react';

function MyListContent() {
  const { user } = useAuth();
  const [workIds, setWorkIds] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchList() {
      if (!user) return;
      try {
        const q = query(collection(db, `users/${user.uid}/myList`), orderBy('addedAt', 'desc'));
        const snapshot = await getDocs(q);
        const ids = snapshot.docs.map(doc => doc.data().workId as number);
        setWorkIds(ids);
      } catch (err) {
        console.error("Error fetching list:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchList();
  }, [user]);

  if (loading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-12 mt-16">
      <div className="flex items-center gap-3 mb-8">
        <div className="p-3 bg-primary/10 rounded-lg">
          <Bookmark className="h-6 w-6 text-primary" />
        </div>
        <h1 className="font-heading text-3xl font-bold text-white">Minha Lista</h1>
      </div>

      {workIds.length > 0 ? (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
          {workIds.map(id => (
            <WorkItem key={id} id={id} />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="h-24 w-24 rounded-full bg-white/5 flex items-center justify-center mb-6">
            <Bookmark className="h-10 w-10 text-zinc-600" />
          </div>
          <h2 className="text-xl font-bold text-white mb-2">Sua lista está vazia</h2>
          <p className="text-zinc-400 max-w-md">
            Adicione animes e filmes que você deseja assistir clicando no botão "Minha Lista" na página de detalhes.
          </p>
        </div>
      )}
    </div>
  );
}

// Separate component to handle individual work fetching
function WorkItem({ id }: { id: number }) {
  const { data: work, isLoading } = useGetWork(id);
  
  if (isLoading) {
    return <div className="aspect-[2/3] animate-pulse rounded-md bg-zinc-800" />;
  }
  
  if (!work) return null;
  
  return <WorkCard work={work} />;
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
