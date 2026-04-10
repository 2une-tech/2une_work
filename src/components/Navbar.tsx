'use client';

import Link from 'next/link';
import { useAuthStore } from '@/lib/store';
import { Button } from './ui/button';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { User, LogOut, LayoutDashboard, Search } from 'lucide-react';
import { BrandLogo } from './BrandLogo';
import { useRouter } from 'next/navigation';

export default function Navbar() {
  const { user, logout } = useAuthStore();
  const router = useRouter();

  const handleLogout = async () => {
    await logout();
    router.push('/');
  };

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-14 items-center justify-between px-4">
        <Link href="/" className="flex items-center space-x-2">
          <BrandLogo size={22} />
          <span className="text-xl font-semibold tracking-tight text-foreground">2une</span>
        </Link>
        
        <div className="flex items-center space-x-4">
          <Link href="/" className="text-sm font-medium transition-colors hover:text-primary flex items-center gap-1 text-muted-foreground mr-4">
            <Search className="w-4 h-4" /> Explore Jobs
          </Link>
          
          {user ? (
            <div className="flex items-center space-x-4">
              {/* Added admin shortcut assuming Jane Developer is super admin or if we do an open panel */}
              <Link href="/admin" className="text-sm font-medium transition-colors hover:text-primary text-muted-foreground hidden sm:block">
                Admin
              </Link>
              <Link href="/dashboard" className="text-sm font-medium transition-colors hover:text-primary text-muted-foreground flex items-center gap-1 hidden sm:flex">
                <LayoutDashboard className="w-4 h-4" /> Dashboard
              </Link>
              <div className="flex items-center space-x-2 border-l border-border pl-4">
                <Link href="/profile">
                  <Avatar className="h-8 w-8 transition-transform hover:scale-105">
                    <AvatarImage src={user.avatar} alt={user.name} />
                    <AvatarFallback><User className="h-4 w-4" /></AvatarFallback>
                  </Avatar>
                </Link>
                <Button variant="ghost" size="sm" onClick={handleLogout} className="text-muted-foreground hover:text-destructive">
                  <LogOut className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex items-center space-x-2">
              <Link href="/login">
                <Button variant="ghost">Log in</Button>
              </Link>
              <Link href="/login">
                <Button>Sign up</Button>
              </Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
