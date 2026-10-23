'use client';

import { useThemeStore } from '@/stores/themeStore';

const palettes = [
  { id: 'teal', label: 'Deep Teal', color: '#0f766e' },
  { id: 'burgundy', label: 'Burgundy / Rose', color: '#881337' },
  { id: 'navy', label: 'Navy / Cyan', color: '#183153' },
  { id: 'cinematic', label: 'Cinematic Slate', color: '#536f91' },
  { id: 'saffron', label: 'Graphite / Saffron', color: '#f2b705' },
  { id: 'silver', label: 'Silver / Gold', color: '#c9a227' },
];

const buttonBase =
  'rounded-lg border px-3 py-2 text-sm transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary';

export function ThemePaletteControls() {
  const theme = useThemeStore((state) => state.theme);
  const palette = useThemeStore((state) => state.palette);
  const setTheme = useThemeStore((state) => state.setTheme);
  const setPalette = useThemeStore((state) => state.setPalette);

  return (
    <section
      aria-label="Developer theme controls"
      className="flex flex-wrap items-center gap-3 rounded-xl border border-border bg-surface-elevated p-4"
    >
      <div className="flex flex-wrap gap-2" aria-label="Color palette">
        {palettes.map((item) => (
          <button
            key={item.id}
            type="button"
            aria-pressed={palette === item.id}
            onClick={() => setPalette(item.id)}
            className={`${buttonBase} ${
              palette === item.id
                ? 'border-primary bg-primary text-primary-on'
                : 'border-border bg-surface text-text-primary hover:bg-surface-hover'
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      <div className="flex gap-2" aria-label="Color mode">
        {['light', 'dark'].map((mode) => (
          <button
            key={mode}
            type="button"
            aria-pressed={theme === mode}
            onClick={() => setTheme(mode)}
            className={`${buttonBase} ${
              theme === mode
                ? 'border-primary bg-primary text-primary-on'
                : 'border-border bg-surface text-text-primary hover:bg-surface-hover'
            }`}
          >
            {mode === 'light' ? 'Light' : 'Dark'}
          </button>
        ))}
      </div>
    </section>
  );
}
