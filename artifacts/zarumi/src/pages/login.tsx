import React, { useState } from 'react';
import { Redirect, Link } from 'wouter';
import { useAuth } from '@/components/auth-provider';
import { auth } from '@/lib/firebase';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';

export default function Login() {
  const { user, isLoading } = useAuth();
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (isLoading) return null;
  if (user) return <Redirect to="/" />;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isRegister) {
        await createUserWithEmailAndPassword(auth, email, password);
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Ocorreu um erro.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 z-0">
        <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-primary/20 rounded-full blur-[120px] opacity-50 mix-blend-screen" />
        <div className="absolute bottom-0 right-1/4 w-[600px] h-[600px] bg-red-900/20 rounded-full blur-[150px] opacity-50 mix-blend-screen" />
        <div className="absolute inset-0 bg-background/80 backdrop-blur-[2px]" />
      </div>

      <div className="relative z-10 w-full max-w-md p-6 sm:p-8 bg-zinc-950/80 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl">
        <Link href="/" className="flex flex-col items-center gap-3 mb-4 cursor-pointer">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary shadow-lg shadow-primary/30">
            <img src="/zarumi-icon.png" alt="Zarumi" className="h-8 w-8 object-contain" />
          </div>
          <span className="font-heading text-2xl font-black uppercase tracking-tight text-white">Zarumi</span>
        </Link>

        <h1 className="font-heading text-3xl font-black uppercase text-white mb-6 text-center">
          {isRegister ? 'Criar nova conta' : 'Entrar na sua conta'}
        </h1>

        <form onSubmit={handleSubmit} className="space-y-3">
          {error && (
            <div className="p-3 text-sm bg-destructive/10 border border-destructive/20 text-destructive rounded-md">
              {error}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="email" className="text-zinc-300">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="bg-white/5 border-white/10 focus-visible:ring-primary h-10"
              placeholder="seu@email.com"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password" className="text-zinc-300">Senha</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="bg-white/5 border-white/10 focus-visible:ring-primary h-10"
              placeholder="••••••••"
            />
          </div>

          <Button type="submit" className="w-full h-10 font-bold mt-6 bg-primary hover:bg-primary/90 text-white" disabled={loading}>
            {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : (isRegister ? 'Cadastrar' : 'Entrar')}
          </Button>
        </form>

        <div className="mt-6 text-center text-sm text-zinc-400">
          {isRegister ? 'Já tem uma conta?' : 'Ainda não tem conta?'}
          <button
            type="button"
            onClick={() => setIsRegister(!isRegister)}
            className="ml-2 font-medium text-primary hover:underline"
          >
            {isRegister ? 'Entrar agora' : 'Cadastre-se'}
          </button>
        </div>
      </div>
    </div>
  );
}
