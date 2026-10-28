# API Reference

## Base URL
```
/api/v1
```

## Authentication
| Mode | Header | Description |
|------|--------|-------------|
| Web (SPA) | Cookie | `laravel_session` + `X-XSRF-TOKEN` (auto via `credentials: "include"`) |
| Mobile | Authorization | `Bearer {personal_access_token}` |

## Error Format
```json
{
  "message": "Human-readable error description"
}
```

## Rate Limits
| Endpoint Group | Limit |
|----------------|-------|
| Auth (register, login, password reset) | 5/min per IP+email |
| Invitations | 10/min per IP |
| Payment Webhooks | 60/min |

## Public Endpoints

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/auth/register` | Customer registration |
| POST | `/auth/login` | Email/password login (returns token if `device_name` provided) |
| POST | `/auth/forgot-password` | Password reset email |
| POST | `/auth/reset-password` | Password reset |

### Email Verification
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/auth/email/verify/{id}/{hash}` | Verify email |
| POST | `/auth/email/verification-notification` | Resend verification email (auth:sanctum) |

### Google OAuth
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/google/redirect` | Redirect to Google OAuth |
| GET | `/google/callback` | Google OAuth callback |

### Products
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/products` | Paginated list (20/page, max 100). Search, filter, and sort query parameters below |
| GET | `/products/{identifier}` | Single product. Format: `{slug}-{id}` |

**Visibility:** the public listing only ever returns products where `is_active` is `true`. Soft-deleted products and inactive products are excluded server-side and cannot be requested with any query parameter (for example, `?is_active=0` is ignored).

**Query parameters for `GET /products`:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `search` | string | Partial match against the product's translated `name` (any locale), `sku`, or `slug`. OR conditions are grouped so they cannot bypass the active-product restriction |
| `category_id` | integer | Must exist in `categories` |
| `collection_id` | integer | Must exist in `collections`; matches products attached to the collection |
| `min_price` | numeric | Inclusive lower bound, `>= 0` |
| `max_price` | numeric | Inclusive upper bound, `>= 0`; must be greater than or equal to `min_price` |
| `in_stock` | boolean | `1`/`true` for `stock > 0`, `0`/`false` for `stock = 0` |
| `sort` | string | `price` or `created_at` (default `created_at`) |
| `direction` | string | `asc` or `desc` (default `desc`) |
| `page` | integer | Page number, minimum `1` |
| `per_page` | integer | Items per page, minimum `1`, maximum `100` (default `20`) |

Unknown query parameters are ignored. Invalid values for `category_id`, `collection_id`, `min_price`, `max_price`, `in_stock`, `sort`, `direction`, or out-of-range `per_page` return `422` with a validation error.

Example:
```
GET /api/v1/products?search=shirt&category_id=3&collection_id=5&min_price=10&max_price=200&in_stock=1&sort=price&direction=asc&page=1&per_page=20
```

**Product List Response:**
```json
{
  "data": [
    {
      "id": 1,
      "slug": "product-name-1",
      "sku": "SKU-001",
      "price": "99.99",
      "stock": 100,
      "is_active": true,
      "translations": [{"locale": "en", "name": "Product Name", "description": "..."}],
      "images": [{"path": "/storage/...", "alt": "...", "is_primary": true, "variants": {...}}],
      "category": {"id": 1, "slug": "category", "translations": [...]}
    }
  ],
  "current_page": 1,
  "links": {...},
  "per_page": 20,
  "total": 42
}
```

### Categories
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/categories` | Root categories with children and translations |

### Collections
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/collections` | Paginated list (20/page) of active collections with translations and products |
| GET | `/collections/{identifier}` | Single collection. Format: `{slug}-{id}` |

### Cart
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/cart` | Get cart (creates if needed). Returns `X-Guest-Cart` header |
| POST | `/cart/items` | Add item. Body: `{product_id, quantity}` |
| PATCH | `/cart/items/{item}` | Update quantity. Body: `{quantity}` |
| DELETE | `/cart/items/{item}` | Remove item |

**Cart Response:**
```json
{
  "cart": {
    "id": 1,
    "items": [
      {
        "id": 1,
        "quantity": 2,
        "product": {
          "id": 1,
          "price": "99.99",
          "stock": 100,
          "translations": [...],
          "images": [...]
        }
      }
    ]
  }
}
```

### Shipping Methods
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/shipping-methods` | Active shipping methods |

### Reviews
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/reviews` | Paginated list of approved reviews. Query: `?product_id=1` |

## Authenticated Endpoints (requires `auth:sanctum`)

### Auth
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/auth/me` | Current user |
| POST | `/auth/logout` | Logout |
| POST | `/auth/tokens` | Create mobile token. Body: `{device_name}` |
| GET | `/auth/tokens` | List user tokens |
| DELETE | `/auth/tokens/{token}` | Revoke token |

### Checkout
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/checkout` | Create order from cart. Body: `{shipping_address, gateway, payment_method?, coupon_code?}` |

**Checkout Request:**
```json
{
  "shipping_address": {
    "name": "John Doe",
    "phone": "+20123456789",
    "line1": "123 Street",
    "city": "Cairo",
    "country": "EG"
  },
  "gateway": "stripe",
  "payment_method": "card",
  "coupon_code": "WELCOME10"
}
```

**Checkout Response:**
```json
{
  "order": {
    "id": 1,
    "number": "ORD-20260925-ABC123",
    "status": "pending",
    "total": "199.98",
    "items": [...],
    "shipping_address": {...}
  },
  "payment": {
    "id": 1,
    "amount": "199.98",
    "currency": "EGP",
    "gateway": "stripe",
    "status": "pending",
    "transaction_reference": "uuid..."
  },
  "gateway": {
    "gateway": "stripe",
    "status": "pending",
    "client_secret": "pi_...",
    "gateway_reference": "pi_..."
  }
}
```

### Payments
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/payments/{payment}/initiate` | Initiate payment for pending order (returns client_secret) |

### Invoices
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/invoices` | Current user's invoices (20/page), including order items and shipping address |
| GET | `/invoices/{invoice}` | View one of the current user's invoices |

A payment transition to `paid` commits the payment and confirmed order state together with a pending `invoice_issuances` work item. A queued job then issues the invoice idempotently. Invoice failure does not roll back the payment, and a scheduled sweep dispatches due or stale work. Invoices snapshot the order currency and financial totals, are read-only through the API, and remain available after an order is soft-deleted. Customers can only access their own invoices.

### Reviews
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/reviews/mine` | Current user's reviews |
| POST | `/reviews` | Create review. Body: `{product_id, rating, comment?}` (purchase verified) |
| GET | `/reviews/{review}` | View own review |
| PATCH | `/reviews/{review}` | Update own review (resets to pending) |
| DELETE | `/reviews/{review}` | Delete own review |

### Wishlist
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/wishlist` | Current user's wishlist |
| POST | `/wishlist` | Add to wishlist. Body: `{product_id}` |
| DELETE | `/wishlist/{product}` | Remove from wishlist |

### Addresses
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/addresses` | List user addresses |
| POST | `/addresses` | Create address |
| GET | `/addresses/{address}` | Show address |
| PATCH | `/addresses/{address}` | Update address |
| DELETE | `/addresses/{address}` | Delete address |
| PATCH | `/addresses/{address}/default` | Set as default address |

### Notifications
In-app notifications are stored with Laravel's database notification system. Every route is scoped to the authenticated user; a user can never read or modify another user's notifications.

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/notifications` | Paginated list of the user's notifications (20/page, newest first) |
| GET | `/notifications/unread-count` | Returns `{ "unread_count": n }` |
| PATCH | `/notifications/{notification}/read` | Mark one notification as read |
| PATCH | `/notifications/read-all` | Mark all of the user's notifications as read |

**Notification Response:**
```json
{
  "data": {
    "id": "5f9c...uuid",
    "type": "OrderPlacedNotification",
    "payload": {
      "type": "order_placed",
      "order_id": 1,
      "order_number": "ORD-20260925-ABC123",
      "total": "199.98",
      "currency": "EGP",
      "message": "Your order ORD-20260925-ABC123 has been placed.",
      "url": "/orders/1"
    },
    "read_at": null,
    "created_at": "2026-09-25T12:00:00.000000Z",
    "updated_at": "2026-09-25T12:00:00.000000Z"
  }
}
```

**List Response** wraps the above items in the standard `data` / `links` / `meta` pagination envelope.

**Notifications generated by business events:**
| Event | Notification type | Recipient | Payload `type` |
|-------|-------------------|-----------|----------------|
| Order created at checkout (after gateway initiation succeeds) | `OrderPlacedNotification` | Order owner | `order_placed` |
| Payment transitions to `paid` | `PaymentConfirmedNotification` | Order owner | `payment_confirmed` |

Notifications are created only after the underlying operation succeeds and inside the same database transaction as the payment state change, so retried webhooks or repeated transitions do not create duplicates.

## Admin Endpoints (requires `auth:sanctum` + admin permissions)

### Admin - Products
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/admin/products` | Paginated, searchable, filterable, sortable list (soft-deleted products excluded) |
| GET | `/admin/products/{product}` | Single product; soft-deleted products remain retrievable |
| POST | `/admin/products` | Create. Body: `{slug?, sku?, category_id?, price, stock, is_active, translations: [{locale, name, description?, meta_title?, meta_description?}]}` |
| PATCH | `/admin/products/{product}` | Update |
| DELETE | `/admin/products/{product}` | Soft delete |

**Authorization:** Listing requires `products.view`. Active staff holding `products.view` and `master_admin` (who bypasses permission checks) may list products. Customers and staff without the permission receive `403`.

**Query parameters for `GET /admin/products`:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `search` | string | Partial match against product translation `name` (any locale), `sku`, or `slug`. OR conditions are grouped so they cannot bypass other filters |
| `category_id` | integer | Must exist in `categories` |
| `collection_id` | integer | Must exist in `collections`; matches products attached to the collection |
| `is_active` | boolean | `1`/`true` or `0`/`false` |
| `min_price` | numeric | Inclusive lower bound, `>= 0` |
| `max_price` | numeric | Inclusive upper bound, `>= 0`; must be greater than or equal to `min_price` |
| `in_stock` | boolean | `1`/`true` for `stock > 0`, `0`/`false` for `stock = 0` |
| `created_from` | date | Inclusive lower bound on `created_at` |
| `created_to` | date | Inclusive upper bound; includes the entire end day. Must not be earlier than `created_from` |
| `sort` | string | `price`, `stock`, `created_at`, `is_active`, or `sku` (default `created_at`) |
| `direction` | string | `asc` or `desc` (default `desc`) |
| `page` | integer | Page number, minimum `1` |
| `per_page` | integer | Items per page, minimum `1`, maximum `100` (default `30`) |

Unknown query parameters are ignored. Invalid values for `category_id`, `collection_id`, `is_active`, `min_price`, `max_price`, `in_stock`, `created_from`, `created_to`, `sort`, `direction`, or out-of-range `per_page` return `422` with a validation error. The response uses the standard Laravel paginator envelope (`data`, `links`, `per_page`, `total`, etc.).

Example:
```
GET /api/v1/admin/products?search=shirt&category_id=3&collection_id=5&is_active=1&min_price=10&max_price=200&in_stock=1&sort=price&direction=asc&page=1&per_page=30
```

**Admin Product Image Routes**
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/admin/products/{product}/images` | Upload images (max 5, 10MB each). Returns 202 with pending images |
| POST | `/admin/products/{product}/images/{image}/replace` | Replace image. Returns 202 |
| PATCH | `/admin/products/{product}/images/{image}` | Update alt, sort_order, is_primary |
| DELETE | `/admin/products/{product}/images/{image}` | Soft delete image, schedules 7-day cleanup |

### Admin - Categories
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/admin/categories` | All with translations and children, includes soft-deleted |
| GET | `/admin/categories/{category}` | Single category with trashed |
| POST | `/admin/categories` | Create. Body: `{slug?, parent_id?, is_active, sort_order?, translations: [{locale, name, description?, meta_title?, meta_description?}]}` |
| PATCH | `/admin/categories/{category}` | Update |
| DELETE | `/admin/categories/{category}` | Soft delete |

### Admin - Collections
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/admin/collections` | All with translations and products, includes soft-deleted |
| GET | `/admin/collections/{collection}` | Single collection with trashed |
| POST | `/admin/collections` | Create. Body: `{slug?, is_active, sort_order?, translations: [...]}`|
| PATCH | `/admin/collections/{collection}` | Update |
| DELETE | `/admin/collections/{collection}` | Soft delete |

### Admin - Offers
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/admin/offers` | Paginated (30/page) |
| GET | `/admin/offers/{offer}` | Single offer with trashed |
| POST | `/admin/offers` | Create. Body: `{name, type, value?, buy_quantity?, get_quantity?, starts_at?, ends_at?, is_active?, product_ids: []}` |
| PATCH | `/admin/offers/{offer}` | Update |
| DELETE | `/admin/offers/{offer}` | Soft delete |

**Offer Types:**
- `percentage`: `value` = discount percentage (e.g., 10 for 10%)
- `fixed_price`: `value` = promotional price (e.g., 99.99)
- `buy_x_get_y`: `buy_quantity` and `get_quantity` (e.g., buy 2 get 1)

### Admin - Coupons
| Method | Endpoint                  | Description|------------------------------------------------------------------------------------
| GET    | `/admin/coupons`          | Paginated (30/page). Includes soft-deleted coupons                                           |
| GET    | `/admin/coupons/{coupon}` | Retrieve a single coupon, including soft-deleted coupons                                     |
| POST   | `/admin/coupons`          | Create a coupon. Body: `{code, discount_type, discount_amount, minimum_order?, usage_limit?, starts_at?, expires_at?, is_active?, product_ids?}` |
| PATCH  | `/admin/coupons/{coupon}` | Update a coupon. All body fields are optional                                               |
| DELETE | `/admin/coupons/{coupon}` | Soft-delete a coupon (204)                                                                  |                             |

**Permissions:** `coupons.view`, `coupons.create`, `coupons.update`, `coupons.delete`. `master_admin` bypasses permission checks.

**Validation:**

* `code`: required, string, max 255 characters, and unique. Codes belonging to soft-deleted coupons remain reserved.
* `discount_type`: `percentage` or `fixed`.
* `discount_amount`: numeric and greater than 0; percentage discounts cannot exceed 100.
* `minimum_order`: nullable numeric value greater than or equal to 0.
* `usage_limit`: nullable integer greater than or equal to 1.
* `starts_at`, `expires_at`: nullable valid dates; `expires_at` cannot be before `starts_at`.
* `is_active`: boolean when provided.
* `product_ids`: optional array of existing product IDs. A coupon can be created without linked products.

**Product linking behavior:**

* On creation, omitting `product_ids` creates a coupon without product links.
* On update, omitting `product_ids` preserves existing links.
* Providing a non-empty `product_ids` array replaces the existing product links.
* Providing `product_ids: []` removes all product links.

`used_count` and `created_by` are system-controlled and are not accepted as client-controlled values. `created_by` is assigned from the authenticated user when creating a coupon.


**Coupon Response:**
```json
{
  "data": {
    "id": 1,
    "code": "WELCOME10",
    "discount_type": "percentage",
    "discount_amount": "10.00",
    "minimum_order": "100.00",
    "usage_limit": 50,
    "used_count": 0,
    "starts_at": "2026-10-01T00:00:00.000000Z",
    "expires_at": "2026-12-31T23:59:59.000000Z",
    "is_active": true,
    "created_by": 1,
    "products": [{"id": 1, "slug": "...", ...}],
    "created_at": "2026-10-04T12:00:00.000000Z",
    "updated_at": "2026-10-04T12:00:00.000000Z"
  }
}
```

### Admin - Reviews
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/admin/reviews` | Paginated (30/page), includes soft-deleted |
| PATCH | `/admin/reviews/{review}/status` | Moderate. Body: `{status: approved|rejected}` |

### Admin - Wishlists
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/admin/wishlists` | Paginated list of all wishlist entries |
| GET | `/admin/wishlists/{wishlist}` | Single wishlist entry |

### Admin - Addresses
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/admin/addresses` | All user addresses |
| GET | `/admin/addresses/{address}` | Single address |
| PATCH | `/admin/addresses/{address}` | Update address |

### Admin - Users
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/admin/users` | Paginated, searchable, filterable, sortable list |
| GET | `/admin/users/{user}` | Single user |
| POST | `/admin/users` | Create staff/master_admin. Body: `{name, email, password, role, status, permissions?}` |
| PATCH | `/admin/users/{user}` | Update user |
| DELETE | `/admin/users/{user}` | Soft delete user |
| PATCH | `/admin/users/{user}/activate` | Activate user |
| PATCH | `/admin/users/{user}/deactivate` | Deactivate user |

**Authorization:** Listing requires the `users.view` permission. Active staff holding `users.view` and `master_admin` (who bypasses permission checks) may list every user, including customers, other staff, and the master-admin account. Customers and staff without the permission receive `403`. Listing users does **not** grant update, delete, or staff-management rights — those remain governed by the existing `UserPolicy::update`/`delete`/`manageStaff` rules (master-admin only).

**Query parameters for `GET /admin/users`:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `search` | string | Partial match against `name` or `email` (OR group, combined with all other filters using AND) |
| `role` | string | `master_admin`, `staff`, or `customer` |
| `status` | string | `active`, `inactive`, or `pending_approval` |
| `email_verified` | boolean | `1`/`true` for verified, `0`/`false` for unverified (filters on `email_verified_at`) |
| `created_from` | date | Inclusive lower bound on `created_at` |
| `created_to` | date | Inclusive upper bound; includes the entire end day. Must not be earlier than `created_from` |
| `sort` | string | `name`, `email`, `role`, `status`, or `created_at` (default `created_at`) |
| `direction` | string | `asc` or `desc` (default `desc`) |
| `page` | integer | Page number, minimum `1` |
| `per_page` | integer | Items per page, minimum `1`, maximum `100` (default `20`) |

Unknown query parameters are ignored. Invalid values for `role`, `status`, `email_verified`, `created_from`, `created_to`, `sort`, `direction`, or out-of-range `per_page` return `422` with a validation error. The response uses the standard `data` / `links` / `meta` envelope.

Example:
```
GET /api/v1/admin/users?search=alice&role=staff&status=active&email_verified=1&created_from=2026-01-01&created_to=2026-06-30&sort=created_at&direction=desc&page=1&per_page=20
```


### Admin - Orders
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/admin/orders` | Paginated list with filters |
| GET | `/admin/orders/{order}` | Order details with items, user, shipping method |

### Admin - Shipping Methods
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/admin/shipping-methods` | All shipping methods |
| GET | `/admin/shipping-methods/{shippingMethod}` | Single method |
| POST | `/admin/shipping-methods` | Create. Body: `{name, price, is_active, is_default}` |
| PATCH | `/admin/shipping-methods/{shippingMethod}` | Update |
| PATCH | `/admin/shipping-methods/{shippingMethod}/default` | Set as default (unsets others) |
| DELETE | `/admin/shipping-methods/{shippingMethod}` | Delete |

### Admin - Payments
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/admin/payments/{payment}/refund` | Refund payment. Body: `{amount?}` (minor units) |

### Admin - Invoices
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/admin/invoices` | Paginated (30/page), includes soft-deleted invoices and order/customer details |
| GET | `/admin/invoices/{invoice}` | Single invoice with order items and customer details |

Admin invoice filters: `search` (invoice number, order number, customer name/email), `issued_from`, `issued_to`, `page`, `per_page` (1-100). **Permissions:** `invoices.view`; `master_admin` bypasses permission checks.

### Admin - Invitations
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/admin/invitations` | Paginated (30/page) |
| POST | `/admin/invitations` | Create. Body: `{email, type: staff|master_admin}` → returns invitation + invitation_url |
| POST | `/admin/invitations/{invitation}/approve` | Approve accepted invitation |
| POST | `/admin/invitations/{invitation}/reject` | Reject invitation |
| POST | `/admin/invitations/{invitation}/revoke` | Revoke pending invitation |

## Public Invitation Endpoints
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/invitations/{token}` | View invitation details |
| POST | `/invitations/{token}/accept` | Accept invitation. Body: `{name, email, password, password_confirmation}` |

## Payment Webhooks
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/payments/stripe/webhook` | Stripe webhook |
| POST | `/payments/paymob/webhook` | Paymob webhook |

**Headers verified:**
- Stripe: `Stripe-Signature` (HMAC-SHA256 with timestamp)
- Paymob: `X-Paymob-Hmac` (HMAC-SHA512)

**Idempotency:** `payment_webhook_events` tracks events by `(gateway, event_id)`. Event recording, payment state changes, and the processed marker are committed atomically. Processed duplicates are no-ops; an event whose processing failed is retried rather than being permanently blocked.

## Pagination
Default 20 per page (30 for admin). Query parameter: `?page=1`
Response includes `links`, `meta` (Laravel standard).

`GET /products` additionally accepts `?per_page=1..100` (default 20).
`GET /admin/users` additionally accepts `?per_page=1..100` (default 20).
`GET /admin/products` additionally accepts `?per_page=1..100` (default 30).

Listings backed by API Resources (`/admin/users`, `/collections`) return the `data` / `links` / `meta` envelope. The raw-model listings (`/products`, `/admin/products`) return the native Laravel paginator shape (`data`, `links`, `per_page`, `total`, ...).

## Versioning
All endpoints prefixed with `/api/v1/`. Future versions at `/api/v2/`.