
import { AppThemeId } from '../types';

export interface ThemeConfig {
  id: AppThemeId;
  name: string;
  accent: string;       // Tailwind text/bg color (e.g. indigo-600)
  accentHover: string;  // Hover state (e.g. indigo-700)
  accentLight: string;  // Subtle backgrounds (e.g. indigo-50)
  accentBorder: string; // Subtle borders (e.g. border-indigo-100)
  accentShadow: string; // Shadow color (e.g. shadow-indigo-100)
  radiusOuter: string;  // Main cards radius (e.g. rounded-[2.5rem])
  radiusInner: string;  // Buttons/small elements (e.g. rounded-xl)
  appBg: string;        // Overall background (e.g. bg-slate-50)
  sidebarBg: string;    // Sidebar color (e.g. bg-white)
  textColor: string;    // Main text (e.g. text-slate-800)
  mutedColor: string;   // Secondary text (e.g. text-slate-400)
  isDark?: boolean;     // Flag for dark themes
}

export const APP_THEMES: Record<AppThemeId, ThemeConfig> = {
  oceon: {
    id: 'oceon',
    name: 'Oceon (Original)',
    accent: 'indigo-600',
    accentHover: 'indigo-700',
    accentLight: 'indigo-50',
    accentBorder: 'border-indigo-100',
    accentShadow: 'shadow-indigo-100',
    radiusOuter: 'rounded-[2.5rem]',
    radiusInner: 'rounded-xl',
    appBg: 'bg-slate-50',
    sidebarBg: 'bg-white',
    textColor: 'text-slate-800',
    mutedColor: 'text-slate-400',
    isDark: false
  },
  forest: {
    id: 'forest',
    name: 'Emerald Forest',
    accent: 'emerald-600',
    accentHover: 'emerald-700',
    accentLight: 'emerald-50',
    accentBorder: 'border-emerald-100',
    accentShadow: 'shadow-emerald-100',
    radiusOuter: 'rounded-[3rem]',
    radiusInner: 'rounded-2xl',
    appBg: 'bg-emerald-50/20',
    sidebarBg: 'bg-white',
    textColor: 'text-slate-900',
    mutedColor: 'text-slate-500',
    isDark: false
  },
  midnight: {
    id: 'midnight',
    name: 'Midnight Crimson',
    accent: 'rose-600',
    accentHover: 'rose-700',
    accentLight: 'rose-950/30',
    accentBorder: 'border-rose-900/20',
    accentShadow: 'shadow-rose-900/10',
    radiusOuter: 'rounded-2xl',
    radiusInner: 'rounded-lg',
    appBg: 'bg-slate-950',
    sidebarBg: 'bg-slate-900',
    textColor: 'text-slate-100',
    mutedColor: 'text-slate-500',
    isDark: true
  }
};

/**
 * Returns the current theme config or the default one.
 */
export const getActiveTheme = (id?: AppThemeId): ThemeConfig => {
  return APP_THEMES[id || 'oceon'];
};
