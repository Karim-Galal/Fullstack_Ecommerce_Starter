# Frontend Architecture

## Framework

- **Next.js 16.4** (App Router, Turbopack)
- **React 19**
- **Tailwind CSS 4** via PostCSS
- **next-intl 4** for routing and translations
- **Zustand 5** for client state
- **Axios** for API requests

All application code is JavaScript/JSX. There is no TypeScript in `src/`.

## Directory structure

```
frontend/
├── src/
│   ├── app/
│   │   ├── layout.jsx              # Root layout (no html/body)
│   │   ├── page.jsx                # Redirects / to /en
│   │   ├── not-found.jsx           # Localized global 404 (own html/body)
│   │   ├── robots.jsx, sitemap.jsx
│   │   ├── i18n/request.js         # next-intl request config
│   │   ├── [locale]/
│   │   │   ├── layout.jsx          # html/body, language, messages
│   │   │   ├── not-found.jsx       # Segment-level 404
│   │   │   ├── (storefront)/       # Storefront layout + homepage
│   │   │   ├── (customer-auth)/    # Login/register
│   │   │   ├── (dev)/              # Design system showcase
│   │   │   └── admin/              # Admin auth + panel shell
│   ├── components/
│   │   ├── storefront/             # Navbar, footer, navigation, cards
│   │   ├── storefront/home/        # Hero, new arrivals, craft story
│   │   ├── layout/                 # StorefrontLayout, AdminLayout
│   │   ├── ui/                     # Design-system primitives
│   │   ├── icons/                  # Icon component + registry
│   │   ├── auth/                   # Auth forms
│   │   └── providers/              # Theme provider
│   ├── config/store.js             # Branding, currency, contact
│   ├── lib/                        # Locale and message helpers
│   ├── services/                   # api.js + feature services
│   ├── stores/                     # Zustand stores
│   ├── styles/                     # Tailwind entry, tokens, base styles
│   └── translations/{en,ar}/       # Namespaced JSON messages
├── public/images/                  # Local SVG artwork
└── proxy.js                        # next-intl middleware (via src/proxy.js)
```

`middleware` was renamed to `proxy` in this Next.js version. The project uses
`src/proxy.js` with `localePrefix: 'always'`.

## Routing and i18n

- Every public route is prefixed: `/en/...`, `/ar/...`.
- `/` redirects to `/en`. Unprefixed paths are redirected by the proxy.
- `src/app/layout.jsx` only imports global styles, metadata, and the theme
  provider. The `<html lang dir>` element is rendered by
  `src/app/[locale]/layout.jsx`.
- Locale messages are loaded per request in `src/app/i18n/request.js`.
  `src/lib/messages.js` provides the same namespaces for the locale layout.
- Unknown localized URLs render `src/app/not-found.jsx`, which reads the active
  locale from the request header, renders its own document, and returns a real
  `404` with localized copy.
- RTL is handled with `dir="rtl"`, logical utilities, and the Cairo font for
  Arabic.

See `docs/DESIGN.md` for the visual system and `docs/FRONTEND_BACKEND_INTEGRATION.md`
for API behavior.

## Implemented pages

| Route | File | Notes |
| --- | --- | --- |
| `/` | `app/page.jsx` | Redirects to `/en` |
| `/[locale]` | `app/[locale]/(storefront)/page.jsx` | Homepage: hero, principles, live new arrivals, craft, CTA |
| `/[locale]/products` | `app/[locale]/(storefront)/products/page.jsx` | Catalog with URL-synced filters and pagination |
| `/[locale]/products/[identifier]` | `app/[locale]/(storefront)/products/[identifier]/page.jsx` | Product detail by ID or slug |
| `/[locale]/cart` | `app/[locale]/(storefront)/cart/page.jsx` | Server-backed cart |
| `/[locale]/checkout` | `app/[locale]/(storefront)/checkout/page.jsx` | Authenticated checkout |
| `/[locale]/wishlist` | `app/[locale]/(storefront)/wishlist/page.jsx` | Local wishlist |
| `/[locale]/categories` | `app/[locale]/(storefront)/categories/page.jsx` | Category listing |
| `/[locale]/collections` | `app/[locale]/(storefront)/collections/page.jsx` | Collection listing |
| `/[locale]/collections/[identifier]` | `app/[locale]/(storefront)/collections/[identifier]/page.jsx` | Collection detail |
| `/[locale]/account` | `app/[locale]/(storefront)/account/page.jsx` | Customer account overview |
| `/[locale]/orders` | `app/[locale]/(storefront)/orders/page.jsx` | Authenticated order history |
| `/[locale]/addresses` | `app/[locale]/(storefront)/addresses/page.jsx` | Authenticated address management |
| `/[locale]/login` | `app/[locale]/(customer-auth)/login/page.jsx` | Customer login |
| `/[locale]/register` | `app/[locale]/(customer-auth)/register/page.jsx` | Customer registration |
| `/[locale]/admin/login` | `app/[locale]/admin/(auth)/login/page.jsx` | Admin login (legacy styling) |
| `/[locale]/design-system` | `app/[locale]/(dev)/design-system/page.jsx` | Internal component showcase |
| `/[locale]/*` (unknown) | `app/not-found.jsx` | Localized branded 404 |

## API client

`src/services/api.js`:

- Axios instance with `NEXT_PUBLIC_API_URL`, 15 second timeout, and cookies
  enabled.
- Adds `Accept-Language` from the current path locale.
- Persists and forwards the guest cart token (`X-Guest-Cart`).
- Normalizes errors into `ApiError` with `kind`, `status`, `errors`, and
  `retryable`.
- Exposes `csrf()` for Sanctum cookie initialization.

Feature services: `auth.js`, `catalog.js`, `checkout.js`, `customer.js`, and
`admin.js`.

## State

- `authStore` - session user and auth actions.
- `cartStore` - stores server cart responses for the new pages and persists items
  for the header count. Cart and checkout pages fetch the server cart as the
  source of truth.
- `wishlistStore` - persisted local wishlist; used for the header, product cards,
  and wishlist page. Server wishlist synchronization is not implemented.
- `localeStore`, `themeStore` - UI preferences.

Checkout creates the order but does not yet complete Stripe/Paymob client-side
payment confirmation.

## Styling

- Entry point: `src/styles/index.css` (Tailwind, themes, base, components,
  utilities).
- Tokens: `src/styles/themes/default.css` (colors, surfaces, borders) and
  `src/styles/theme.css` (typography, spacing, radius, shadows, breakpoints).
- `@theme inline` maps semantic tokens to utilities such as `bg-primary`,
  `text-text-secondary`, `border-border`, and `text-accent`.
- Shared component classes (`.card`, `.shell`, etc.) live in
  `src/styles/components.css`.
- There is no `bg-brand-600` utility; use the semantic tokens.

## Environment

| Variable | Default | Purpose |
| --- | --- | --- |
| `NEXT_PUBLIC_API_URL` | `http://localhost:8000/api/v1` | Backend API base URL |

## Commands

```bash
cd frontend
npm install
npm run dev      # http://localhost:3000
npm run build
npm run start
npm run lint
```

## Verification

- `npm run lint` currently reports 0 errors and 7 warnings (legacy font loading
  and `<img>` usage warnings).
- `npm run build` passes.
- Production smoke checks: `/en` and `/ar` return `200`; unknown URLs return
  `404` with localized content and `dir="rtl"` for Arabic.
- A visual browser review is still required; this environment has no browser or
  screenshot tool.
