# Storefront Design

## Direction

The storefront uses a restrained "modern silver luxury" direction: warm ivory
surfaces, charcoal ink, generous whitespace, thin borders, and a champagne accent
used sparingly. Dark surfaces are reserved for the hero and other moments that
need contrast, rather than being the default background.

The design is intentionally editorial rather than decorative. Typography,
spacing, and photography should carry the page; there are no gradient badges,
heavy shadows, or ornamental dividers.

## Branding

Branding comes from `frontend/src/config/store.js` (`storeConfig`). Shared
components must not hard-code the brand name.

| Field | Value |
| --- | --- |
| Name | LUMA SILVER |
| Tagline | Everyday elegance, crafted in silver. |
| Currency | EGP |
| Locales | `en`, `ar` |

Metadata titles and descriptions in `src/app/layout.jsx` and
`src/app/[locale]/layout.jsx` read from `storeConfig`. Authentication pages still
contain some legacy "Commerce Starter" copy; updating those pages is tracked as
follow-up work.

## Typography

- Latin: Inter (400-800), loaded from Google Fonts in the locale layout.
- Arabic: Tajawal (400-700), applied through `[dir="rtl"] body` and
  `--font-sans-arabic`.
- Display headings use normal or medium weight and tight tracking; body copy uses
  relaxed line height and muted ink.
- Eyebrow labels use small uppercase type with wide tracking. Arabic navigation
  uses a slightly larger, non-uppercase treatment because letter-spacing
  uppercase styling does not suit Arabic script.
- Tokens live in `src/styles/theme.css` (`--font-sans`, `--font-display`,
  `--tracking-eyebrow`, `--tracking-display`).

## Color

All colors are CSS variables in `src/styles/themes/default.css` and are exposed
as Tailwind utilities through `@theme inline` in `src/styles/theme.css`.

| Role | Token | Value | Common utilities |
| --- | --- | --- | --- |
| Page surface | `--color-surface` | `#f7f4ef` | `bg-surface` |
| Raised surface | `--color-surface-elevated` | `#ffffff` | `bg-surface-elevated` |
| Sunken surface | `--color-surface-sunken` | `#efebe5` | `bg-surface-sunken` |
| Primary ink | `--color-brand` | `#202020` | `bg-primary`, `text-primary` |
| Primary hover | `--color-brand-hover` | `#383838` | `hover:bg-primary-hover` |
| Champagne accent | `--color-accent` | `#a5824a` | `text-accent` |
| Accent wash | `--color-accent-light` | `#f4ecdd` | `bg-accent-light` |
| Muted text | `--color-ink-muted` | `#6b6760` | `text-text-secondary` |
| Subtle text | `--color-ink-subtle` | `#928d85` | `text-text-tertiary` |
| Border | `--color-border` | `#e1ddd6` | `border-border` |
| Strong border | `--color-border-strong` | `#c7c1b8` | `border-border-strong` |

Important: `bg-brand-600` is not a semantic utility in this project. Use
`bg-primary`, `text-primary-on`, `text-accent`, and the surface tokens instead.

## Layout

- `.shell` caps content at `--shell-max-width` (80rem) with responsive horizontal
  padding.
- The header is sticky, translucent (`bg-surface/90` with backdrop blur), and
  16/20 units tall (`min-h-16 lg:min-h-20`).
- Page sections use generous vertical rhythm (`py-16` to `py-24`) and a
  three-column principles grid on desktop.
- Cards use the existing `card` component styles plus token-based radius and
  borders. Product media uses a 4:5 portrait frame.

## Homepage

`src/app/[locale]/(storefront)/page.jsx` composes:

1. `HomeHero` - dark split hero with a local silver artwork, eyebrow, display
   headline, short description, two calls to action, and a small collection note.
2. Three principles - numbered, typographic, no icons.
3. `NewArrivals` - live product grid from the public catalog API (eight items).
4. `CraftStory` - ivory editorial split with the craft artwork and a catalog CTA.
5. Closing CTA - dark band with links to new arrivals and account registration.

All copy is in the `home` namespace
(`src/translations/{en,ar}/home.json`). No production data is mocked.

### New arrivals states

- Loading: card skeletons while the request is in flight.
- Ready: product cards, each with cart and wishlist controls. Cart actions call
  the server cart API; wishlist remains local.
- Empty: "New pieces are on their way" empty state.
- Error: designed error panel with a retry action. The backend being offline is a
  supported state, not a blank section.

## Header and footer

- The wordmark is split into a lead and remainder from `storeConfig.name`, with
  the remainder in the champagne accent on hover.
- Desktop navigation: Home, New Arrivals, Our Craft, Shop, Categories,
  Collections. New Arrivals and Our Craft link to home-page anchors.
- Mobile navigation is a portal drawer with `role="dialog"`, Escape handling,
  body scroll lock, and an `id` wired through `aria-controls`.
- The footer contains brand copy, explore/account links, optional contact details
  from `storeConfig.contact`, a language switcher, and the copyright line.

## Language and direction

- `src/proxy.js` runs next-intl middleware with `localePrefix: 'always'`.
- The `<html>` element with `lang` and `dir` is rendered by
  `src/app/[locale]/layout.jsx`, not the root layout.
- Use logical utilities (`ms-*`, `me-*`, `start-*`, `end-*`) or `rtl:` variants
  for direction-sensitive spacing. Directional icons rotate with
  `rtl:rotate-180` where needed.
- Arabic uses Tajawal and avoids uppercase/large tracking treatments.

## 404 behavior

- Unknown URLs under a locale render `src/app/not-found.jsx`. It is an async
  server component that reads the active locale from the next-intl request
  header, renders its own `<html lang dir>`, and returns a real `404` status with
  localized copy and a home link.
- `src/app/[locale]/not-found.jsx` is available for `notFound()` thrown inside a
  matched locale route (for example, a future invalid product slug).
- Attempting to deliver every unknown URL through a catch-all page that calls
  `notFound()` produced a client-only error shell. The current approach keeps the
  404 server-rendered and correctly localized.

## Imagery

There is no product photography in the repository yet. Two original SVG
placeholders provide art direction without external URLs:

- `public/images/hero-silver.svg` (1000x1200) - dark hero composition of rings
  and a chain.
- `public/images/craft-silver.svg` (900x1100) - ivory close-up of a ring.

Replace these with real men's silver jewelry photography when available:

- Hero: portrait or square, dark/neutral background, 2:3 or 4:5 crop.
- Craft: portrait, soft ivory/neutral background, 4:5 crop.
- Product cards: consistent 4:5 images on a neutral background.

Keep the same aspect ratios and alt-text conventions so the layout does not
shift. Product imagery from the API uses the `variants.card` URL when present,
then `variants.detail`, then the original URL.

## Motion and accessibility

- Transitions are limited to color, opacity, and transform with short durations.
- Focus is visible through the global `:focus-visible` outline and component
  focus rings.
- Controls have accessible names; the mobile drawer closes on Escape and traps
  background scrolling while open.
- Decorative artwork has meaningful alt text; decorative separators are hidden
  from assistive technology.

## Verification

- `npm run lint`: 0 errors, 7 warnings (legacy font-loading and `<img>` usage
  warnings).
- `npm run build`: passes (Next.js 16.4.2, Turbopack).
- Production server smoke checks: `/en` and `/ar` return `200`; unknown URLs
  return localized `404` with `dir="rtl"` for Arabic.
- Visual review in a browser is still required; the implementation environment
  has no browser or screenshot tool.
