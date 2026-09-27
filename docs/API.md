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
| GET | `/products` | Paginated list (20/page). Query: `?page=1` |
| GET | `/products/{identifier}` | Single product. Format: `{slug}-{id}` |

**Product List Response:**
```json
{
  "data": [
    {
      "id": 1,
      "slug": "product-name",
      "sku": "SKU-001",
      "price": "99.99",
      "stock": 100,
      "is_active": true,
      "translations": [{"locale": "en", "name": "Product Name", "description": "..."}],
      "images": [{"path": "/storage/...", "alt": "...", "is_primary": true}],
      "category": {"id": 1, "slug": "category", "translations": [...]}
    }
  ],
  "links": {...},
  "meta": {...}
}
```

### Categories
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/categories` | Root categories with children and translations |

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
| POST | `/checkout` | Create order from cart. Body: `{shipping_address, gateway, payment_method?}` |

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
  "payment_method": "card"
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
  }
}
```

### Admin - Products
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/admin/products` | Paginated (30/page) |
| POST | `/admin/products` | Create. Body: `{slug, sku?, category_id?, price, stock, is_active, translations: [{locale, name, description?}]}` |
| PATCH | `/admin/products/{product}` | Update |
| DELETE | `/admin/products/{product}` | Delete |

### Admin - Categories
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/admin/categories` | All with translations and children |
| POST | `/admin/categories` | Create. Body: `{slug, parent_id?, is_active, translations: [{locale, name, description?}]}` |
| PATCH | `/admin/categories/{category}` | Update |
| DELETE | `/admin/categories/{category}` | Delete |

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

**Idempotency:** `payment_webhook_events` table tracks processed events by `(gateway, event_id)`

## Pagination
Default 20 per page. Query parameter: `?page=1`
Response includes `links`, `meta` (Laravel standard).

## Versioning
All endpoints prefixed with `/api/v1/`. Future versions at `/api/v2/`.