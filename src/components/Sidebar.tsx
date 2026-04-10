'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useAuthStore } from '@/lib/store';
import {
  Search,
  Home,
  DollarSign,
  User,
  LogOut,
  LogIn,
  Briefcase,
  ClipboardList,
  Menu,
  X,
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { cn } from '@/lib/utils';
import { Button } from './ui/button';
import { BrandLogo } from './BrandLogo';

const SIDEBAR_W = 'w-56'; /* 224px */

export default function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuthStore();
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  const navItems = user
    ? [
        { name: 'Explore', href: '/', icon: Search },
        { name: 'Home', href: '/dashboard', icon: Home },
        { name: 'Jobs', href: '/jobs', icon: Briefcase },
        { name: 'Tasks', href: '/tasks', icon: ClipboardList },
        { name: 'Earnings', href: '/earnings', icon: DollarSign },
        { name: 'Profile', href: '/profile', icon: User },
      ]
    : [{ name: 'Explore', href: '/', icon: Search }];

  const NavInner = (
    <>
      <div className="flex h-14 shrink-0 items-center justify-between gap-2 border-b border-border px-3 md:px-4">
        <Link href="/" className="flex items-center gap-2" onClick={() => setMobileOpen(false)}>
          <BrandLogo size={24} />
          <span className="text-sm font-semibold tracking-tight text-foreground">2une</span>
        </Link>
        <button
          type="button"
          aria-label="Close menu"
          className="flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:bg-muted md:hidden"
          onClick={() => setMobileOpen(false)}
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <nav className="flex flex-1 flex-col gap-0.5 overflow-y-auto p-2">
        {navItems.map((item) => {
          const isActive =
            pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
          const Icon = item.icon;
          return (
            <Link
              key={item.name}
              href={item.href}
              onClick={() => setMobileOpen(false)}
              className={cn(
                'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-muted text-foreground'
                  : 'text-muted-foreground hover:bg-muted/70 hover:text-foreground'
              )}
            >
              <Icon className="h-4 w-4 shrink-0" strokeWidth={1.5} />
              {item.name}
            </Link>
          );
        })}
      </nav>

      <div className="shrink-0 border-t border-border p-3">
        {user ? (
          <div className="flex items-center gap-2">
            <Avatar className="h-8 w-8 border border-border">
              <AvatarImage src={user.avatar} alt={user.name} />
              <AvatarFallback>
                <User className="h-3.5 w-3.5" />
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-medium text-foreground">{user.name}</p>
              <p className="truncate text-[11px] text-muted-foreground">{user.email}</p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 shrink-0 text-muted-foreground hover:text-destructive"
              onClick={() => logout()}
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        ) : (
          <Link
            href="/login"
            onClick={() => setMobileOpen(false)}
            className="flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted/70 hover:text-foreground"
          >
            <LogIn className="h-4 w-4" strokeWidth={1.5} />
            Sign in
          </Link>
        )}
      </div>
    </>
  );

  return (
    <>
      <button
        type="button"
        aria-label="Open menu"
        className="fixed left-3 top-3 z-[60] flex h-9 w-9 items-center justify-center rounded-md border border-border bg-card md:hidden"
        onClick={() => setMobileOpen(true)}
      >
        <Menu className="h-4 w-4" />
      </button>

      {mobileOpen ? (
        <button
          type="button"
          aria-label="Close menu"
          className="fixed inset-0 z-[55] bg-foreground/20 md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      ) : null}

      <aside
        className={cn(
          'fixed left-0 top-0 z-[56] flex h-screen flex-col border-r border-border bg-card transition-transform duration-200 ease-out md:translate-x-0',
          SIDEBAR_W,
          mobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        )}
      >
        {NavInner}
      </aside>
    </>
  );
}
