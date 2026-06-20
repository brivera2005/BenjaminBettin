export const DEFAULT_TRACKER_NAME = "Benjamin Bettin'";

const STORAGE_KEY = 'benjamin-bettin-tracker-name';
const MAX_LENGTH = 48;

export function normalizeTrackerName(value: string | null | undefined): string | null {
  const trimmed = value?.trim() ?? '';
  if (!trimmed || trimmed === DEFAULT_TRACKER_NAME) return null;
  return trimmed.slice(0, MAX_LENGTH);
}

export function displayTrackerName(value: string | null | undefined): string {
  return normalizeTrackerName(value) ?? DEFAULT_TRACKER_NAME;
}

export function loadTrackerName(): string {
  if (typeof window === 'undefined') return DEFAULT_TRACKER_NAME;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_TRACKER_NAME;
    return displayTrackerName(raw);
  } catch {
    return DEFAULT_TRACKER_NAME;
  }
}

export function saveTrackerName(value: string | null | undefined): string {
  const display = displayTrackerName(value);
  if (typeof window === 'undefined') return display;
  try {
    const normalized = normalizeTrackerName(value);
    if (normalized) {
      localStorage.setItem(STORAGE_KEY, normalized);
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  } catch {
    // ignore quota errors
  }
  return display;
}
