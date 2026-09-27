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
  - Order summary
  - Redirect to payment provider

## Phase 3: Payment Integration
- [ ] Stripe Elements integration
- [ ] Paymob integration
- [ ] Webhook handling verification
- [ ] Order confirmation page
- [ ] Email confirmation (queue job)

## Phase 4: Admin Panel
- [ ] Admin login page (`/admin/login`)
- [ ] Admin dashboard layout
- [ ] Product management
  - List with search/filter
  - Create/edit form (translations, images, pricing, stock)
  - Image upload (multiple, drag-drop)
  - Delete with confirmation
- [ ] Category management
  - Tree view with drag-drop reorder
  - Create/edit form (translations)
  - Delete with cascade handling
- [ ] Order management
  - List with status filters
  - Detail view
  - Status updates
- [ ] Invitation management
  - Invite staff/master_admin
  - Approve/reject/revoke

## Phase 5: Promotions & Offers
- [ ] Offer admin UI
  - Create percentage/fixed_price/buy_x_get_y offers
  - Assign products to offers
  - Schedule start/end dates
- [ ] Offer display on product pages
- [ ] Cart-level offer application
- [ ] Coupon code entry at checkout

## Phase 5: Addresses & Shipping
- [ ] Customer address book
- [ ] Shipping method management
- [ ] Address selection at checkout

## Phase 6: Notifications & Push
- [ ] Database notifications (in-app)
- [ ] Realtime notifications (Laravel Reverb + Echo)
- [ ] Browser push notifications (Web Push)
- [ ] Email notification templates

## Phase 6: Invoices
- [ ] Invoice admin UI
  - List/generate invoices
  - PDF generation

## Phase 7: Polish & Production
- [ ] Image processing pipeline (validation, resize, compress, WebP, variants)
- [ ] Redis caching for catalog queries
- [ ] Comprehensive test coverage
- [ ] CI/CD pipeline
- [ ] Monitoring/logging
- [ ] Performance optimization
- [ ] Security audit

## Technical Debt / Nice-to-Have
- [ ] Product reviews/ratings
- [ ] Wishlist UI
- [ ] Advanced shipping rules
- [ ] Order history for customers
- [ ] Multi-currency support
- [ ] Advanced search (Algolia/Meilisearch)
- [ ] PWA support
- [ ] Accessibility audit (WCAG 2.1 AA)