import React from 'react';
import { Navbar } from './navbar';
import { AuthProvider } from './auth-provider';

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans selection:bg-primary/30 selection:text-white">
      <Navbar />
      <main className="flex-1 flex flex-col">
        {children}
      </main>
      <footer className="border-t border-white/10 py-4 bg-background/50 backdrop-blur">
        <div className="container mx-auto px-4 text-center">
          <p className="text-zinc-500 text-sm font-medium">
            &copy; {new Date().getFullYear()} Zarumi. Todos os direitos reservados.
          </p>
        </div>
      </footer>
    </div>
  );
}
