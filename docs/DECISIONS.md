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
- Customer enters at checkout (checkout integration not implemented yet)
- Usage limits, expiry dates
- Can be percentage or fixed amount discount
- Admin management endpoints implemented (list/show/create/update/soft delete)

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
Accepted and implemented. Both models exist with distinct responsibilities. Coupon admin CRUD (with `created_by` audit field, soft deletes, and product eligibility via `coupon_products`) is implemented. Coupons ARE applied at checkout (validated against product eligibility, usage limits, dates, minimum order). Coupons cannot be combined with active product offers on any cart item.

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

---

## ADR-010: Soft Deletes for Business Entities (2026-09-28)

### Decision
Implement Laravel Soft Deletes on selected business entities to preserve audit trail and historical data while keeping normal queries clean.

### Context
The application initially used hard deletes for all entities. However, several entities represent business records that must be preserved for audit, legal, or historical purposes even after "deletion" from the active catalog.

### Entities with Soft Deletes
| Entity | Reason |
|--------|--------|
| Product | Referenced by historical orders; must remain accessible for order history |
| Category | Hierarchical structure; products reference it; historical reference |
| Collection | Curated product groups; may need history |
| Offer | Promotional campaigns with historical value |
| Review | User-generated content with historical value |
| Order | Financial records; must be preserved for legal/accounting |
| Invoice | Legal/financial documents |
| Payment | Financial transaction records |
| User | Account history; orders/invoices reference it |
| Address | Order history references it |
| Coupon | Promotional records with usage/audit history (`created_by`); deactivation via `is_active` alone is not enough |

### Entities Without Soft Deletes
| Entity | Reason |
|--------|--------|
| CartItem | Session/temporary; no historical value |
| OrderItem | Already preserves historical snapshot (name, sku, unit_price, line_total) |
| Translation tables | Tied to parent entity lifecycle |
| Pivot tables (collection_product, offer_products, coupon_products, wishlists) | Simple relationships |
| Cart | Session/temporary |
| ShippingMethod | Deactivation via `is_active` is sufficient |
| PaymentWebhookEvents | Idempotency tracking |
| PushSubscription | Session-like, can be deleted |
| Notification | Notification system handles lifecycle |
| Invitation | Status field manages lifecycle |

### Entities With Soft Deletes (Added Later)
| Entity | Reason | Migration |
|--------|--------|-----------|
| ProductImage | Supports replacement workflow with 7-day cleanup retention | `2026_10_10_114422_add_processing_fields_to_product_images_table.php` |

### Behavior
- Normal Eloquent queries automatically exclude soft-deleted records
- Soft-deleted products/categories/offers do not appear in storefront catalog queries
- Historical records (Orders, OrderItems, Invoices, Payments, Reviews) maintain access to soft-deleted related records via `withTrashed()` on specific relationships
- The `destroy()` method in controllers performs soft delete via `$model->delete()`
- No hard delete or restore endpoints are exposed in the API

### Relationships with `withTrashed()`
- `OrderItem::product()` - Access product for historical order display
- `Order::user()` - Access user for order history
- `Invoice::order()` - Access order for invoice history
- `Payment::order()` - Access order for payment history
- `Review::product()` and `Review::user()` - Access deleted product/user for review history

### Status
Accepted and implemented. Migrations created, models updated, tests passing.

---

## ADR-011: Product Image Processing Pipeline (2026-10-10)

### Decision
Implement a complete product image processing pipeline with upload, WebP variant generation, replacement workflow, and scheduled cleanup.

### Context
Products need multiple images with different sizes for various UI contexts (thumbnails, cards, detail pages). Images must be optimized for web delivery.

### Design
- **Upload**: Accept JPG/PNG/WebP, max 10MB, max 5 per batch via `POST /admin/products/{product}/images`
- **Processing**: Async job (`ProcessProductImage`) creates WebP variants:
  - `thumbnail`: 300px width
  - `card`: 600px width
  - `detail`: 1200px width
  - Quality: 82%
- **Storage**: Originals in `products/{id}/originals/`, variants in `products/{id}/images/{image_id}/{variant}.webp`
- **Replacement**: `POST /admin/products/{product}/images/{image}/replace` - uploads new image, processes, swaps on success, schedules old for cleanup
- **Primary Image**: First ready image becomes primary; can be changed via PATCH
- **Deletion**: Soft delete image, schedule original + variants for 7-day cleanup via `product_image_cleanups` table
- **Cleanup Command**: `php artisan product-images:cleanup` runs daily, permanently deletes expired files

### Configuration (`config/product-images.php`)
```php
'disk' => env('PRODUCT_IMAGES_DISK', 'public'),
'max_upload_kb' => 10240,
'max_batch_size' => 5,
'retention_days' => 7,
'variants' => [
    'thumbnail' => 300,
    'card' => 600,
    'detail' => 1200,
],
'webp_quality' => 82,
```

### Dependencies
- **Intervention Image v3** for image processing
- **Database queue** for async processing

### Status
Accepted and implemented. Upload, processing, replacement, deletion, and cleanup all working with tests.


## ADR-012: Frontend Design System and Storefront Architecture (2026-10-11)

### Decision

Build the storefront using the existing Next.js App Router application, JavaScript/JSX, and Tailwind CSS v4.

Establish a reusable design system before implementing the main storefront pages. Keep the application a single-store ecommerce system.

### Context

The backend provides the core ecommerce APIs, while frontend development is beginning.

The frontend needs consistent visual styling, reusable layouts and components, localization, and a clear separation between public storefront pages and authenticated or administrative interfaces.

### Design Principles

- Inspect the existing frontend structure and dependencies before making changes.
- Reuse existing components, utilities, and conventions whenever appropriate.
- Use JavaScript/JSX only. Do not introduce TypeScript.
- Use Tailwind CSS v4 and follow the existing project configuration.
- Avoid unnecessary dependencies and premature abstractions.

### Design System

Define reusable design tokens for:

- Brand and semantic colors
- Typography and font scales
- Spacing and sizing
- Container and responsive layout behavior
- Border radii, borders, and shadows
- Component states, including hover, focus, disabled, loading, and error states

Build reusable UI components where they provide genuine consistency across the application.

The store's branding should be customizable for separate deployments without introducing multi-store architecture or unnecessary tenant management.

### Layouts and Access

Organize layouts and navigation according to the actual application requirements, including:

- Public storefront and guest experiences
- Authenticated customer experiences
- Staff and master-admin interfaces

Administrative navigation and actions must respect the existing backend authorization and permission system.

Frontend visibility is not a replacement for backend authorization.

### Localization and Direction

Support English and Arabic interfaces with the appropriate LTR and RTL layouts.

Use the existing localization approach where available. Avoid duplicating page implementations solely to support different languages.

### API Integration

Treat Laravel as the source of truth for business rules, authentication, authorization, validation, pricing, discounts, orders, and payment state.

Inspect existing API routes, Form Requests, Resources, authentication middleware, and response formats before integrating each feature.

Use Next.js Server and Client Components appropriately. Follow the existing Sanctum session, CSRF, cookie, and API-client conventions rather than introducing a conflicting authentication flow.

### Implementation Strategy

Develop incrementally:

1. Inspect and document the existing frontend structure.
2. Establish design tokens, global styles, fonts, and localization foundations.
3. Build shared layouts and UI primitives.
4. Implement storefront features using the existing APIs.
5. Implement authenticated customer and administrative interfaces.
6. Verify responsive behavior, accessibility, localization, and API error handling.

Do not rebuild backend functionality or modify unrelated backend features as part of frontend implementation.

### Status

Accepted as the guiding direction for frontend development. Individual implementation items must be verified as they are completed.