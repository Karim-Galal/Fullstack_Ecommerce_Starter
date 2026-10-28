/**
 * Development theme registry.
 * `mode` controls light/dark; `palette` controls the temporary brand identity.
 */

export const palettes = {
  teal: { name: 'teal', label: 'Deep Teal & Ivory' },
  burgundy: { name: 'burgundy', label: 'Burgundy & Champagne' },
  navy: { name: 'navy', label: 'Deep Navy & Copper' },
  cinematic: { name: 'cinematic', label: 'Cinematic Slate', color: '#536f91' },
  saffron: { name: 'saffron', label: 'Graphite / Saffron', color: '#f2b705' },
  silver: { name: 'silver', label: 'Silver / Gold', color: '#c9a227' },
};

export const paletteNames = Object.keys(palettes);
export const modes = ['light', 'dark'];
export const defaultPalette = 'silver';
export const defaultMode = 'light';

/* Backward-compatible exports for any existing imports. */
export const themes = {
  light: { name: 'light', label: 'Light', cssFile: '@/styles/themes/default.css' },
  dark: { name: 'dark', label: 'Dark', cssFile: '@/styles/themes/dark.css' },
};
export const themeNames = modes;
export const defaultTheme = defaultMode;

export function isValidPalette(palette) {
  return paletteNames.includes(palette);
}

export function isValidMode(mode) {
  return modes.includes(mode);
}

export function isValidTheme(theme) {
  return isValidMode(theme);
}

export function getPaletteLabel(palette) {
  return palettes[palette]?.label || palettes[defaultPalette].label;
}

export function getThemeLabel(theme) {
  return themes[theme]?.label || theme;
}

export function applyTheme(mode, palette) {
  if (typeof document === 'undefined') return;

  const root = document.documentElement;
  root.setAttribute('data-theme', isValidMode(mode) ? mode : defaultMode);
  root.setAttribute('data-palette', isValidPalette(palette) ? palette : defaultPalette);
}

/* Retained for compatibility; Zustand is the source of persisted settings. */
export function getInitialTheme() {
  if (typeof window === 'undefined') return defaultMode;

  try {
    const stored = localStorage.getItem('theme-storage');
    if (stored) {
      const parsed = JSON.parse(stored);
      if (isValidMode(parsed?.state?.theme)) return parsed.state.theme;
    }
    const legacy = localStorage.getItem('theme');
    if (isValidMode(legacy)) return legacy;
  } catch {
    // Ignore unavailable or malformed local storage.
  }

  return defaultMode;
}

export function initTheme() {
  if (typeof window === 'undefined') return;

  let mode = getInitialTheme();
  let palette = defaultPalette;

  try {
    const stored = localStorage.getItem('theme-storage');
    if (stored) {
      const parsed = JSON.parse(stored);
      if (isValidPalette(parsed?.state?.palette)) palette = parsed.state.palette;
    }
  } catch {
    // Ignore unavailable or malformed local storage.
  }

  applyTheme(mode, palette);
}
