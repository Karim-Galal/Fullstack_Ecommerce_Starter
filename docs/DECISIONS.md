# Architecture Decision Records

## ADR-001: Single-Store Architecture (2026-09-25)

### Decision
The ecommerce application is a **single-store** application. The multi-store architecture present in the initial scaffold has been removed.

### Context
The initial repository scaffold included a comprehensive multi-store architecture:
- `stores` table with `store_id` foreign keys on all core tables
- `StoreContext` service resolving store from authenticated user or `X-Store-Slug` header
- All public API controllers requiring `X-Store-Slug` header
- Admin controllers scoping to `$request->user()->store_id`
- Policies checking `user->store_id === model->store_id`
- Invitation system scoped to stores
- Database seeder creating a single "Starter Store" from env vars

### Evidence Against Multi-Store Requirement
- **Zero documentation** mentioning multi-store, SaaS, marketplace, or multi-tenancy
- **No store provisioning API** - no endpoint to create stores
- **No store management UI** - no admin interface for stores
- **No billing/subscription system** for stores
- **Frontend completely lacks** store selection, switching, or `X-Store-Slug` header handling
- **No tests** for multi-store behavior
- **No git history** - repository was uncommitted initial state
- **Seeder creates exactly one store** from hardcoded env vars

### Consequences
**Removed:**
- `stores` table and `Store` model
- `StoreContext` service
- `store_id` columns from all tables (users, categories, products, carts, orders, payments, invitations, collections, coupons, shipping_methods, addresses)
- `X-Store-Slug` header requirement from public API routes
- Store-scoping in controllers, policies, and queries
- Store-based invitation logic (invitations now global)

**Simplified:**
- Migrations: single-store schema, unique constraints on slug/sku without store_id scope
- Models: removed store relationships, simplified fillable arrays
- Controllers: direct queries without store resolution
- Policies: authorization based on role/permissions only
- Routes: public endpoints work without store context
- Seeder: creates initial admin user directly

### Status
Accepted and implemented. The codebase now reflects a clean single-store architecture.

---

## ADR-002: Database Schema Split (2026-09-25)

### Decision
Split the monolithic `2026_09_06_000001_create_ecommerce_tables.php` migration into 18 focused migrations, one per table (or tightly coupled unit).

### Context
The original scaffold bundled all 18 ecommerce tables into a single migration file (~200 lines). This made schema changes difficult to track, review, and rollback selectively.

### Migration Structure
| Migration | Table | Dependencies |
|-----------|-------|--------------|
| `2026_09_06_000001` | categories | (self-referential parent_id) |
| `2026_09_06_000002` | category_translations | categories |
| `2026_09_06_000003` | collections | — |
| `2026_09_06_000004` | products | categories |
| `2026_09_06_000005` | product_translations | products |
| `2026_09_06_000006` | product_images | products |
| `2026_09_06_000007` | collection_product | collections, products |
| `2026_09_06_000008` | carts | users |
| `2026_09_06_000009` | cart_items | carts, products |
| `2026_09_06_000010` | addresses | users |
| `2026_09_06_000011` | shipping_methods | — |
| `2026_09_06_000012` | orders | users, shipping_methods |
| `2026_09_06_000013` | order_items | orders, products |
| `2026_09_06_000014` | payments | orders |
| `2026_09_06_000015` | coupons | — |
| `2026_09_06_000016` | reviews | products, users |
| `2026_09_06_000017` | wishlists | users, products |
| `2026_09_06_000018` | invitations | users |

### Consequences
- Clean migration history for future changes
- Each table can be rolled back independently
- Easier code review for schema changes
- Follows Laravel best practices

### Status
Accepted and implemented.

---

## ADR-003: Notification Infrastructure (2026-09-27)

### Decision
Use Laravel's standard `notifications` table and `Notifiable` trait. Do not create custom notification models or tables.

### Context
The application needs a notification foundation for:
1. Database/in-app notifications (immediate)
2. Realtime/broadcast notifications (future, optional)
3. Browser push notifications (future, optional)

### Design
- Run `php artisan make:notifications-table` to create standard Laravel notifications table
- User model uses `Illuminate\Notifications\Notifiable` trait
- `push_subscriptions` table created for Web Push foundation
- No custom Notification Eloquent model needed
- Delivery channels (database, broadcast, web push) are orthogonal to notification classes

### Push Subscriptions Schema
- `push_subscriptions` table with: user_id, endpoint, public_key, auth_token, content_encoding
- Matches Web Push protocol (VAPID)
- Unique constraint on (user_id, endpoint)
- No package installed yet - schema is protocol-standard

### Status
Accepted and implemented. Foundation ready; delivery channels to be implemented later.

---

## ADR-004: Wishlist as Pivot Table (2026-09-27)

### Decision
Use `belongsToMany` relationship for wishlist instead of a dedicated `Wishlist` Eloquent model.

### Context
The `wishlists` table is a simple pivot: `user_id`, `product_id`, timestamps, unique constraint.

### Reasoning
- No additional attributes on the pivot
- No domain behavior requiring a model
- `User::wishlist()` and `Product::wishlistedBy()` use `belongsToMany`
- Cleaner API: `$user->wishlist()->toggle($product)`

### Status
Accepted and implemented. No Wishlist model created.

---

## ADR-005: OfferProduct as Pivot (2026-09-27)

### Decision
Use `belongsToMany` for Offer↔Product relationship via `offer_products` pivot table. No `OfferProduct` Eloquent model.

### Context
The `offer_products` table is a pivot with only timestamps and unique constraint.

### Reasoning
- Same reasoning as wishlist
- Offer model has `products()` relationship via `belongsToMany(Product::class, 'offer_products')`
- Product model has `offers()` relationship via `belongsToMany(Offer::class, 'offer_products')`

### Status
Accepted and implemented. OfferProduct model removed.

---

## ADR-006: Offer Types (2026-09-27)

### Decision
Support three initial offer types in the `offers` table:
1. **percentage** - percentage discount (e.g., 10% off)
2. **fixed_price** - promotional selling price (e.g., $99 instead of $129)
3. **buy_x_get_y** - quantity-based (e.g., buy 2 get 1 free)

### Schema Support
- `type` (string): 'percentage' | 'fixed_price' | 'buy_x_get_y'
- `value` (decimal): percentage value OR fixed price amount
- `buy_quantity` (int): for buy_x_get_y
- `get_quantity` (int): for buy_x_get_y
- `starts_at` / `ends_at`: scheduling
- `is_active`: enable/disable

### Note
This is a simple promotion foundation. A full promotion engine (stacking, exclusivity, conditions) is NOT implemented. Future work.

### Status
Accepted and implemented. Models and migrations ready; business logic pending.

---

## ADR-007: Coupons vs Offers Separation (2026-09-27)

### Decision
Keep coupons and offers as separate concepts with separate tables.

### Coupons
- Code-based (e.g., "WELCOME10")
- Customer enters at checkout
- Usage limits, expiry dates
- Can be percentage or fixed amount discount

### Offers
- Product promotions (potentially automatic)
- Applied based on product/quantity rules
- Examples: percentage discount, promotional price, buy X get Y
- Managed by admins, not customer-entered

### Reasoning
- Different user flows (checkout code entry vs automatic application)
- Different admin management
- Different business logic
- Cleaner separation of concerns

### Status
Accepted and implemented. Both models exist with distinct responsibilities.

---

## ADR-008: Authentication Architecture (2026-09-27)

### Decision
Use Laravel Sanctum for both SPA (cookie/session) and mobile (personal access token) authentication. Do not install Breeze, Jetstream, or Fortify.

### Context
- Laravel 12 introduced new starter kits; Breeze/Jetstream no longer receiving updates
- No Blade authentication UI needed (headless API for Next.js)
- Need both SPA and mobile authentication on same API

### Design
- **Web (Next.js SPA)**: Sanctum SPA/session auth, HTTP-only cookies, CSRF token via `/sanctum/csrf-cookie`
- **Mobile**: Sanctum personal access tokens, Bearer token auth, token revocation
- **Same API** supports both via Sanctum guards
- **No Breeze/Fortify/Jetstream** - custom AuthController implemented
- **Google OAuth**: Laravel Socialite for Google authentication

### Custom Sanctum Middleware
- **EnsureFrontendRequestsAreStateful**: Custom middleware extending Sanctum's base
- Only starts session for SPA requests (not Bearer token requests)
- Skips session for requests with Bearer token
- Checks Origin/Referer headers for SPA detection

### Form Requests
Authentication validation organized in `app/Http/Requests/Auth/`:
- `RegisterRequest`
- `LoginRequest`
- `ForgotPasswordRequest`
- `ResetPasswordRequest`
- `VerifyEmailRequest`
- `TokenRequest`

### API Resources
- `UserResource`: Consistent user response format, wraps data in `data` key

### Google OAuth
- **Flow**: Redirect → Callback → Create/link user → Authenticate
- **Account Linking**: 
  - Existing Google ID → login existing user
  - Existing email → link Google ID to existing account
  - New email → create new user with verified email
- **Secure**: No automatic duplicate users, explicit linking rules

### Status
Accepted and implemented. All authentication features complete with tests.

---

## ADR-009: Custom Sanctum Middleware for SPA/Token Differentiation (2026-09-27)

### Decision
Create custom `EnsureFrontendRequestsAreStateful` middleware to only start sessions for SPA requests, not Bearer token requests.

### Problem
Sanctum's default `EnsureFrontendRequestsAreStateful` middleware tries to start a session for all API requests. For mobile API requests with Bearer tokens, this causes "Session store not set on request" errors in testing.

### Solution
Custom middleware extending Sanctum's base that only starts session for SPA requests:
- Skips session for requests with Bearer token
- Checks Origin/Referer headers for SPA detection
- Checks X-Requested-With header for AJAX requests

### Implementation
- Custom middleware: `App\Http\Middleware\EnsureFrontendRequestsAreStateful`
- Registered in `config/sanctum.php` middleware stack
- Replaces Sanctum's middleware via `bootstrap/app.php` middleware group override

### Status
Accepted and implemented. Tests pass for both SPA and token authentication.