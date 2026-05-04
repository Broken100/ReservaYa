import { useBusiness } from './useBusiness';

export const THEMES: Record<string, string> = {
  default: 'bg-dark-bg',
  ocean: 'bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900',
  forest: 'bg-gradient-to-br from-slate-900 via-emerald-950 to-slate-900',
  sunset: 'bg-gradient-to-br from-slate-900 via-orange-950 to-slate-900'
};

export const THEME_COLORS: Record<string, any> = {
  default: {
    bg: 'bg-blue-600',
    bgHover: 'hover:bg-blue-500',
    text: 'text-blue-500',
    textLight: 'text-blue-400',
    border: 'border-blue-500',
    borderSubtle: 'border-blue-500/20',
    bgSubtle: 'bg-blue-600/10',
    bgSubtleHover: 'hover:bg-blue-600/20',
    shadow: 'shadow-blue-500/20',
    shadowLg: 'shadow-blue-500/50'
  },
  ocean: {
    bg: 'bg-cyan-600',
    bgHover: 'hover:bg-cyan-500',
    text: 'text-cyan-500',
    textLight: 'text-cyan-400',
    border: 'border-cyan-500',
    borderSubtle: 'border-cyan-500/20',
    bgSubtle: 'bg-cyan-600/10',
    bgSubtleHover: 'hover:bg-cyan-600/20',
    shadow: 'shadow-cyan-500/20',
    shadowLg: 'shadow-cyan-500/50'
  },
  forest: {
    bg: 'bg-emerald-600',
    bgHover: 'hover:bg-emerald-500',
    text: 'text-emerald-500',
    textLight: 'text-emerald-400',
    border: 'border-emerald-500',
    borderSubtle: 'border-emerald-500/20',
    bgSubtle: 'bg-emerald-600/10',
    bgSubtleHover: 'hover:bg-emerald-600/20',
    shadow: 'shadow-emerald-500/20',
    shadowLg: 'shadow-emerald-500/50'
  },
  sunset: {
    bg: 'bg-orange-600',
    bgHover: 'hover:bg-orange-500',
    text: 'text-orange-500',
    textLight: 'text-orange-400',
    border: 'border-orange-500',
    borderSubtle: 'border-orange-500/20',
    bgSubtle: 'bg-orange-600/10',
    bgSubtleHover: 'hover:bg-orange-600/20',
    shadow: 'shadow-orange-500/20',
    shadow: 'shadow-orange-500/20',
    shadowLg: 'shadow-orange-500/50'
  }
};

export function useTheme() {
  const { business } = useBusiness();
  const theme = business?.settings?.theme || 'default';
  
  return {
    themeClass: THEMES[theme] || THEMES.default,
    tColor: THEME_COLORS[theme] || THEME_COLORS.default,
    isMinimal: false
  };
}
