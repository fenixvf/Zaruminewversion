import React, { useState, useEffect } from 'react';
import { useListFeaturedWorks, useListRecentWorks, useGetTop10 } from '@workspace/api-client-react';
import { Layout } from '@/components/layout';
import { WorkCard } from '@/components/work-card';
import { Button } from '@/components/ui/button';
import { Play, Info, ChevronRight, ChevronLeft } from 'lucide-react';
import { Link } from 'wouter';
import { motion, AnimatePresence } from 'framer-motion';
import { Spinner } from '@/components/ui/spinner';

function HeroBanner() {
  const { data: featuredWorks, isLoading } = useListFeaturedWorks();
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (!featuredWorks || featuredWorks.length === 0) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % featuredWorks.length);
    }, 6000);
    return () => clearInterval(interval);
  }, [featuredWorks]);

  if (isLoading) {
    return <div className="h-[70vh] w-full bg-zinc-900 animate-pulse flex items-center justify-center"><Spinner className="h-10 w-10 text-primary" /></div>;
  }

  if (!featuredWorks || featuredWorks.length === 0) {
    return null;
  }

  const work = featuredWorks[currentIndex];
  const bannerUrl = work.customBannerUrl || (work.backdropPath ? `https://image.tmdb.org/t/p/original${work.backdropPath}` : '');

  return (
    <div className="relative h-[65vh] md:h-[75vh] w-full overflow-hidden bg-background">
      <AnimatePresence mode="wait">
        <motion.div
          key={currentIndex}
          initial={{ opacity: 0, scale: 1.05 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1.2, ease: 'easeOut' }}
          className="absolute inset-0"
        >
          <div className="absolute inset-0 bg-cover bg-center bg-no-repeat" style={{ backgroundImage: `url(${bannerUrl})` }} />
          {/* Gradients to blend into background */}
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-r from-background via-background/40 to-transparent" />
        </motion.div>
      </AnimatePresence>

      <div className="absolute inset-0 flex items-center">
        <div className="container mx-auto px-3 md:px-6">
          <div className="max-w-2xl">
            <motion.div
              key={`content-${currentIndex}`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.3 }}
              className="space-y-4"
            >
              {work.type === 'movie' && (
                <span className="inline-block rounded-sm bg-primary/20 px-3 py-1 text-xs font-bold uppercase tracking-wider text-primary border border-primary/30">
                  Filme
                </span>
              )}
              <h1 className="font-heading text-5xl md:text-7xl lg:text-8xl font-black uppercase tracking-tighter text-white drop-shadow-lg">
                {work.title}
              </h1>
              {work.synopsis && (
                <p className="text-sm md:text-base text-zinc-300 line-clamp-2 drop-shadow max-w-xl">
                  {work.synopsis}
                </p>
              )}
              <div className="flex items-center gap-3 pt-4">
                <Button asChild size="lg" className="rounded-sm px-6 font-bold uppercase tracking-wide bg-white text-black hover:bg-zinc-200">
                  <Link href={`/anime/${work.id}`}>
                    <Play className="mr-2 h-5 w-5 fill-current" />
                    Assistir
                  </Link>
                </Button>
                <Button asChild size="lg" variant="outline" className="rounded-sm px-6 font-bold uppercase tracking-wide border-white/20 bg-black/40 text-white hover:bg-white/20 backdrop-blur-md">
                  <Link href={`/anime/${work.id}`}>
                    <Info className="mr-2 h-5 w-5" />
                    Mais Detalhes
                  </Link>
                </Button>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
      
      {/* Navigation dots */}
      <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-2 z-20">
        {featuredWorks.map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrentIndex(i)}
            className={`h-1.5 rounded-sm transition-all ${i === currentIndex ? 'w-8 bg-primary' : 'w-2 bg-white/30 hover:bg-white/50'}`}
            aria-label={`Go to slide ${i + 1}`}
          />
        ))}
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string, children: React.ReactNode }) {
  return (
    <section className="py-4 md:py-6">
      <div className="container mx-auto px-3 md:px-6">
        <h2 className="mb-3 font-heading text-xl font-black uppercase tracking-wider text-white flex items-center gap-2">
          {title}
          <ChevronRight className="h-5 w-5 text-primary" />
        </h2>
        {children}
      </div>
    </section>
  );
}

export default function Home() {
  const { data: recentWorks, isLoading: isLoadingRecent } = useListRecentWorks({ limit: 12 });
  const { data: topWorks, isLoading: isLoadingTop } = useGetTop10();

  return (
    <Layout>
      <HeroBanner />

      <div className="relative z-10 -mt-20 flex flex-col gap-4 pb-20 bg-background">
        
        <Section title="Adicionados Recentemente">
          {isLoadingRecent ? (
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="aspect-[2/3] animate-pulse rounded-md bg-zinc-800" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
              {recentWorks?.map((work) => (
                <WorkCard key={work.id} work={work} />
              ))}
            </div>
          )}
        </Section>

        <Section title="Top 10 Zarumi">
          {isLoadingTop ? (
            <div className="grid grid-cols-2 gap-x-8 gap-y-2 sm:grid-cols-3 md:grid-cols-5">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="aspect-[2/3] animate-pulse rounded-md bg-zinc-800" />
              ))}
            </div>
          ) : (
            <div className="flex overflow-x-auto pb-6 pt-2 -mx-4 px-4 gap-x-2 md:mx-0 md:px-0 scrollbar-hide snap-x">
              {topWorks?.slice(0, 10).map((work, index) => (
                <div key={work.id} className="w-[130px] md:w-[150px] flex-shrink-0 snap-start pl-9 relative">
                  <WorkCard work={work as any} rank={index + 1} />
                </div>
              ))}
            </div>
          )}
        </Section>

      </div>
    </Layout>
  );
}
