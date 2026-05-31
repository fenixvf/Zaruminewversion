import React, { useState } from 'react';
import { useLocation } from 'wouter';
import { useListWorks } from '@workspace/api-client-react';
import { Layout } from '@/components/layout';
import { WorkCard } from '@/components/work-card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, Filter, Loader2 } from 'lucide-react';

const GENRES = [
  "Ação", "Aventura", "Comédia", "Drama", "Fantasia", "Magia", "Sobrenatural", 
  "Terror", "Mistério", "Psicológico", "Romance", "Sci-Fi", "Slice of Life", "Esportes"
];

export default function Browse() {
  const [location] = useLocation();
  const searchParams = new URLSearchParams(window.location.search);
  const initialQuery = searchParams.get('q') || '';
  
  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [debouncedQuery, setDebouncedQuery] = useState(initialQuery);
  const [selectedGenre, setSelectedGenre] = useState<string | null>(null);

  // Debounce search
  React.useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const { data, isLoading } = useListWorks({
    limit: 50,
    genre: selectedGenre || undefined,
  });

  const filteredWorks = data?.works.filter(w => 
    debouncedQuery ? w.title.toLowerCase().includes(debouncedQuery.toLowerCase()) || w.originalTitle?.toLowerCase().includes(debouncedQuery.toLowerCase()) : true
  );

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8 md:py-12 mt-16">
        <h1 className="font-heading text-3xl font-bold text-white mb-8">Explorar Catálogo</h1>
        
        <div className="flex flex-col md:flex-row gap-6 mb-10">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-zinc-400" />
            <Input 
              placeholder="Buscar animes..." 
              className="pl-10 h-12 bg-white/5 border-white/10 rounded-full focus-visible:ring-primary text-base"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          
          <div className="flex-1 overflow-x-auto scrollbar-hide pb-2">
            <div className="flex gap-2 min-w-max">
              <Button 
                variant={selectedGenre === null ? 'default' : 'outline'} 
                className={`rounded-full ${selectedGenre === null ? 'bg-primary text-white' : 'border-white/10 text-zinc-300'}`}
                onClick={() => setSelectedGenre(null)}
              >
                Todos
              </Button>
              {GENRES.map(g => (
                <Button 
                  key={g}
                  variant={selectedGenre === g ? 'default' : 'outline'} 
                  className={`rounded-full ${selectedGenre === g ? 'bg-primary text-white' : 'border-white/10 text-zinc-300'}`}
                  onClick={() => setSelectedGenre(g)}
                >
                  {g}
                </Button>
              ))}
            </div>
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center items-center py-20">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
          </div>
        ) : filteredWorks && filteredWorks.length > 0 ? (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
            {filteredWorks.map(work => (
              <WorkCard key={work.id} work={work} />
            ))}
          </div>
        ) : (
          <div className="text-center py-20">
            <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-white/5 mb-4">
              <Search className="h-8 w-8 text-zinc-500" />
            </div>
            <h3 className="font-heading text-xl font-semibold text-white mb-2">Nenhum resultado encontrado</h3>
            <p className="text-zinc-400">Tente ajustar seus filtros ou termos de busca.</p>
          </div>
        )}
      </div>
    </Layout>
  );
}
