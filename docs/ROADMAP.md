# Roadmap

## Phase 1: Authentication Foundation (✅ COMPLETED)
- [x] Implement `AuthController` with:
  - `POST /auth/register` - Customer registration
  - `POST /auth/login` - Email/password login
  - `POST /auth/logout` - Session destruction
  - `GET /auth/me` - Current user
  - `POST /auth/forgot-password` - Password reset email
  - `POST /auth/reset-password` - Password reset
  - `POST /auth/tokens` - Create personal access token (mobile)
  - `GET /auth/tokens` - List tokens
  - `DELETE /auth/tokens/{id}` - Revoke token
- [x] Email verification flow
- [x] Password reset email with custom notification
- [x] Test Sanctum SPA + token auth both work
- [x] Custom Sanctum middleware for SPA/token differentiation
- [x] Google OAuth foundation (redirect + callback)
- [x] Account linking logic for Google OAuth

## Phase 2: Storefront Core
- [x] Storefront shell (header, footer, language switcher, RTL)
- [x] Storefront homepage (hero, principles, live new arrivals, craft story, CTA)
- [x] Localized branded 404 page with real `404` status
- [ ] Product listing page (`/products`)
  - Category filter sidebar
  - Pagination
  - Grid/list view toggle
  - RTL support
- [ ] Product detail page (`/products/[identifier]`)
  - Image gallery
  - Translations (EN/AR)
  - Add to cart
  - Stock status
  - Related products
- [ ] Cart page (`/cart`)
  - Item list with quantity controls
  - Guest cart persistence (localStorage + X-Guest-Cart header)
  - Cart summary (subtotal, shipping estimate)
  - Proceed to checkout
- [ ] Checkout page (`/checkout`)
  - Shipping address form
  - Payment method selection (Stripe/Paymob)
  - Coupon code entry
  - Order summary
  - Redirect to payment provider

## Phase 3: Payment Integration
- [ ] Stripe Elements integration (frontend)
- [ ] Paymob integration (frontend)
- [ ] Verify Stripe and Paymob webhook behavior with relevant tests
- [ ] Order confirmation page
- [ ] Implement and verify actual email delivery in SendOrderConfirmation

## Phase 4: Admin Panel
- [x] Admin login page (`/admin/login`)
- [x] Admin dashboard layout
- [x] Product management
  - [x] List with search/filter
  - [x] Create/edit form (translations, pricing, stock)
  - [x] Image upload, replacement, alt text, primary selection, and variant preview
  - [x] Delete with confirmation (soft delete, restore/force delete via Trash)
  - [ ] Drag-and-drop image ordering
- [x] Category management
  - [x] Root/child listing with client-side search
  - [x] Create/edit form (translations, parent, sort order)
  - [x] Soft delete, restore, and guarded force delete
  - [ ] Drag-and-drop tree reordering
- [x] Collection management
  - [x] List with search/filter
  - [x] Create/edit form (translations, product assignment)
  - [x] Delete, restore, and force delete
- [x] Order management
  - [x] List with status filters, search, dates, sorting, pagination
  - [x] Detail view with items, customer, shipping, payments, and invoice
  - [x] Safe status transitions with paid-payment cancellation guard
- [x] Payment management
  - [x] List/detail and permission-gated refunds
- [x] Invoice management
  - [x] List/detail and restore-only Trash behavior
- [x] Invitation management
  - [x] Invite staff/master_admin
  - [x] Approve/reject/revoke based on invitation state
- [x] Coupon management UI
- [x] Offer management UI
- [x] Review moderation UI
- [x] Shipping method management
- [x] User management
- [x] Trash (restore and guarded force delete)
- [x] English/Arabic admin translations with RTL support

## Phase 5: Promotions & Offers
- [x] Coupon admin API
  - List/show/create/update/soft-delete at `/admin/coupons`
  - `coupons.view|create|update|delete` permissions via CouponPolicy
  - `created_by` audit field, SoftDeletes
  - Product eligibility via `coupon_products` pivot
  - Coupon validation and application at checkout
- [ ] Coupon admin UI
- [x] Offer admin API
  - Create percentage/fixed_price/buy_x_get_y offers
  - Assign products to offers
  - Schedule start/end dates
  - Automatic application at checkout
- [ ] Offer admin UI
- [ ] Offer display on product pages

## Phase 6: Reviews & Wishlist
- [x] Review API (customer create, user reviews, admin moderate)
- [ ] Review UI on product pages
- [x] Wishlist API (authenticated user)
- [ ] Wishlist UI

## Phase 7: Addresses & Shipping
- [x] Customer address book API
- [x] Shipping method management API
- [x] Default shipping method auto-applied at checkout
- [ ] Address selection at checkout (frontend)

## Phase 8: Notifications & Push
- [x] Database notifications (in-app) - API endpoints for listing, unread count, mark read/read-all; generated on order placed and payment confirmed
- [ ] Realtime notifications (Laravel Reverb + Echo)
- [ ] Browser push notifications (Web Push)
- [ ] Email notification templates (order confirmation, shipping updates, etc.)

## Phase 9: Invoices
- [x] Backend invoice API
  - [x] Automatic, idempotent issuance when a payment is paid
  - [x] Durable invoice-issuance outbox with scheduled recovery
  - [x] Customer and admin list/show endpoints with `invoices.view` permission
  - [x] Financial-history protection against hard-deleting invoiced orders
- [ ] Invoice admin UI
  - List/generate invoices
  - PDF generation

## Phase 10: Image Processing & Performance
- [x] Image upload, WebP variants (thumbnail/card/detail), replacement, 7-day cleanup
- [ ] Redis caching for catalog queries
- [ ] Image CDN integration


## Phase 11: Polish & Production
- [x] Consolidate database migrations (one create migration per table)
- [x] Update factories and seeders with realistic development data
- [x] Run and review the full backend test suite (251 tests, 981 assertions)
- [ ] Resolve any confirmed failing tests
- [ ] Comprehensive test coverage
- [ ] CI/CD pipeline
- [ ] Monitoring and logging review
- [ ] Performance optimization
- [ ] Security audit

## Technical Debt / Nice-to-Have
- [ ] Product reviews/ratings UI
- [ ] Wishlist UI
- [ ] Advanced shipping rules
- [ ] Order history for customers
- [ ] Multi-currency support
- [ ] Advanced search (Algolia/Meilisearch)
- [ ] PWA support
- [ ] Accessibility audit (WCAG 2.1 AA)
- [ ] Implement actual email sending in SendOrderConfirmation job
- [ ] Schedule PaymentExpirationJob verification
- [ ] Rate limiter for cart/checkout endpoints