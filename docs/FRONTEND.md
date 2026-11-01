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
| `/[locale]/admin/login` | `app/[locale]/admin/(auth)/login/page.jsx` | Admin-only login (no Google/registration) |
| `/[locale]/admin` | `app/[locale]/admin/(panel)/page.jsx` | Permission-aware admin dashboard |
| `/[locale]/admin/products` | `app/[locale]/admin/(panel)/products/page.jsx` | Product listing with search, filters, sorting, and pagination |
| `/[locale]/admin/products/new` | `app/[locale]/admin/(panel)/products/new/page.jsx` | Create product |
| `/[locale]/admin/products/[productId]/edit` | `app/[locale]/admin/(panel)/products/[productId]/edit/page.jsx` | Edit product, images, and translations |
| `/[locale]/admin/categories` | `app/[locale]/admin/(panel)/categories/page.jsx` | Category management |
| `/[locale]/admin/collections` | `app/[locale]/admin/(panel)/collections/page.jsx` | Collection management |
| `/[locale]/admin/orders` | `app/[locale]/admin/(panel)/orders/page.jsx` | Order listing with filters |
| `/[locale]/admin/orders/[orderId]` | `app/[locale]/admin/(panel)/orders/[orderId]/page.jsx` | Order detail and status transitions |
| `/[locale]/admin/payments` | `app/[locale]/admin/(panel)/payments/page.jsx` | Payment listing and refunds |
| `/[locale]/admin/invoices` | `app/[locale]/admin/(panel)/invoices/page.jsx` | Invoice listing |
| `/[locale]/admin/invoices/[invoiceId]` | `app/[locale]/admin/(panel)/invoices/[invoiceId]/page.jsx` | Invoice detail |
| `/[locale]/admin/coupons` | `app/[locale]/admin/(panel)/coupons/page.jsx` | Coupon management |
| `/[locale]/admin/offers` | `app/[locale]/admin/(panel)/offers/page.jsx` | Offer management |
| `/[locale]/admin/reviews` | `app/[locale]/admin/(panel)/reviews/page.jsx` | Review moderation |
| `/[locale]/admin/shipping-methods` | `app/[locale]/admin/(panel)/shipping-methods/page.jsx` | Shipping method management |
| `/[locale]/admin/users` | `app/[locale]/admin/(panel)/users/page.jsx` | User and staff management |
| `/[locale]/admin/invitations` | `app/[locale]/admin/(panel)/invitations/page.jsx` | Invitation management (master admin) |
| `/[locale]/admin/trash` | `app/[locale]/admin/(panel)/trash/page.jsx` | Restore/force-delete soft-deleted records |
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

- `authStore` - session user, session status, and auth actions. Persisted state
  is revalidated against `GET /auth/me` before admin access is granted.
- `cartStore` - stores server cart responses for the new pages and persists items
  for the header count. Cart and checkout pages fetch the server cart as the
  source of truth.
- `wishlistStore` - persisted local wishlist; used for the header, product cards,
  and wishlist page. Server wishlist synchronization is not implemented.
- `localeStore`, `themeStore` - UI preferences.

### Admin access

`components/auth/AdminGuard.jsx` wraps the `admin/(panel)` route group. It waits
for the client to mount, restores the Sanctum session with `authService.me()`,
and renders admin children only for an active `master_admin` or `staff` user.
Signed-out visitors are redirected to the locale-aware
`/[locale]/admin/login?callbackUrl=...`; authenticated customers are redirected
to the storefront. A `401` from `/auth/me` clears the local session, while
`403`, `422`, and network failures keep it and show a retry state.

The guard is a UX layer only. Laravel policies remain authoritative.

The panel now covers the supported admin modules: dashboard, products (with
create/edit, translations, stock, pricing, and image management), categories,
collections, orders (filters, detail, and safe status transitions), payments
(list, detail, and refunds), invoices, coupons, offers, reviews, shipping
methods, users/staff, invitations, and trash. Navigation, dashboard sections,
and page actions are gated by the same permission names the backend policies
enforce; the backend remains authoritative.

Shared admin building blocks live in `components/admin/shared` (page header,
responsive table with mobile cards, status badges, pagination/summary, product
picker) and `hooks/useAdminList.js` / `hooks/useAdminResource.js` (debounced
search, stale-request protection, pagination normalization, detail refresh).
`services/admin.js` centralizes every admin request and the permission option
list. Trash aggregates the per-resource `?trashed=1` listings, hides orders and
payments (financial history is not deletable), allows invoice restore but never
invoice force-delete, and applies resource-specific guard errors from the API.

Product and category slugs are generated by the backend from the English
translation; the forms do not expose a slug input. Product and category prices
use `formatProductPrice` and the store currency, while timestamps are formatted
through `src/lib/date.js` with short date, date/time, full date, and relative
modes.

Order cancellation is only offered for pending orders. The backend rejects
cancellation when a payment is already paid, and a late successful gateway
callback for a cancelled order records the payment as paid without confirming
the order or issuing an invoice, so staff can reconcile or refund it from
Payments.

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

- ESLint over the admin components, admin routes, shared hooks, `date.js`, and
  `services/admin.js` passes without errors. The full `npm run lint` still
  reports 2 pre-existing errors in the in-progress
  `src/components/storefront/catalog/CatalogPage.jsx` change, plus legacy font
  loading and `<img>` warnings.
- `npm run build` passes and generates 64 static pages, including every admin
  route (`/admin`, products, categories, collections, orders, payments,
  invoices, coupons, offers, reviews, shipping methods, users, invitations,
  trash) and the dynamic order/invoice/product detail routes.
- `lang` and `dir` are set by `app/[locale]/layout.jsx`, so `/ar/...` admin
  routes inherit RTL. Route smoke checks require a production server and, for
  authenticated views, a running backend with an active admin session.
- Unknown URLs return `404` with localized content and `dir="rtl"` for Arabic.
- A visual browser review is still required; this environment has no browser or
  screenshot tool.
