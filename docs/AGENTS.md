# Project: Fullstack Ecommerce Starter

## Project Purpose
A single-store ecommerce application with Laravel 12 API backend and Next.js 16 frontend. Provides product catalog, cart, checkout, payments (Stripe/Paymob), and admin management.

## Current Architecture
- **Backend**: Laravel 12, Sanctum SPA authentication, MySQL database
- **Frontend**: Next.js 16 (App Router), React 19, Tailwind CSS 4
- **API**: RESTful JSON API at `/api/v1/*`
- **Authentication**: Sanctum session cookies for web, personal access tokens for mobile

## Backend/Frontend Boundaries

- Laravel exposes the backend API under `/api/v1/`.
- The frontend consumes the Laravel API using the existing Fetch-based API client where appropriate.
- The frontend must not duplicate authoritative backend business logic.
- Laravel remains responsible for authentication, authorization, validation, product availability, stock, pricing, discounts, shipping calculations, order creation, and payment state.
- Next.js Server Components and Client Components may be used where appropriate.
- Do not assume that all backend data must be fetched on the client or that server-side data fetching is always appropriate.
- Before implementing server-side API fetching, inspect the authentication model, cookie forwarding requirements, CSRF protection, and environment configuration.
- Sanctum stateful domains and CORS settings must match the actual deployment configuration.
- Never expose backend secrets or private credentials to browser code.


## Implementation State (Post-Refactor)
- **Database**: Single-store schema (no store_id columns)
- **Models**: User, Product, Category, Collection, Cart, Order, Payment, Invitation, Invoice, Offer, Coupon, Review, PushSubscription, ProductImage, ProductImageCleanup, Address, ShippingMethod, etc.
- **Controllers**: Auth, Product, Category, Collection, Cart, Checkout, PaymentWebhook, Payment, Invitation, GoogleAuth, Coupon, Review, Wishlist, Address, ShippingMethod, User, Order, ProductImage, Offer
- **Policies**: ProductPolicy, CategoryPolicy, CollectionPolicy, CouponPolicy, UserPolicy, OfferPolicy, ReviewPolicy, InvitationPolicy, AddressPolicy, PaymentPolicy, ShippingMethodPolicy, WishlistPolicy
- **Services**: PaymentStateService (payment state machine), PaymentInitiationService, PaymentRefundService, PaymentGatewayManager, CartMergeService, PaymentWebhookService
- **Auth**: Complete - AuthController implemented with register, login, logout, me, password reset, email verification, mobile tokens, Google OAuth
- **Coupons**: Admin CRUD complete. Coupon application at checkout is implemented (validated against product eligibility, usage limits, dates, minimum order). Coupons cannot be combined with active product offers.
- **Offers**: Admin CRUD complete. Product offers (percentage, fixed_price, buy_x_get_y) are automatically applied at checkout. Offers cannot be combined with coupons.
- **Product Images**: Upload, replacement, WebP variant generation (thumbnail/card/detail), soft delete with 7-day cleanup queue, primary image management. Uses Intervention Image v3.
- **Reviews**: Customer reviews (purchase-verified), admin moderation.
- **Wishlists**: Authenticated user wishlist (pivot table).
- **Addresses**: Authenticated user address book with default address.
- **Shipping Methods**: Admin CRUD, default method auto-applied at checkout.
- **Orders/Invoices/Payments**: Complete flow with state machine, webhook handling, refunds.
- **Frontend**: Minimal - layout, home page only. Directories exist for products, admin, i18n routes but are empty.

## Coupon Feature (Implemented)
- **Endpoints**: `GET/POST /api/v1/admin/coupons`, `GET/PATCH/DELETE /api/v1/admin/coupons/{coupon}`
- **Permissions**: `coupons.view`, `coupons.create`, `coupons.update`, `coupons.delete` (enforced by CouponPolicy via `canAdmin()`)
- **Database**: `coupons` table - `created_by` (nullable FK users.id, nullOnDelete), `code` (unique, also for soft-deleted rows), `discount_type` (`percentage`|`fixed`), `discount_amount`, `minimum_order`, `usage_limit`, `used_count` (system-controlled), `starts_at`, `expires_at`, `is_active`, `deleted_at` (SoftDeletes). Pivot `coupon_products` for product eligibility.
- **Relationships**: `Coupon::createdBy()` belongsTo User, `User::coupons()` hasMany Coupon, `Coupon::products()` belongsToMany Product
- **Validation** (StoreCouponRequest/UpdateCouponRequest): code unique; discount_type in percentage/fixed; discount_amount numeric > 0 and <= 100 for percentage; minimum_order nullable >= 0; usage_limit nullable >= 1; expires_at not before starts_at; is_active boolean; product_ids required array min:1 on create, optional on update
- **System-controlled**: `created_by` is set from the authenticated admin, `used_count` starts at 0 - neither is accepted from the client
- **Response**: `CouponResource` (id, code, discount_type, discount_amount, minimum_order, usage_limit, used_count, starts_at, expires_at, is_active, created_by, products, created_at, updated_at)
- **Checkout**: Coupons are validated and applied at checkout if no active product offer exists on any cart item. Coupon discount applies to eligible products only.

## Development Commands
```bash
# Backend
cd backend
composer install
cp .env.example .env
php artisan key:generate
php artisan migrate
php artisan serve

# Frontend
cd frontend
npm install
npm run dev

# Testing
cd backend
php artisan test

# Queue workers
cd backend
php artisan queue:work

# Scheduled commands
cd backend
php artisan schedule:work
```

## Coding Conventions

- PHP: PSR-12, strict types where practical, readable formatting, and no compressed one-liners.
- JavaScript: ES modules, modern syntax, JavaScript/JSX only, and Fetch API instead of Axios.
- Frontend styling: Tailwind CSS 4; do not introduce Bootstrap.
- Database: Use migrations for schema changes and follow existing foreign-key conventions.
- Foreign-key deletion behavior must match the relationship requirements; use cascading deletion or `nullOnDelete` as appropriate.
- API: RESTful JSON endpoints, Form Requests where appropriate, API Resources, Policies, and consistent error handling.
- Follow existing project naming, formatting, and architecture.
- Avoid unnecessary Services, Actions, Jobs, wrappers, and abstractions.

## Security Rules
- Never commit secrets (.env, keys, tokens)
- Validate all input at controller level
- Use Form Requests for authentication endpoints
- Use policies for authorization
- CSRF protection via Sanctum for web
- Rate limiting on auth and public endpoints
- Webhook signature verification (Stripe/Paymob)

## Authentication Architecture
- **Web (Next.js)**: Sanctum SPA/session auth, HTTP-only cookies, CSRF token
- **Mobile**: Sanctum personal access tokens, Bearer token auth, token revocation
- **Same API** supports both via Sanctum guards
- **No Breeze/Fortify/Jetstream** - custom AuthController implemented
- **Google OAuth**: Laravel Socialite
- **Custom Sanctum Middleware**: EnsureFrontendRequestsAreStateful (only starts session for SPA, not token requests)
- User model: role (master_admin, staff, customer), status (active, pending_approval), permissions (JSON)

## Database Conventions
- All tables use unsignedBigInteger foreign keys
- Cascade delete on parent relationships (`nullOnDelete` where audit history must survive, e.g. `coupons.created_by`)
- Unique constraints where needed (slug, sku, email, coupon code)
- JSON columns for flexible data (permissions, shipping_address, gateway_metadata, variants)
- Soft deletes used for historical/catalog records (products, categories, collections, offers, reviews, orders, invoices, payments, users, addresses, coupons)

## API Conventions
- Versioned at `/api/v1/`
- Resource-based routes
- Pagination: `?page=1` with 20 per page default (30 for admin)
- Errors: `{ "message": "..." }` with appropriate HTTP status
- Webhooks: idempotent via `payment_webhook_events` table

## Image/File Handling
- Products support multiple images via `product_images` table
- Product -> hasMany(ProductImage) relationship
- Images stored with path, disk, alt, sort_order, is_primary, processing_status, variants
- Upload accepts JPG/PNG/WebP, max 10MB, max 5 per batch
- Processing job creates WebP variants (thumbnail 300px, card 600px, detail 1200px) at 82% quality
- Replacement workflow: upload replacement, process, swap, schedule old for 7-day cleanup
- Deletion: soft delete image, schedule original + variants for 7-day cleanup, auto-promote next image to primary
- Cleanup command: `php artisan product-images:cleanup` (scheduled daily)

## Library/Dependency Policy
Before adding any package:
1. Why is it needed?
2. Does Laravel/Next.js already provide it?
3. Is it actively maintained and appropriate?
4. Security/maintenance implications?
5. What problem does it solve?
6. Why prefer it over custom implementation?
- Report proposed dependencies before installing
- Current: Laravel Sanctum, Socialite, Intervention Image v3, Tailwind CSS only

## Testing Expectations

- Backend tests use PHPUnit and are located in `tests/`.
- Run the backend test suite with `php artisan test` from the `backend/` directory.
- Test critical paths including checkout, payment webhooks, policies, authentication, authorization, coupon management, product images, and cart merging.
- Run the relevant tests after each change.
- Run the full test suite before considering a feature complete when practical.
- Never claim that the full test suite passes based only on filtered test results.

Latest reported result:
- `php artisan test --filter=Coupon`: 53 tests passed, 197 assertions.
- This is a filtered result, not confirmation that the entire test suite passes.
- Re-run tests before relying on this result as the current repository status.

## Current Known Problems and Verification Items

The following items must be verified against the current repository before being treated as unresolved issues.

1. Frontend implementation status:
   Inspect the existing Next.js application, routes, layouts, components, localization, and API integration.

2. Backend test status:
   The latest reported Coupon-filtered test result was 53 passing tests and 197 assertions. The full test suite status must be verified separately.

3. Order confirmation:
   Verify whether `SendOrderConfirmation` sends an actual email or only logs an event.

4. Payment expiration:
   Verify the scheduling configuration, command/job execution, and stock restoration behavior.

5. Rate limiting:
   Inspect the actual rate limiter configuration for authentication, cart, checkout, and other sensitive endpoints.

6. Catalog caching:
   Determine whether catalog caching exists before treating Redis or caching as missing.

7. Checkout discounts:
   Verify coupon and offer calculations, product eligibility, usage limits, and discount persistence against the actual implementation.

Do not report these items as confirmed defects until they have been inspected.
Update this section when an issue is verified, fixed, or found not to exist.


## Current Roadmap

### Phase 1: Frontend Foundation
1. Inspect the existing frontend and backend integration contracts.
2. Establish the frontend architecture and API client conventions.
3. Establish English/Arabic localization and RTL/LTR support.
4. Define the initial design tokens and reusable UI foundations.
5. Implement shared storefront, authentication, customer account, and admin layouts as appropriate.

### Phase 2: Storefront
6. Implement product listing and product detail pages.
7. Implement category and collection pages.
8. Integrate guest and authenticated cart behavior.
9. Implement customer account pages supported by existing APIs.

### Phase 3: Admin
10. Implement the admin shell and permission-aware navigation.
11. Implement product, category, and collection management.
12. Implement coupon and offer management.
13. Implement orders, invitations, users, reviews, shipping methods, and other supported admin features.

### Phase 4: Checkout and Payments
14. Integrate the existing checkout API.
15. Integrate shipping, coupons, offers, and payment flows according to the verified backend contracts.
16. Implement order confirmation and payment status experiences.

### Phase 5: Quality and Operations
17. Add appropriate frontend tests.
18. Verify responsive layouts, accessibility, and RTL/LTR behavior.
19. Update documentation to reflect actual implementation.
20. Review remaining backend work, performance, caching, CI/CD, monitoring, and security.

This roadmap describes planned work, not completed functionality.
Inspect the repository and adjust priorities based on its actual state.


## Frontend Development Principles

### Technology

- Next.js 16 App Router.
- React 19.
- JavaScript and JSX only; no TypeScript.
- Tailwind CSS 4.
- Use the existing Fetch-based API client and installed dependencies where appropriate.

### Initial Workflow

Before implementing frontend features:

1. Inspect the current frontend structure, package.json, installed dependencies, routes, layouts, and components.
2. Read the relevant project documentation.
3. Inspect the backend API routes, Resources, authentication requirements, and validation responses.
4. Identify existing functionality and missing functionality.
5. Propose a small implementation plan before making architectural changes.

### Design System

Establish a small, reusable design system before building many pages.

Define consistent tokens for:

- Brand colors and semantic colors.
- Typography and font sizes.
- Spacing.
- Container widths and component sizing.
- Border radii.
- Borders and shadows.
- Focus, hover, active, disabled, loading, and error states.
- Transitions and reduced-motion behavior.

Create reusable foundations for buttons, inputs, cards, form fields, badges, dialogs, tables, and other components as actual requirements emerge.

Avoid arbitrary values scattered across components and avoid unnecessary design-system abstractions.

### Brand Customization

The starter must be adaptable to different clients through configuration and design tokens.

Support appropriate customization of brand identity, logo, colors, typography, and other justified visual preferences.

This means separate deployments of the single-store starter can have different branding.

It does not mean introducing multi-store tenancy, vendor management, or store provisioning.

### Layouts and Access

Plan distinct experiences for:

- Guests and public storefront visitors.
- Authenticated customers.
- Authorized staff.
- Master administrators.

Use shared layouts where appropriate.

Frontend route protection and permission-aware navigation improve the user experience but never replace backend authorization.

### Localization

Support English and Arabic, including correct LTR and RTL behavior.

Inspect the existing localization implementation and dependencies before choosing or introducing an i18n solution.

Use locale-aware routing and document language/direction settings where appropriate.

Verify both directions across navigation, forms, cards, tables, and responsive layouts.

### Incremental Implementation

Build the frontend in small stages:

1. Repository inspection.
2. API integration foundation.
3. Localization and design tokens.
4. Shared layouts.
5. Initial storefront pages.
6. Authentication and customer account.
7. Cart integration.
8. Admin layout and management pages.
9. Checkout and payment integration.
10. Testing, accessibility, and documentation.

Do not generate the entire frontend in one operation.

Do not rebuild working backend features merely to accommodate frontend implementation.


## Rules for Future AI Agents
- **Read relevant docs/ files before making architectural changes**
- Do not add packages without approval
- Do not implement features not in roadmap without discussion
- Follow existing code conventions exactly
- Run tests after changes
- Keep documentation updated with actual repository state