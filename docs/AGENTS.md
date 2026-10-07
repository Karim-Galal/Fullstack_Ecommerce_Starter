# Project: Fullstack Ecommerce Starter

## Project Purpose
A single-store ecommerce application with Laravel 12 API backend and Next.js 16 frontend. Provides product catalog, cart, checkout, payments (Stripe/Paymob), and admin management.

## Current Architecture
- **Backend**: Laravel 12, Sanctum SPA authentication, MySQL database
- **Frontend**: Next.js 16 (App Router), React 19, Tailwind CSS 4
- **API**: RESTful JSON API at `/api/v1/*`
- **Authentication**: Sanctum session cookies for web, personal access tokens for mobile

## Backend/Frontend Boundaries
- Backend serves API only at `/api/v1/*`
- Frontend consumes API via fetch-based client in `src/services/api.js`
- No server-side rendering of backend data in frontend
- CORS/Sanctum stateful domains configured for local development

## Implementation State (Post-Refactor)
- **Database**: Single-store schema (no store_id columns)
- **Models**: User, Product, Category, Cart, Order, Payment, Invitation, Invoice, Offer, Coupon, Review, PushSubscription, etc.
- **Controllers**: Auth, Product, Category, Cart, Checkout, PaymentWebhook, Invitation, GoogleAuth
- **Policies**: ProductPolicy, CategoryPolicy, UserPolicy
- **Services**: PaymentStateService (payment state machine)
- **Auth**: Complete - AuthController implemented with register, login, logout, me, password reset, email verification, mobile tokens, Google OAuth
- **Frontend**: Minimal - layout, home page only

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
```

## Coding Conventions
- PHP: PSR-12, strict types where practical, readable formatting (no one-liners)
- JavaScript: ES modules, modern syntax, no Axios (use fetch)
- Database: Migrations for all schema changes, foreign keys with cascade
- API: RESTful, JSON responses, consistent error format

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
- Cascade delete on parent relationships
- Unique constraints where needed (slug, sku, email)
- JSON columns for flexible data (permissions, shipping_address, gateway_metadata)
- Soft deletes NOT used (hard deletes only)

## API Conventions
- Versioned at `/api/v1/`
- Resource-based routes
- Pagination: `?page=1` with 20 per page default
- Errors: `{ "message": "..." }` with appropriate HTTP status
- Webhooks: idempotent via `payment_webhook_events` table

## Image/File Handling
- Products support multiple images via `product_images` table
- Product -> hasMany(ProductImage) relationship
- Images stored with path, alt, sort_order, is_primary
- **Future**: Use image processing library for validation, resizing, compression, WebP conversion, variants
- Do NOT replace with JSON field on products

## Library/Dependency Policy
Before adding any package:
1. Why is it needed?
2. Does Laravel/Next.js already provide it?
3. Is it actively maintained and appropriate?
4. Security/maintenance implications?
5. What problem does it solve?
6. Why prefer it over custom implementation?
- Report proposed dependencies before installing
- Current: Laravel Sanctum, Socialite, Tailwind CSS only

## Testing Expectations
- Backend: PHPUnit feature/unit tests in `tests/`
- Run `php artisan test` before committing
- Test critical paths: checkout, payment webhooks, policies, authentication, authorization
- 36 tests passing (122 assertions)

## Current Known Problems
1. **No frontend features** - only home page and layout exist
2. **No admin UI** - login directory exists but empty
3. **No product/category frontend pages** - directories exist but empty

## Current Roadmap
1. Build frontend product listing and detail pages
2. Build cart and checkout frontend
3. Build admin authentication and dashboard
4. Implement product/category admin management UI
5. Payment integration (Stripe/Paymob)
6. Promotions/Offers UI
7. Notifications & Push

## Rules for Future AI Agents
- **Read relevant docs/ files before making architectural changes**
- Do not add packages without approval
- Do not implement features not in roadmap without discussion
- Follow existing code conventions exactly
- Run tests after changes
- Keep documentation updated with actual repository state