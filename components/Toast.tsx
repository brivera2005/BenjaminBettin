'use client';

import { useEffect } from 'react';
import { cn } from '@/lib/utils';

export type ToastTone = 'success' | 'error' | 'info';

interface ToastProps {
  message: string | null;
  tone?: ToastTone;
  onDismiss: () => void;
}

export function Toast({ message, tone = 'info', onDismiss }: ToastProps) {
  useEffect(() => {
    if (!message) return;
    const timer = setTimeout(onDismiss, 2800);
    return () => clearTimeout(timer);
  }, [message, onDismiss]);

  if (!message) return null;

  return (
    <div
      role="status"
      className={cn(
        'fixed bottom-4 left-1/2 z-50 max-w-[90vw] -translate-x-1/2 rounded-xl border px-4 py-2.5 text-center text-sm font-medium shadow-xl backdrop-blur-xl',
        tone === 'success' && 'border-emerald-500/30 bg-emerald-950/90 text-emerald-200',
        tone === 'error' && 'border-red-500/30 bg-red-950/90 text-red-200',
        tone === 'info' && 'border-violet-500/30 bg-stone-900/95 text-stone-200'
      )}
    >
      {message}
    </div>
  );
}
