# System Architecture

## Overview
Single-store ecommerce application with Laravel 12 API backend and Next.js 16 frontend.

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
│  └───────────────────────────────────────────────────────────┘  │
│  ┌──────────────────┐  ┌──────────────────┐  ┌────────────────┐  │
│  │   Services       │  │    Policies      │  │   Models       │  │
│  │  PaymentState    │  │  Product/Category│  │  Eloquent      │  │
│  └──────────────────┘  └──────────────────┘  └────────────────┘  │
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
POST /api/v1/checkout { shipping_address, gateway, payment_method }
  → CheckoutController@store (auth:sanctum)
  → Load user's cart with items+products
  → DB transaction:
    - Lock products for update
    - Validate stock
    - Decrement stock
    - Create Order + OrderItems
    - Create Payment (pending)
    - Clear cart
  → Return order + payment
```

### Payment Webhook (Stripe/Paymob)
```
POST /api/v1/payments/{gateway}/webhook
  → PaymentWebhookController@handle
  → Verify signature (HMAC-SHA256 for Paymob, Stripe-Signature for Stripe)
  → Idempotency check via payment_webhook_events table
  → Extract transaction_reference from payload
  → PaymentStateService::apply(payment, status, gateway_ref, metadata)
    - Validates state transition
    - Updates payment status
    - If paid: confirms order, queues SendOrderConfirmation job
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

## Key Services

### PaymentStateService
Enforces valid payment state transitions:
```
unpaid  → pending, paid, failed
pending → paid, failed
failed  → paid
paid    → refunded
refunded → (terminal)
```
- Uses row locking (`lockForUpdate()`) for concurrency safety
- Validates payment amount matches order total
- Triggers order confirmation on successful payment

### Custom Sanctum Middleware
- **EnsureFrontendRequestsAreStateful**: Only starts session for SPA requests (not Bearer token requests)
- Skips session for requests with Bearer token
- Checks Origin/Referer headers for SPA detection

## Soft Deletes

The following entities use Laravel's Soft Deletes for audit trail and historical data preservation:

- **Product** - Catalog items that may be referenced by historical orders
- **Category** - Hierarchical catalog structure referenced by products
- **Collection** - Curated product groups
- **Offer** - Promotional campaigns with historical value
- **Review** - User-generated content with historical value
- **Order** - Financial records that must be preserved for legal/accounting
- **Invoice** - Legal/financial documents
- **Payment** - Financial transaction records
- **User** - Account history, orders/invoices reference it
- **Address** - Order history references it

**Behavior:**
- Normal Eloquent queries automatically exclude soft-deleted records
- Soft-deleted products/categories/offers do not appear in storefront catalog queries
- Historical records (Orders, OrderItems, Invoices, Payments, Reviews) maintain access to soft-deleted related records via `withTrashed()` on relationships
- The `destroy()` method in controllers performs soft delete via `$model->delete()`
- No hard delete or restore endpoints are exposed in the API

**Relationships with `withTrashed()`:**
- `OrderItem::product()` - Access product for historical order display
- `Order::user()` - Access user for order history
- `Invoice::order()` - Access order for invoice history
- `Payment::order()` - Access order for payment history
- `Review::product()` and `Review::user()` - Access deleted product/user for review history