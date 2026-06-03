import React, { useState } from 'react';
import { Link, useLocation } from 'wouter';
import { useAuth } from './auth-provider';
import { auth } from '@/lib/firebase';
import { signOut } from 'firebase/auth';
import {
  Search, Menu, LogOut, LayoutDashboard, Bookmark,
  Home, Compass, X, ChevronRight,
} from 'lucide-react';
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
import { Sheet, SheetClose, SheetContent, SheetTrigger } from '@/components/ui/sheet';

const navItems = [
  { href: '/', label: 'Início', icon: Home, match: (loc: string) => loc === '/' },
  { href: '/browse', label: 'Explorar', icon: Compass, match: (loc: string) => loc.startsWith('/browse') },
];

const authNavItems = [
  { href: '/my-list', label: 'Minha Lista', icon: Bookmark, match: (loc: string) => loc === '/my-list' },
];

export function Navbar() {
  const { user, isAdmin } = useAuth();
  const [location, setLocation] = useLocation();
  const [searchQuery, setSearchQuery] = useState('');
  const [mobileSearchQuery, setMobileSearchQuery] = useState('');
  const [sheetOpen, setSheetOpen] = useState(false);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setLocation(`/browse?q=${encodeURIComponent(searchQuery)}`);
    }
  };

  const handleMobileSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (mobileSearchQuery.trim()) {
      setLocation(`/browse?q=${encodeURIComponent(mobileSearchQuery)}`);
      setSheetOpen(false);
    }
  };

  const handleSignOut = () => {
    signOut(auth);
    setLocation('/');
    setSheetOpen(false);
  };

  const allNavItems = [
    ...navItems,
    ...(user ? authNavItems : []),
  ];

  const DesktopNavLinks = () => (
    <>
      {navItems.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className={`text-xs font-semibold uppercase tracking-widest transition-colors hover:text-white ${
            item.match(location) ? 'text-white' : 'text-zinc-400'
          }`}
        >
          {item.label}
        </Link>
      ))}
      {user && (
        <Link
          href="/my-list"
          className={`text-xs font-semibold uppercase tracking-widest transition-colors hover:text-white ${
            location === '/my-list' ? 'text-white' : 'text-zinc-400'
          }`}
        >
          Minha Lista
        </Link>
      )}
    </>
  );

  return (
    <header className="sticky top-0 z-50 w-full border-b border-white/10 bg-background/80 backdrop-blur-md">
      <div className="container mx-auto px-3 md:px-6 flex h-12 items-center justify-between gap-4">
        <div className="flex items-center gap-6 md:gap-10">
          <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden h-9 w-9 rounded-full hover:bg-white/10">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Abrir Menu</span>
              </Button>
            </SheetTrigger>

            <SheetContent
              side="left"
              className="w-[280px] p-0 border-r border-white/10 bg-zinc-950 flex flex-col overflow-hidden [&>button]:hidden"
            >
              <div className="absolute inset-0 pointer-events-none">
                <div className="absolute top-0 left-0 right-0 h-48 bg-gradient-to-b from-primary/10 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-black/40 to-transparent" />
              </div>

              <div className="relative z-10 flex flex-col h-full">
                <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-white/10">
                  <Link href="/" onClick={() => setSheetOpen(false)} className="flex items-center gap-2.5 transition-opacity hover:opacity-80">
                    <img src={logoImg} alt="Zarumi" className="h-8 w-8 object-contain" />
                    <span className="font-heading text-xl font-black uppercase tracking-tight text-white">Zarumi</span>
                  </Link>
                  <SheetClose className="h-8 w-8 flex items-center justify-center rounded-full text-zinc-400 hover:text-white hover:bg-white/10 transition-colors">
                    <X className="h-4 w-4" />
                    <span className="sr-only">Fechar</span>
                  </SheetClose>
                </div>

                <form onSubmit={handleMobileSearch} className="relative mx-4 mt-4">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-500 pointer-events-none" />
                  <Input
                    type="search"
                    placeholder="Buscar animes..."
                    className="h-9 w-full rounded-full bg-white/5 pl-9 pr-4 text-sm border border-white/10 focus-visible:ring-primary focus-visible:bg-white/8 placeholder:text-zinc-500 transition-colors"
                    value={mobileSearchQuery}
                    onChange={(e) => setMobileSearchQuery(e.target.value)}
                  />
                </form>

                <nav className="flex flex-col gap-1 px-3 mt-5 flex-1">
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-zinc-600 px-3 mb-1">Navegação</p>
                  {allNavItems.map((item) => {
                    const isActive = item.match(location);
                    const Icon = item.icon;
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setSheetOpen(false)}
                        className={`group flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl transition-all duration-150 ${
                          isActive
                            ? 'bg-primary/15 text-white'
                            : 'text-zinc-400 hover:text-white hover:bg-white/5'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`flex items-center justify-center h-8 w-8 rounded-lg transition-colors ${
                            isActive ? 'bg-primary/25 text-primary' : 'bg-white/5 text-zinc-500 group-hover:bg-white/10 group-hover:text-zinc-300'
                          }`}>
                            <Icon className="h-4 w-4" />
                          </div>
                          <span className="text-sm font-medium">{item.label}</span>
                        </div>
                        {isActive && <ChevronRight className="h-3.5 w-3.5 text-primary/70" />}
                      </Link>
                    );
                  })}

                  {isAdmin && (
                    <>
                      <p className="text-[10px] font-semibold uppercase tracking-widest text-zinc-600 px-3 mt-4 mb-1">Admin</p>
                      <Link
                        href="/admin"
                        onClick={() => setSheetOpen(false)}
                        className={`group flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl transition-all duration-150 ${
                          location.startsWith('/admin')
                            ? 'bg-primary/15 text-white'
                            : 'text-zinc-400 hover:text-white hover:bg-white/5'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`flex items-center justify-center h-8 w-8 rounded-lg transition-colors ${
                            location.startsWith('/admin') ? 'bg-primary/25 text-primary' : 'bg-white/5 text-zinc-500 group-hover:bg-white/10 group-hover:text-zinc-300'
                          }`}>
                            <LayoutDashboard className="h-4 w-4" />
                          </div>
                          <span className="text-sm font-medium">Painel Admin</span>
                        </div>
                        {location.startsWith('/admin') && <ChevronRight className="h-3.5 w-3.5 text-primary/70" />}
                      </Link>
                    </>
                  )}
                </nav>

                <div className="relative px-4 pb-6 pt-3 border-t border-white/10 mt-2">
                  {user ? (
                    <div className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/8">
                      <Avatar className="h-9 w-9 border border-white/15 flex-shrink-0">
                        <AvatarImage src={user.photoURL || undefined} alt={user.email || 'User'} />
                        <AvatarFallback className="bg-primary/20 text-primary text-sm font-semibold">
                          {user.email?.charAt(0).toUpperCase() || 'U'}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-white truncate">{user.email}</p>
                        <p className="text-[10px] text-zinc-500 mt-0.5">Conta conectada</p>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={handleSignOut}
                        className="h-8 w-8 rounded-lg text-zinc-500 hover:text-red-400 hover:bg-red-500/10 flex-shrink-0"
                        title="Sair"
                      >
                        <LogOut className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  ) : (
                    <Button
                      asChild
                      className="w-full rounded-xl bg-primary hover:bg-primary/90 text-white font-semibold"
                      onClick={() => setSheetOpen(false)}
                    >
                      <Link href="/login">Entrar na conta</Link>
                    </Button>
                  )}
                </div>
              </div>
            </SheetContent>
          </Sheet>

          <Link href="/" className="flex items-center gap-2 transition-opacity hover:opacity-80">
            <img src={logoImg} alt="Zarumi" className="h-10 w-10 object-contain" />
            <span className="font-heading text-2xl font-black uppercase tracking-tight text-white">Zarumi</span>
          </Link>

          <nav className="hidden md:flex gap-6">
            <DesktopNavLinks />
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
