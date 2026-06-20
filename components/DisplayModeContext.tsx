'use client';

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import {
  formatMoney,
  formatRunningTotal,
  formatWager as formatWagerDisplay,
  UNIT_SIZE,
  type MoneyDisplayMode,
} from '@/lib/betMath';

interface DisplayModeContextValue {
  units: boolean;
  toggleUnits: () => void;
  formatAmount: (dollars: number) => string;
  formatTotal: (dollars: number) => string;
  formatWager: (dollars: number) => string;
  unitSize: number;
}

const DisplayModeContext = createContext<DisplayModeContextValue | null>(null);

export function DisplayModeProvider({ children }: { children: ReactNode }) {
  const [units, setUnits] = useState(false);
  const toggleUnits = useCallback(() => setUnits((current) => !current), []);
  const mode: MoneyDisplayMode = units ? 'units' : 'dollars';

  const value = useMemo(
    () => ({
      units,
      toggleUnits,
      formatAmount: (dollars: number) => formatMoney(dollars, mode),
      formatTotal: (dollars: number) => formatRunningTotal(dollars, mode),
      formatWager: (dollars: number) => formatWagerDisplay(dollars, mode),
      unitSize: UNIT_SIZE,
    }),
    [units, toggleUnits, mode]
  );

  return (
    <DisplayModeContext.Provider value={value}>{children}</DisplayModeContext.Provider>
  );
}

export function useDisplayMode(): DisplayModeContextValue {
  const ctx = useContext(DisplayModeContext);
  if (!ctx) {
    throw new Error('useDisplayMode must be used within DisplayModeProvider');
  }
  return ctx;
}
