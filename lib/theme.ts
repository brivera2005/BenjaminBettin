export type Theme = 'light' | 'dark';

export const THEME_STORAGE_KEY = 'benjamin-bettin-theme';

export function themeInitScript(): string {
  return `(function(){try{var t=localStorage.getItem(${JSON.stringify(THEME_STORAGE_KEY)});document.documentElement.classList.remove('light','dark');document.documentElement.classList.add(t==='light'?'light':'dark');}catch(e){document.documentElement.classList.add('dark');}})();`;
}
