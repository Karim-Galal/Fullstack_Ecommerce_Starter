/**
 * Theme Registry
 * Centralized theme configuration and utilities.
 */

export const themes = {
  light: {
    name: 'light',
    label: 'Light',
    cssFile: '@/styles/themes/default.css',
  },
  dark: {
    name: 'dark',
    label: 'Dark',
    cssFile: '@/styles/themes/dark.css',
  },
};

export const themeNames = Object.keys(themes);
export const defaultTheme = 'light';

/**
 * Check if a theme is valid.
 */
export function isValidTheme(theme) {
  return themeNames.includes(theme);
}

/**
 * Get the theme label for display.
 */
export function getThemeLabel(theme) {
  return themes[theme]?.label || theme;
}

/**
 * Apply a theme by setting the data-theme attribute on the document root.
 * This is the single documented method for applying a theme.
 */
export function applyTheme(theme) {
  if (typeof document === 'undefined') return;

  const validTheme = isValidTheme(theme) ? theme : defaultTheme;
  document.documentElement.setAttribute('data-theme', validTheme);

  // Store in localStorage for persistence
  try {
    localStorage.setItem('theme', validTheme);
  } catch {
    // Ignore localStorage errors
  }
}

/**
 * Get the current theme from localStorage or system preference.
 */
export function getInitialTheme() {
  if (typeof window === 'undefined') return defaultTheme;

  try {
    const stored = localStorage.getItem('theme');
    if (stored && isValidTheme(stored)) return stored;
  } catch {
    // Ignore localStorage errors
  }

  // Fallback to system preference
  if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
    return 'dark';
  }

  return defaultTheme;
}

/**
 * Initialize theme on client side.
 * Call this in a useEffect or client-side layout.
 */
export function initTheme() {
  if (typeof window === 'undefined') return;

  const theme = getInitialTheme();
  applyTheme(theme);

  // Listen for system theme changes
  const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
  const handler = (e) => {
    try {
      const stored = localStorage.getItem('theme');
      if (!stored) {
        applyTheme(e.matches ? 'dark' : 'light');
      }
    } catch {
      // Ignore
    }
  };

  mediaQuery.addEventListener('change', handler);

  return () => mediaQuery.removeEventListener('change', handler);
}