'use client';

import { LogIn, LogOut, Loader2 } from 'lucide-react';
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
        {user.avatar_url && (
          <img
            src={user.avatar_url}
            alt=""
            className="w-8 h-8 rounded-full ring-2 ring-violet-500/30"
          />
        )}
        <span className="hidden sm:block text-sm text-stone-400 max-w-[140px] truncate">
          {user.name ?? user.email}
        </span>
        <button
          type="button"
          onClick={signOut}
          className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-stone-400 hover:text-white transition-colors px-3 py-2 rounded-lg hover:bg-white/5"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Sign Out</span>
        </button>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={signInWithGoogle}
      className="flex items-center gap-2 bg-white text-black text-xs font-bold uppercase tracking-wider px-5 py-2.5 rounded-full hover:bg-stone-200 transition-all shadow-lg shadow-white/10"
    >
      <LogIn className="w-3.5 h-3.5" />
      Google Sign In
    </button>
  );
}
