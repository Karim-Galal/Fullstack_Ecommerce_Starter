# Frontend / Backend Integration

## Configuration

`frontend/.env.local`:

```
NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1
```

The API client falls back to the same URL when the variable is absent
(`frontend/src/services/api.js`).

## API client

`frontend/src/services/api.js` exports:

- `apiClient` - Axios instance with the API base URL, a 15 second timeout, and
  `withCredentials: true`.
- `api(path, options)` - request helper that adds `Accept-Language`, forwards the
  stored guest-cart token, handles `FormData`, and returns `null` for `204`.
- `csrf()` - requests `/sanctum/csrf-cookie` from the backend origin.
- `ApiError` / `normalizeApiError()` - normalized error shape used by feature
  services.

Behavior details:

- The active locale is read from the first path segment (`en` or `ar`) and sent
  as `Accept-Language`.
- Sanctum cookies are sent with every request. Axios `withXSRFToken` is enabled.
- `X-Guest-Cart` is read from `localStorage` (`guest-cart-token`) and attached
  when present. A token returned in the `X-Guest-Cart` response header is saved.
- Errors expose `kind` (`validation`, `unauthenticated`, `not_found`, `network`,
  `timeout`, etc.), `status`, `errors`, `data`, and `retryable`.

Feature services in `src/services/` use `api()` rather than calling Axios
directly:

- `catalog.js` - products, categories, collections, cart, shipping methods.
- `auth.js` - customer authentication.
- `customer.js` - profile, addresses, orders, notifications.
- `checkout.js` - checkout and payment.
- `admin.js` - admin resources.

## Public products

Endpoints used by the homepage, catalog, product detail, and collection pages:

```
GET {NEXT_PUBLIC_API_URL}/products
GET {NEXT_PUBLIC_API_URL}/products/{id-or-slug}
GET {NEXT_PUBLIC_API_URL}/categories
GET {NEXT_PUBLIC_API_URL}/collections
GET {NEXT_PUBLIC_API_URL}/collections/{slug}-{id}
```

Confirmed backend behavior:

- Public product responses contain **raw Eloquent models**, not
  `ProductResource`. The list is a raw Laravel paginator: `data`, `links`,
  `per_page`, `total`, `current_page`, `last_page`, `from`, `to`, `path`, and so
  on. There is **no** `meta` wrapper.
- Only active products are returned from the public product endpoints.
- `per_page` defaults to 20 and is capped at 100.
- Product fields include `id`, `slug`, `sku`, `category_id`, `price`, `stock`,
  `is_active`, `translations`, `images`, and `category`. Product detail also
  loads `category.translations`.
- Raw product images have `path`, `disk`, `variants`, `alt`, `sort_order`,
  `is_primary`, and `processing_status`. They do **not** have `url` or resolved
  variant URLs.
- Catalog image priority is `variants.card`, then `variants.detail`, then
  `url`, then `path`. `src/lib/product.js` resolves relative storage paths
  against the backend origin (`/storage/...`). Cart responses use
  `ProductResource`, whose image variants are already absolute URLs.
- If no image is available, `ProductCard` renders a token-based silver-ring
  fallback instead of a broken image.
- Price is displayed with `storeConfig.currency` (`EGP`).
- Stock drives the low-stock/out-of-stock badge.

### Storefront data flow

1. `NewArrivals` requests page 1 of the public listing and slices the first 8
   products for the homepage grid.
2. `CatalogPage` keeps search, category, collection, price, stock, sort, and page
   state in URL query parameters and requests the paginated API.
3. `ProductDetail` resolves `id` or `slug`, loads related products from the same
   category, and calls the cart API for add-to-cart.
4. `CategoriesPage`, `CollectionsPage`, and `CollectionDetail` load their public
   resources with loading, empty, and retry states.
5. Cart actions on the homepage, catalog, detail, collection, and wishlist pages
   call the server cart API and pass the response to `cartStore.setCart`.

No mock product data is injected. If the backend is unavailable, sections and
pages show localized error and retry states.

## Cart, checkout, and wishlist

- `GET /cart` returns `{ cart: null }` or a cart resource. Guest carts use the
  `X-Guest-Cart` token. `POST /cart/items`, `PATCH /cart/items/{item}`, and
  `DELETE /cart/items/{item}` are wired through `cartService`.
- `CheckoutPage` is authenticated-only. It loads the server cart and saved
  addresses, submits `POST /checkout` with `shipping_address`, `gateway`, and an
  optional `coupon_code`, then shows the created order.
- Checkout currently stops after order creation. Stripe/Paymob client-side
  payment confirmation is **not** implemented, so the UI describes payment
  confirmation as dependent on the selected gateway.
- The wishlist page uses the persisted local wishlist store. The backend
  wishlist endpoints are authenticated-only and return limited product data, so
  server wishlist synchronization is **not** implemented.

## Local state

- `src/stores/cartStore.js` - stores server cart responses for the new pages and
  persists items for the header count. The server cart is fetched and treated as
  the source of truth on cart and checkout pages.
- `src/stores/wishlistStore.js` - persisted local wishlist used by the header,
  product cards, and wishlist page.
- `src/stores/authStore.js` - customer session state.
- `src/stores/localeStore.js`, `src/stores/themeStore.js` - UI preferences.

Persisted local cart items are convenience state for the header until the server
cart is fetched. They must not be treated as the source of truth for orders.

## Route coverage

| Route | Status |
| --- | --- |
| `/` | Redirects to `/en` |
| `/en`, `/ar` | Storefront homepage |
| `/en/login`, `/ar/login` | Customer login |
| `/en/register`, `/ar/register` | Customer registration |
| `/en/admin/login` | Admin login (legacy styling) |
| `/en/design-system` | Internal component showcase |
| `/en/products` | Catalog with URL-synced filters and pagination |
| `/en/products/[identifier]` | Product detail by ID or slug |
| `/en/cart` | Server-backed cart |
| `/en/wishlist` | Local wishlist |
| `/en/categories` | Category listing |
| `/en/collections` | Collection listing |
| `/en/collections/[identifier]` | Collection detail (`{slug}-{id}`) |
| `/en/checkout` | Authenticated checkout |
| `/en/account` | Customer account overview |
| `/en/orders` | Authenticated order history |
| `/en/addresses` | Authenticated address management |
| Unknown localized URL | Localized 404 with `404` status |

Header, desktop/mobile navigation, footer, cart, account, and product links now
resolve to implemented routes.

## Error handling expectations

- Network failures and timeouts are retryable (`ApiError.retryable`).
- `422` responses expose field errors through `errors`.
- `401`/`419` indicate authentication or session problems; auth flows should
  redirect or refresh CSRF as appropriate.
- Feature components should show human-readable localized copy, not raw server
  messages, for known failure categories.

## Running the stack

1. Start the Laravel backend so it is reachable at the configured API URL.
2. In `frontend/`, run `npm run dev` (default port 3000).
3. Verify `/en` and `/ar`; product data appears only when the API and database
   are available.

The frontend build does not require the backend. Only client-side product
requests depend on it.

## Verification status

- `node node_modules/eslint/bin/eslint.js src` completes with 0 errors (12
  existing image/font warnings remain).
- `npm run build` succeeds with the backend offline. The build lists all new
  storefront routes, including product detail, cart, checkout, wishlist,
  categories, collections, account, orders, and addresses.
- A production-server smoke test returned `200` for the English and Arabic home,
  catalog, cart, checkout, wishlist, categories, collections, account, orders,
  and addresses routes; an unknown localized URL returned `404`.
- Live API behavior, guest-cart cookies, checkout/payment completion, responsive
  layout, and RTL rendering were not exercised because the backend was not
  reachable and no browser or screenshot tool is available in this environment.
