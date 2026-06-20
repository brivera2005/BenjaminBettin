'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Pencil, Zap } from 'lucide-react';
import { useAuth } from '@/components/AuthProvider';
import {
  DEFAULT_TRACKER_NAME,
  displayTrackerName,
  loadTrackerName,
  saveTrackerName,
} from '@/lib/trackerName';

function renderTrackerTitle(name: string) {
  const trimmed = name.trim() || DEFAULT_TRACKER_NAME;
  const lastSpace = trimmed.lastIndexOf(' ');
  if (lastSpace <= 0) {
    return <span>{trimmed}</span>;
  }

  return (
    <>
      {trimmed.slice(0, lastSpace)}
      <span className="text-violet-500">{trimmed.slice(lastSpace)}</span>
    </>
  );
}

export function BrandMark() {
  const { user } = useAuth();
  const [trackerName, setTrackerName] = useState(DEFAULT_TRACKER_NAME);
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState(DEFAULT_TRACKER_NAME);
  const [hovered, setHovered] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const savingRef = useRef(false);

  useEffect(() => {
    setTrackerName(loadTrackerName());
  }, []);

  useEffect(() => {
    if (!user) return;

    if (user.tracker_name) {
      const next = displayTrackerName(user.tracker_name);
      setTrackerName(next);
      saveTrackerName(user.tracker_name);
      return;
    }

    const local = loadTrackerName();
    if (local === DEFAULT_TRACKER_NAME) return;

    setTrackerName(local);
    void fetch('/api/settings/tracker-name', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ trackerName: local }),
    });
  }, [user?.id, user?.tracker_name]);

  const persist = useCallback(
    async (value: string) => {
      if (savingRef.current) return;
      savingRef.current = true;

      const next = saveTrackerName(value);
      setTrackerName(next);
      setDraft(next);
      setIsEditing(false);

      if (user) {
        try {
          await fetch('/api/settings/tracker-name', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ trackerName: value }),
          });
        } catch {
          // local cache still updated
        }
      }

      savingRef.current = false;
    },
    [user]
  );

  const startEditing = useCallback(() => {
    setDraft(trackerName);
    setIsEditing(true);
  }, [trackerName]);

  useEffect(() => {
    if (!isEditing) return;
    inputRef.current?.focus();
    inputRef.current?.select();
  }, [isEditing]);

  const cancelEditing = useCallback(() => {
    setDraft(trackerName);
    setIsEditing(false);
  }, [trackerName]);

  return (
    <div className="flex min-w-0 items-center gap-2">
      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-violet-500/30 bg-gradient-to-br from-violet-600 to-violet-950 shadow-violet-900/20">
        <Zap className="h-3.5 w-3.5 text-white" />
      </div>
      <div className="min-w-0">
        {isEditing ? (
          <input
            ref={inputRef}
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            onBlur={() => void persist(draft)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                event.preventDefault();
                void persist(draft);
              }
              if (event.key === 'Escape') {
                event.preventDefault();
                cancelEditing();
              }
            }}
            maxLength={48}
            aria-label="Tracker name"
            className="w-full min-w-0 truncate rounded border border-violet-500/40 bg-surface-input px-1 py-0 text-sm font-black uppercase italic tracking-tighter text-foreground outline-none ring-violet-500/30 focus:ring-1 sm:text-base"
          />
        ) : (
          <button
            type="button"
            onClick={startEditing}
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
            title="Click to personalize your tracker name"
            className="group/title flex min-w-0 max-w-full items-center gap-1 rounded px-0.5 text-left transition hover:bg-hover"
          >
            <h1 className="truncate text-sm font-black uppercase italic tracking-tighter sm:text-base">
              {renderTrackerTitle(trackerName)}
            </h1>
            <Pencil
              className={`h-3 w-3 shrink-0 text-violet-400/70 transition ${
                hovered ? 'opacity-100' : 'opacity-0'
              }`}
              aria-hidden
            />
          </button>
        )}
        <p className="text-[8px] font-bold uppercase tracking-[0.15em] text-stone-600 sm:text-[9px]">
          Bet Tracker
        </p>
      </div>
    </div>
  );
}
