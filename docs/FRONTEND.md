# Frontend Architecture

## Framework
- **Next.js 16** (App Router)
- **React 19**
- **Tailwind CSS 4** (via PostCSS)

## Directory Structure
```
frontend/
├── src/
│   ├── app/
│   │   ├── [locale]/          # i18n routing (empty)
│   │   ├── admin/
│   │   │   └── login/         # Empty directory
│   │   ├── products/
│   │   │   └── [identifier]/  # Empty directory
│   │   ├── globals.css        # Tailwind imports
│   │   ├── layout.js          # Root layout
│   │   ├── page.js            # Home page
│   │   ├── robots.js
│   │   └── sitemap.js
│   ├── config/                # Empty
│   ├── locales/               # Empty
│   ├── services/
│   │   └── api.js             # Fetch-based API client
│   └── styles/
│       ├── index.css          # Main entry
│       ├── base.css
│       ├── components.css
│       ├── foundation.css
│       ├── utilities.css
│       ├── animations.css
│       └── themes/
│           └── default.css
├── public/
├── package.json
├── next.config.mjs
├── eslint.config.mjs
├── postcss.config.mjs
└── jsconfig.json
```

## API Client (`src/services/api.js`)
```javascript
const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";
const backendUrl = apiUrl.replace(/\/api\/v1$/, "");

export async function csrf() {
  await fetch(`${backendUrl}/sanctum/csrf-cookie`, { credentials: "include" });
}

export async function api(path, options = {}) {
  const r = await fetch(`${apiUrl}${path}`, {
    credentials: "include",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      ...options.headers,
    },
    ...options,
  });
  if (!r.ok) throw new Error((await r.json().catch(() => ({ message: "Request failed" }))).message);
  return r.status === 204 ? null : r.json();
}
```
- **No Axios** - uses native fetch
- **Credentials included** for Sanctum session cookies
- **CSRF handling** via separate `csrf()` call
- **Error handling** - throws with server message

## Styling
- Tailwind CSS 4 via PostCSS plugin
- CSS variables for theming in `themes/default.css`
- Component classes in `components.css`
- Utility classes in `utilities.css`

## Internationalization
- Route structure: `/[locale]/...` (e.g., `/en/products`, `/ar/products`)
- Locale directories exist but empty
- Navbar links to `/ar` for Arabic

## Current Pages
| Route | File | Status |
|-------|------|--------|
| `/` | `app/page.js` | ✅ Basic home page |
| `/products` | `app/products/page.js` | ❌ Missing |
| `/products/[identifier]` | `app/products/[identifier]/page.js` | ❌ Missing |
| `/admin/login` | `app/admin/login/page.js` | ❌ Missing |
| `/[locale]/...` | `app/[locale]/...` | ❌ Empty |

## Environment Variables
| Variable | Default | Description |
|----------|---------|-------------|
| `NEXT_PUBLIC_API_URL` | `http://localhost:8000/api/v1` | Backend API base URL |

## Development
```bash
cd frontend
npm install
npm run dev          # Starts on localhost:3000
npm run build        # Production build
npm run start        # Production server
npm run lint         # ESLint
```

## Integration Points
- **CSRF**: Call `csrf()` before first POST/PUT/PATCH/DELETE
- **Auth**: Cookies handled automatically via `credentials: "include"`
- **Guest Cart**: `X-Guest-Cart` header returned on cart operations, must be sent on subsequent requests
- **Errors**: API client throws with message, catch and display

## Future Work (Not Started)
- Product listing page with category filtering
- Product detail page with images, translations
- Cart page with quantity updates
- Checkout form with shipping address
- Payment integration (Stripe.js, Paymob)
- User authentication pages (login, register, password reset)
- Admin dashboard (products, categories, orders, invitations)
- RTL support for Arabic