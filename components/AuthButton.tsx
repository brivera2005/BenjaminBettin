'use client';

import { LogIn, LogOut, Loader2 } from 'lucide-react';
import { ThemeToggle } from '@/components/ThemeToggle';
import { useAuth } from './AuthProvider';

export function AuthButton() {
  const { user, loading, signInWithGoogle, signOut } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-stone-500 text-sm">
        <Loader2 className="w-4 h-4 animate-spin" />
      </div>
    );
  }

  if (user) {
    return (
      <div className="flex items-center gap-3">
        <ThemeToggle />
        {user.avatar_url && (
          <img
            src={user.avatar_url}
            alt=""
            className="w-8 h-8 rounded-full ring-2 ring-violet-500/30"
          />
        )}
        <span className="hidden sm:block text-sm text-muted-foreground max-w-[140px] truncate">
          {user.name ?? user.email}
        </span>
        {user.premium && (
          <span className="hidden rounded-full border border-violet-500/30 bg-violet-500/15 px-2 py-0.5 text-[9px] font-bold uppercase tracking-widest text-violet-300 sm:inline">
            Premium
          </span>
        )}
        <button
          type="button"
          onClick={signOut}
          className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors px-3 py-2 rounded-lg hover:bg-hover"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Sign Out</span>
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3">
      <ThemeToggle />
      <button
        type="button"
        onClick={signInWithGoogle}
        className="flex items-center gap-2 bg-white text-black text-xs font-bold uppercase tracking-wider px-5 py-2.5 rounded-full hover:bg-stone-200 transition-all shadow-lg shadow-black/10"
      >
        <LogIn className="w-3.5 h-3.5" />
        Google Sign In
      </button>
    </div>
  );
}
