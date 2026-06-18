'use client';

import { Lock, Sparkles } from 'lucide-react';
import { AuthButton } from './AuthButton';

export function SignInPrompt({ feature = 'your data' }: { feature?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-24 px-6 text-center">
      <div className="w-16 h-16 rounded-2xl bg-violet-600/20 border border-violet-500/30 flex items-center justify-center mb-6">
        <Lock className="w-7 h-7 text-violet-400" />
      </div>
      <h2 className="text-2xl font-bold tracking-tight text-stone-100 mb-2">
        Sign in to access {feature}
      </h2>
      <p className="text-stone-500 text-sm max-w-md mb-8">
        Your bets are saved to your account and sync across devices.
      </p>
      <AuthButton />
    </div>
  );
}

export function EmptyState({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-20 px-6 text-center border border-dashed border-white/10 rounded-3xl bg-stone-900/20">
      <Sparkles className="w-8 h-8 text-violet-500/50 mb-4" />
      <h3 className="text-lg font-semibold text-stone-300 mb-1">{title}</h3>
      <p className="text-stone-500 text-sm max-w-sm">{description}</p>
    </div>
  );
}
