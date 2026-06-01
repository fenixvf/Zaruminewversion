import React, { useState } from 'react';
import { Link, useLocation } from 'wouter';
import { useAuth } from './auth-provider';
import { auth } from '@/lib/firebase';
import { signOut } from 'firebase/auth';
import { Search, Menu, LogOut, LayoutDashboard, Bookmark } from 'lucide-react';
import logoImg from '/zarumi-icon.png';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';

export function Navbar() {
  const { user, isAdmin } = useAuth();
  const [location, setLocation] = useLocation();
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setLocation(`/browse?q=${encodeURIComponent(searchQuery)}`);
    }
  };

  const handleSignOut = () => {
    signOut(auth);
    setLocation('/');
  };

  const NavLinks = () => (
    <>
      <Link href="/" className={`text-xs font-semibold uppercase tracking-widest transition-colors hover:text-white ${location === '/' ? 'text-white' : 'text-zinc-400'}`}>
        Início
      </Link>
      <Link href="/browse" className={`text-xs font-semibold uppercase tracking-widest transition-colors hover:text-white ${location.startsWith('/browse') ? 'text-white' : 'text-zinc-400'}`}>
        Explorar
      </Link>
      {user && (
        <Link href="/my-list" className={`text-xs font-semibold uppercase tracking-widest transition-colors hover:text-white ${location === '/my-list' ? 'text-white' : 'text-zinc-400'}`}>
          Minha Lista
        </Link>
      )}
    </>
  );

  return (
    <header className="sticky top-0 z-50 w-full border-b border-white/10 bg-background/80 backdrop-blur-md">
      <div className="container mx-auto px-3 md:px-6 flex h-12 items-center justify-between gap-4">
        <div className="flex items-center gap-6 md:gap-10">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Toggle Menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[240px] sm:w-[300px] border-r border-white/10 bg-background">
              <nav className="flex flex-col gap-4 mt-8">
                <NavLinks />
              </nav>
            </SheetContent>
          </Sheet>

          <Link href="/" className="flex items-center gap-2 transition-opacity hover:opacity-80">
            <img src={logoImg} alt="Zarumi" className="h-10 w-10 object-contain" />
            <span className="font-heading text-2xl font-black uppercase tracking-tight text-white">Zarumi</span>
          </Link>

          <nav className="hidden md:flex gap-6">
            <NavLinks />
          </nav>
        </div>

        <div className="flex items-center gap-4 flex-1 justify-end md:flex-none">
          <form onSubmit={handleSearch} className="hidden sm:flex relative w-full max-w-sm items-center">
            <Search className="absolute left-2.5 h-4 w-4 text-zinc-400" />
            <Input
              type="search"
              placeholder="Buscar animes..."
              className="h-8 w-full rounded-full bg-white/5 pl-9 pr-4 text-sm border-transparent focus-visible:ring-primary focus-visible:bg-white/10 transition-colors placeholder:text-zinc-500"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </form>

          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-9 w-9 rounded-full">
                  <Avatar className="h-9 w-9 border border-white/10">
                    <AvatarImage src={user.photoURL || undefined} alt={user.email || 'User'} />
                    <AvatarFallback className="bg-primary/20 text-primary">
                      {user.email?.charAt(0).toUpperCase() || 'U'}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56 bg-card border-white/10" align="end" forceMount>
                <div className="flex items-center justify-start gap-2 p-2">
                  <div className="flex flex-col space-y-1 leading-none">
                    <p className="font-medium text-sm text-white truncate">{user.email}</p>
                  </div>
                </div>
                <DropdownMenuSeparator className="bg-white/10" />
                <DropdownMenuItem asChild className="cursor-pointer">
                  <Link href="/my-list" className="flex w-full items-center">
                    <Bookmark className="mr-2 h-4 w-4" />
                    Minha Lista
                  </Link>
                </DropdownMenuItem>
                {isAdmin && (
                  <DropdownMenuItem asChild className="cursor-pointer">
                    <Link href="/admin" className="flex w-full items-center">
                      <LayoutDashboard className="mr-2 h-4 w-4" />
                      Painel Admin
                    </Link>
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator className="bg-white/10" />
                <DropdownMenuItem className="cursor-pointer text-destructive focus:bg-destructive/10 focus:text-destructive" onClick={handleSignOut}>
                  <LogOut className="mr-2 h-4 w-4" />
                  Sair
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button asChild variant="default" size="sm" className="rounded-full font-semibold px-6 bg-primary hover:bg-primary/90 text-white">
              <Link href="/login">Entrar</Link>
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
