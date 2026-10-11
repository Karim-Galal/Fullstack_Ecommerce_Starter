# System Architecture

## Overview
Single-store ecommerce application with Laravel 12 API backend and Next.js 16 frontend.


## Frontend Architecture and Design System

### Technology

- Next.js 16 with the App Router
- React
- JavaScript/JSX only; TypeScript is not used
- Tailwind CSS v4
- Existing Fetch API client and authentication conventions

Inspect the current frontend implementation and dependencies before changing its structure.

### Design System

Establish a consistent, reusable design system before building the main storefront pages.

The design system should cover:

- Brand and semantic colors
- Typography and font scales
- Spacing and sizing
- Responsive containers and layout breakpoints
- Border radii, borders, and shadows
- Interaction states, including hover, focus, disabled, loading, and error states

Prefer reusable components and design tokens where they improve consistency. Avoid unnecessary abstractions and dependencies.

### Store Branding

The application remains a single-store ecommerce system.

Branding should be customizable for separate deployments through an appropriate configuration and theme structure. This does not introduce multi-store functionality, tenant management, or store switching.

### Localization and Layout Direction

The frontend must support English and Arabic, including appropriate LTR and RTL layouts.

Inspect the existing localization setup before selecting or changing the implementation approach. Ensure that navigation, forms, icons, spacing, and responsive layouts work correctly in both directions.

### Application Layouts

Organize the frontend according to the actual application requirements:

- Public storefront and guest pages
- Authenticated customer pages
- Staff interfaces
- Master-admin interfaces

Keep shared layout elements reusable. Administrative navigation and actions must respect the existing backend permissions, while Laravel remains responsible for authorization.

### API and Authentication Boundaries

Laravel remains the source of truth for business rules, authentication, authorization, validation, pricing, discounts, inventory, orders, and payment state.

Before integrating a feature, inspect its existing API routes, Form Requests, Resources, response formats, and error handling.

Preserve the existing Sanctum authentication behavior, including session cookies, CSRF handling, and any supported Bearer-token flow. Inspect the Google OAuth redirect and callback behavior before implementing its frontend integration.

Use Next.js Server and Client Components where appropriate, following the existing API-client and authentication constraints.

### Incremental Implementation

1. Inspect the existing frontend files, dependencies, routes, and global styles.
2. Establish or refine design tokens, fonts, localization, and global styles.
3. Build shared UI primitives and application layouts.
4. Implement public storefront pages using existing backend APIs.
5. Implement customer account features.
6. Implement staff and master-admin interfaces.
7. Verify responsive behavior, accessibility, localization, and API error handling.

Do not rebuild existing backend features or modify unrelated backend functionality merely to accommodate frontend implementation.

### Implementation Status

This section defines the frontend architecture and implementation direction. Individual pages and capabilities must be verified against the repository before being described as implemented.

## High-Level Components

```
┌─────────────────────────────────────────────────────────────────┐
│                        Next.js Frontend                         │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐  │
│  │  Public     │  │  Authenticated │  │  Admin (future)       │  │
│  │  Pages      │  │  Pages         │  │  Dashboard            │  │
│  └──────┬──────┘  └──────┬──────┘  └───────────┬───────────────┘  │
│         │                │                      │                 │
│         └────────────────┼──────────────────────┘                 │
│                          ▼                                        │
│              ┌─────────────────────┐                              │
│              │  Fetch API Client   │  (src/services/api.js)       │
│              │  + CSRF handling    │                              │
│              └──────────┬──────────┘                              │
└─────────────────────────┼────────────────────────────────────────┘
                          │ HTTPS /api/v1/*
                          ▼
┌─────────────────────────────────────────────────────────────────┐
│                      Laravel 12 Backend                         │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │                    API Routes (/api/v1)                     │  │
│  │  ┌─────────┐ ┌─────────┐ ┌────────┐ ┌───────┐ ┌────────┐  │  │
│  │  │ Products│ │Categories│ │ Cart   │ │Checkout│ │Payments│  │  │
│  │  └─────────┘ └─────────┘ └────────┘ └───────┘ └────────┘  │  │
│  │  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────────────┐  │  │
│  │  │ Auth    │ │Invitations│ │ Admin   │ │ Webhooks        │  │  │
│  │  │         │ │         │ │ Products│ │ (Stripe/Paymob) │  │  │
│  │  └─────────┘ └─────────┘ └─────────┘ └─────────────────┘  │  │
│  │  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────────────┐  │  │
│  │  │Collections│ │ Offers  │ │ Coupons │ │ Reviews         │  │  │
│  │  └─────────┘ └─────────┘ └─────────┘ └─────────────────┘  │  │
│  └───────────────────────────────────────────────────────────┘  │
│  ┌──────────────────┐  ┌──────────────────┐  ┌────────────────┐  │
│  │   Services       │  │    Policies      │  │   Models       │  │
│  │  PaymentState    │  │  Product/Category│  │  Eloquent      │  │
│  │  PaymentInitiation│ │  Collection/     │  │                │  │
│  │  PaymentRefund   │  │  Coupon/Offer/   │  │                │  │
│  │  PaymentGateway  │  │  Review/Address  │  │                │  │
│  │  CartMerge       │  │  Payment/Shipping│  │                │  │
│  │  PaymentWebhook  │  │  User/Wishlist   │  │                │  │
│  │  ProcessImage    │  └──────────────────┘  └────────────────┘  │
│  │  ImageCleanup    │                                                │
│  └──────────────────┘                                                │
└─────────────────────────────────────────────────────────────────┘
                          │
                          ▼
              ┌─────────────────────┐
              │   MySQL Database    │
              └─────────────────────┘
```

## Authentication Architecture

### Web (Next.js SPA)
- **Mechanism**: Laravel Sanctum SPA authentication
- **Cookie**: HTTP-only session cookie (`laravel_session`)
- **CSRF**: Sanctum CSRF token via `/sanctum/csrf-cookie`
- **Flow**: 
  1. Frontend calls `/sanctum/csrf-cookie` to get CSRF token
  2. Login POST to `/api/v1/auth/login` with credentials
  3. Sanctum sets session cookie
  4. Subsequent requests include cookie automatically (`credentials: "include"`)
- **Logout**: POST to `/api/v1/auth/logout` destroys session

### Mobile / Third-Party
- **Mechanism**: Sanctum Personal Access Tokens
- **Auth**: Bearer token in Authorization header
- **Token Management**: 
  - Create: `POST /api/v1/auth/tokens` with device name
  - List: `GET /api/v1/auth/tokens`
  - Revoke: `DELETE /api/v1/auth/tokens/{tokenId}`
- **Scope**: Same API endpoints, different guard

### Google OAuth
- **Mechanism**: Laravel Socialite
- **Flow**:
  1. Redirect to Google: `GET /api/v1/google/redirect`
  2. Callback: `GET /api/v1/google/callback`
  3. Creates/links user account
  4. Returns user + optional mobile token
- **Account Linking**: 
  - Existing Google ID → login existing user
  - Existing email → link Google ID to existing account
  - New email → create new user with verified email

### Shared API
- Both auth modes use same controllers/routes
- Sanctum `auth:sanctum` middleware handles both
- Guard priority: session (web) → bearer token (api)

## Data Flow Examples

### Product Listing (Public)
```
GET /api/v1/products
  → ProductController@index
  → Product::where('is_active', true)->with(['translations','images','category'])->paginate(20)
  → JSON response
```

### Add to Cart (Public/Guest)
```
POST /api/v1/cart/items { product_id, quantity }
  → CartController@add
  → Resolve cart: user_id OR guest_token (X-Guest-Cart header)
  → Validate product exists, is_active, stock >= quantity
  → Create/update CartItem
  → Return cart with items + X-Guest-Cart header
```

### Checkout (Authenticated)
```
POST /api/v1/checkout { shipping_address, gateway, payment_method, coupon_code? }
  → CheckoutController@store (auth:sanctum)
  → Load user's cart with items+products
  → DB transaction:
    - Lock products for update
    - Validate stock
    - Apply active product offers (percentage, fixed_price, buy_x_get_y)
    - Validate and apply coupon if no active offer exists
    - Get default shipping method
    - Decrement stock
    - Create Order + OrderItems
    - Create Payment (pending)
    - Clear cart
  → Return order + payment + gateway client_secret
```

### Payment Webhook (Stripe/Paymob)
```
POST /api/v1/payments/{gateway}/webhook
  → PaymentWebhookController@handle
  → Verify signature (HMAC-SHA256 for Stripe, HMAC-SHA512 for Paymob)
  → Idempotency check via payment_webhook_events table
  → Extract transaction_reference from payload
  → PaymentStateService::apply(payment, status, gateway_ref, metadata)
    - Validates state transition
    - Updates payment status
    - If paid: confirms order, queues SendOrderConfirmation job
    - If expired: restores stock
  → Returns { ok: true }
```

### Mobile Token Login
```
POST /api/v1/auth/login { email, password, device_name }
  → AuthController@login
  → Auth::attempt(credentials)
  → Create personal access token
  → Return user + token
```

### Cart Merge (Login/Register)
```
POST /api/v1/auth/login { email, password, device_name?, X-Guest-Cart header }
  → AuthController@login
  → Auth::attempt(credentials)
  → CartMergeService::merge(user, guestToken)
    - Lock guest cart and user cart
    - If user has no cart: convert guest cart to user cart
    - If user has cart: merge items, validate stock
    - Delete guest cart
  → Return user (+ token if device_name)
```

## Key Services

### PaymentStateService
Enforces valid payment state transitions:
```
unpaid  → pending, paid, failed
pending → paid, failed, expired
failed  → paid
paid    → refunded
refunded → (terminal)
expired → (terminal)
```
- Uses row locking (`lockForUpdate()`) for concurrency safety
- Validates payment amount matches order total
- Triggers order confirmation on successful payment
- Restores stock on payment expiry

### PaymentInitiationService
- Creates payment intent (Stripe) or intention (Paymob)
- Returns client_secret for frontend integration
- Handles idempotency for re-initiation

### PaymentRefundService
- Processes refunds via gateway
- Only allows refund on paid payments
- Updates payment status via PaymentStateService

### PaymentGatewayManager
- Resolves gateway by name (stripe/paymob)
- Extensible for additional gateways

### PaymentWebhookService
- Handles webhook idempotency via `payment_webhook_events` table
- Delegates to gateway-specific handlers
- Applies state transitions via PaymentStateService

### CartMergeService
- Merges guest cart into user cart on login/register
- Validates product availability and stock
- Handles both "user has no cart" and "user has existing cart" scenarios
- Fails gracefully without breaking authentication

### ProcessProductImage Job
- Processes uploaded images to WebP variants (thumbnail, card, detail)
- Handles replacement workflow: processes new, swaps, schedules old for cleanup
- Updates `processing_status` (pending → ready/failed)
- Sets first ready image as primary if none exists

### CleanupProductImages Command
- Runs daily via scheduler
- Permanently deletes expired image files from storage
- Tracks attempts and errors for retry

## Soft Deletes

The following entities use Laravel's Soft Deletes for audit trail and historical data preservation:

- **Product** - Referenced by historical orders; must remain accessible for order history
- **Category** - Hierarchical structure; products reference it; historical reference
- **Collection** - Curated product groups; may need history
- **Offer** - Promotional campaigns with historical value
- **Review** - User-generated content with historical value
- **Order** - Financial records; must be preserved for legal/accounting
- **Invoice** - Legal/financial documents
- **Payment** - Financial transaction records
- **User** - Account history; orders/invoices reference it
- **Address** - Order history references it
- **Coupon** - Promotional records with usage/audit history (`created_by`); deactivation via `is_active` alone is not enough
- **ProductImage** - Supports replacement workflow with 7-day cleanup retention

### Entities Without Soft Deletes
- **CartItem** - Session/temporary; no historical value
- **OrderItem** - Already preserves historical snapshot (name, sku, unit_price, line_total)
- **Translation tables** - Tied to parent entity lifecycle
- **Pivot tables** (collection_product, offer_products, coupon_products, wishlists) - Simple relationships
- **Cart** - Session/temporary
- **ShippingMethod** - Deactivation via `is_active` is sufficient
- **PaymentWebhookEvents** - Idempotency tracking
- **PushSubscription** - Session-like, can be deleted
- **Notification** - Notification system handles lifecycle
- **Invitation** - Status field manages lifecycle

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