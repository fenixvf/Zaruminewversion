import React from 'react';
import { Redirect, Link } from 'wouter';
import { useAuth } from '@/components/auth-provider';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';

export default function Login() {
  const { user, isLoading } = useAuth();

  if (isLoading) return null;
  if (user) return <Redirect to="/" />;

  return (
    <div className="min-h-screen flex items-center justify-center bg-background relative overflow-hidden">
      <div className="absolute inset-0 z-0">
        <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-primary/20 rounded-full blur-[120px] opacity-50 mix-blend-screen" />
        <div className="absolute bottom-0 right-1/4 w-[600px] h-[600px] bg-red-900/20 rounded-full blur-[150px] opacity-50 mix-blend-screen" />
        <div className="absolute inset-0 bg-background/80 backdrop-blur-[2px]" />
      </div>

      <div className="relative z-10 w-full max-w-md p-6 sm:p-8 bg-zinc-950/80 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl">
        <Link href="/" className="flex flex-col items-center gap-3 mb-8 cursor-pointer">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary shadow-lg shadow-primary/30">
            <img src="/zarumi-icon.png" alt="Zarumi" className="h-8 w-8 object-contain" />
          </div>
          <span className="font-heading text-2xl font-black uppercase tracking-tight text-white">Zarumi</span>
        </Link>

        <h1 className="font-heading text-3xl font-black uppercase text-white mb-2 text-center">
          Entrar
        </h1>
        <p className="text-zinc-400 text-sm text-center mb-8">
          Acesse sua conta para continuar assistindo
        </p>

        <a href="/api/login" className="block w-full">
          <Button className="w-full h-11 font-bold bg-primary hover:bg-primary/90 text-white">
            Entrar com Replit
          </Button>
        </a>
      </div>
    </div>
  );
}
