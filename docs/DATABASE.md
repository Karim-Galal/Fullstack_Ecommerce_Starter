# Database Schema

## Overview
Single-store ecommerce database. All tables use `unsignedBigInteger` foreign keys with cascade delete. No `store_id` columns. Selected tables use Soft Deletes for audit trail and historical data preservation.

## Entity Relationship Diagram

```
┌─────────────┐       ┌──────────────────┐       ┌─────────────────┐
│   users     │       │   categories     │       │   products      │
├─────────────┤       ├──────────────────┤       ├─────────────────┤
│ id (PK)     │       │ id (PK)          │       │ id (PK)         │
│ name        │       │ parent_id (FK)   │◄──────│ category_id(FK) │
│ email (UQ)  │       │ slug (UQ)        │       │ slug (UQ)       │
│ password    │       │ is_active        │       │ sku (UQ, null)  │
│ role        │       │ sort_order       │       │ price           │
│ status      │       │ created_at       │       │ stock           │
│ permissions │       │ updated_at       │       │ is_active       │
│ google_id   │       └────────┬─────────┘       │ created_at      │
│ approved_at │                │                 │ updated_at      │
│ approved_by │                ▼                 └────────┬────────┘
│ created_at  │       ┌──────────────────┐              │
│ updated_at  │       │category_translations            │
└─────────────┘       ├──────────────────┤              ▼
                      │ id (PK)          │       ┌─────────────────┐
                      │ category_id (FK) │       │ product_images  │
                      │ locale           │       ├─────────────────┤
                      │ name             │       │ id (PK)         │
                      │ description      │       │ product_id (FK) │
                      │ meta_title       │       │ path            │
                      │ meta_description │       │ alt             │
                      └──────────────────┘       │ sort_order      │
                                                │ is_primary      │
                      ┌──────────────────┐       │ created_at      │
                      │product_translations      │ updated_at      │
                      ├──────────────────┤       └─────────────────┘
                      │ id (PK)          │
                      │ product_id (FK)  │
                      │ locale           │
                      │ name             │
                      │ description      │
                      │ meta_title       │
                      │ meta_description │
                      └──────────────────┘

┌─────────────┐       ┌─────────────┐       ┌─────────────────┐
│   carts     │       │  cart_items │       │    orders       │
├─────────────┤       ├─────────────┤       ├─────────────────┤
│ id (PK)     │       │ id (PK)     │       │ id (PK)         │
│ user_id(FK) │◄──────│ cart_id(FK) │       │ user_id (FK)    │
│ guest_token │       │ product_id(FK)       │ shipping_method_id
│ created_at  │       │ quantity    │       │ number (UQ)     │
│ updated_at  │       └─────────────┘       │ status          │
└─────────────┘                             │ currency        │
                                            │ subtotal        │
┌─────────────────┐                         │ discount_total  │
│  order_items    │                         │ shipping_total  │
├─────────────────┤                         │ total           │
│ id (PK)         │                         │ shipping_address│
│ order_id (FK)   │◄────────────────────────│ created_at      │
│ product_id(FK)  │                         │ updated_at      │
│ name            │                         └────────┬────────┘
│ sku             │                                  │
│ unit_price      │                                  ▼
│ quantity        │                         ┌─────────────────┐
│ line_total      │                         │   payments      │
└─────────────────┘                         ├─────────────────┤
                                            │ id (PK)         │
┌─────────────────┐                         │ order_id (FK)   │
│  invoices       │                         │ amount          │
├─────────────────┤                         │ currency        │
│ id (PK)         │                         │ gateway         │
│ order_id (FK,UQ)│◄────────────────────────│ payment_method  │
│ number (UQ)     │                         │ status          │
│ status          │                         │ transaction_ref │
│ currency        │                         │ gateway_ref     │
│ subtotal        │                         │ paid_at         │
│ discount_total  │                         │ gateway_metadata│
│ shipping_total  │                         │ created_at      │
│ total           │                         │ updated_at      │
│ issued_at       │                         └─────────────────┘
│ created_at      │
│ updated_at      │
└─────────────────┘

┌──────────────────────┐        ┌──────────────────────────┐
│     collections      │        │ collection_translations  │
├──────────────────────┤        ├──────────────────────────┤
│ id (PK)              │        │ id (PK)                  │
│ slug (UQ)            │        │ collection_id (FK)       │
│ is_active            │        │ locale                   │
│ created_at           │        │ name                     │
│ updated_at           │        │ description              │
└──────────────────────┘        │ meta_title               │
                                 │ meta_description         │
┌──────────────────────┐        │ created_at               │
│ collection_product   │        │ updated_at               │
├──────────────────────┤        └──────────────────────────┘
│ collection_id (FK)   │
│ product_id (FK)      │
│ PK(collection_id,    │
│   product_id)        │
└──────────────────────┘

┌─────────────────┐       ┌─────────────────────┐
│     offers      │       │   offer_products    │
├─────────────────┤       ├─────────────────────┤
│ id (PK)         │       │ id (PK)             │
│ name            │       │ offer_id (FK)       │
│ type            │       │ product_id (FK)     │
│ value           │       │ created_at          │
│ buy_quantity    │       │ updated_at          │
│ get_quantity    │       │ UQ(offer_id,        │
│ starts_at       │       │   product_id)       │
│ ends_at         │       └─────────────────────┘
│ is_active       │
│ created_at      │
│ updated_at      │
└─────────────────┘

┌─────────────────────┐       ┌─────────────────────┐
│ push_subscriptions  │       │   notifications     │
├─────────────────────┤       ├─────────────────────┤
│ id (PK)             │       │ id (PK, UUID)       │
│ user_id (FK)        │       │ type                │
│ endpoint            │       │ notifiable_type     │
│ public_key          │       │ notifiable_id       │
│ auth_token          │       │ data (TEXT)         │
│ content_encoding    │       │ read_at             │
│ created_at          │       │ created_at          │
│ updated_at          │       │ updated_at          │
│ UQ(user_id,         │       └─────────────────────┘
│   endpoint)         │
└─────────────────────┘

Other tables:
- coupons
- reviews
- wishlists (pivot: user_id, product_id)
- shipping_methods
- addresses
- payment_webhook_events (idempotency for webhooks)
- invitations
- password_reset_tokens, sessions (Laravel defaults)
- personal_access_tokens (Sanctum)
```

## Table Details

### users
| Column | Type | Constraints |
|--------|------|-------------|
| id | unsignedBigInteger | PK, AI |
| name | string(255) | |
| email | string(255) | UQ |
| email_verified_at | timestamp | nullable |
| password | string(255) | hashed |
| role | string(50) | default: 'customer' |
| status | string(50) | default: 'active' |
| permissions | json | nullable |
| google_id | string(255) | nullable, UQ |
| approved_at | timestamp | nullable |
| approved_by | unsignedBigInteger | nullable, FK users.id nullOnDelete |
| remember_token | string(100) | nullable |
| deleted_at | timestamp | nullable |
| created_at | timestamp | |
| updated_at | timestamp | |

**Roles**: `master_admin`, `staff`, `customer`
**Statuses**: `active`, `pending_approval`, `rejected`

### categories
| Column | Type | Constraints |
|--------|------|-------------|
| id | unsignedBigInteger | PK, AI |
| parent_id | unsignedBigInteger | nullable, FK categories.id nullOnDelete |
| slug | string(255) | UQ |
| is_active | boolean | default: true |
| sort_order | unsignedInteger | default: 0 |
| deleted_at | timestamp | nullable |
| created_at | timestamp | |
| updated_at | timestamp | |

### products
| Column | Type | Constraints |
|--------|------|-------------|
| id | unsignedBigInteger | PK, AI |
| category_id | unsignedBigInteger | nullable, FK categories.id nullOnDelete |
| slug | string(255) | UQ |
| sku | string(100) | nullable, UQ |
| price | decimal(12,2) | |
| stock | unsignedInteger | default: 0 |
| is_active | boolean | default: true |
| deleted_at | timestamp | nullable |
| created_at | timestamp | |
| updated_at | timestamp | |

### collections
| Column | Type | Constraints |
|--------|------|-------------|
| id | unsignedBigInteger | PK, AI |
| slug | string(255) | UQ |
| is_active | boolean | default: true |
| deleted_at | timestamp | nullable |
| created_at | timestamp | |
| updated_at | timestamp | |

### carts
| Column | Type | Constraints |
|--------|------|-------------|
| id | unsignedBigInteger | PK, AI |
| user_id | unsignedBigInteger | nullable, FK users.id cascadeOnDelete |
| guest_token | uuid | nullable, UQ |
| created_at | timestamp | |
| updated_at | timestamp | |

### orders
| Column | Type | Constraints |
|--------|------|-------------|
| id | unsignedBigInteger | PK, AI |
| user_id | unsignedBigInteger | nullable, FK users.id nullOnDelete |
| shipping_method_id | unsignedBigInteger | nullable, FK shipping_methods.id nullOnDelete |
| number | string(50) | UQ |
| status | string(50) | default: 'pending', index |
| currency | string(3) | |
| subtotal | decimal(12,2) | |
| discount_total | decimal(12,2) | default: 0 |
| shipping_total | decimal(12,2) | default: 0 |
| total | decimal(12,2) | |
| shipping_address | json | |
| deleted_at | timestamp | nullable |
| created_at | timestamp | |
| updated_at | timestamp | |

### payments
| Column | Type | Constraints |
|--------|------|-------------|
| id | unsignedBigInteger | PK, AI |
| order_id | unsignedBigInteger | FK orders.id cascadeOnDelete |
| amount | decimal(12,2) | |
| currency | string(3) | |
| gateway | string(50) | 'stripe' or 'paymob' |
| payment_method | string(100) | nullable |
| status | string(50) | default: 'unpaid', index |
| transaction_reference | string(100) | UQ |
| gateway_reference | string(100) | nullable, index |
| paid_at | timestamp | nullable |
| gateway_metadata | json | nullable |
| deleted_at | timestamp | nullable |
| created_at | timestamp | |
| updated_at | timestamp | |

### invoices
| Column | Type | Constraints |
|--------|------|-------------|
| id | unsignedBigInteger | PK, AI |
| order_id | unsignedBigInteger | FK orders.id cascadeOnDelete, UQ |
| number | string(50) | UQ |
| status | string(50) | default: 'issued' |
| currency | string(3) | |
| subtotal | decimal(12,2) | |
| discount_total | decimal(12,2) | default: 0 |
| shipping_total | decimal(12,2) | default: 0 |
| total | decimal(12,2) | |
| issued_at | timestamp | nullable |
| deleted_at | timestamp | nullable |
| created_at | timestamp | |
| updated_at | timestamp | |

### offers
| Column | Type | Constraints |
|--------|------|-------------|
| id | unsignedBigInteger | PK, AI |
| name | string(255) | |
| type | string(50) | 'percentage', 'fixed_price', 'buy_x_get_y' |
| value | decimal(12,2) | nullable |
| buy_quantity | unsignedInteger | nullable |
| get_quantity | unsignedInteger | nullable |
| starts_at | timestamp | nullable |
| ends_at | timestamp | nullable |
| is_active | boolean | default: true |
| deleted_at | timestamp | nullable |
| created_at | timestamp | |
| updated_at | timestamp | |

### offer_products (pivot)
| Column | Type | Constraints |
|--------|------|-------------|
| id | unsignedBigInteger | PK, AI |
| offer_id | unsignedBigInteger | FK offers.id cascadeOnDelete |
| product_id | unsignedBigInteger | FK products.id cascadeOnDelete |
| created_at | timestamp | |
| updated_at | timestamp | |
| UQ(offer_id, product_id) | | |

### push_subscriptions
| Column | Type | Constraints |
|--------|------|-------------|
| id | unsignedBigInteger | PK, AI |
| user_id | unsignedBigInteger | FK users.id cascadeOnDelete |
| endpoint | text | |
| public_key | text | |
| auth_token | text | |
| content_encoding | string(50) | nullable |
| created_at | timestamp | |
| updated_at | timestamp | |
| UQ(user_id, endpoint) | | |

### coupons
| Column | Type | Constraints |
|--------|------|-------------|
| id | unsignedBigInteger | PK, AI |
| code | string(100) | UQ |
| discount_type | string(50) | 'percentage' or 'fixed' |
| discount_amount | decimal(12,2) | |
| minimum_order | decimal(12,2) | nullable |
| usage_limit | unsignedInteger | nullable |
| used_count | unsignedInteger | default: 0 |
| starts_at | timestamp | nullable |
| expires_at | timestamp | nullable |
| is_active | boolean | default: true |
| created_at | timestamp | |
| updated_at | timestamp | |

### reviews
| Column | Type | Constraints |
|--------|------|-------------|
| id | unsignedBigInteger | PK, AI |
| product_id | unsignedBigInteger | FK products.id cascadeOnDelete |
| user_id | unsignedBigInteger | FK users.id cascadeOnDelete |
| rating | unsignedTinyInteger | |
| comment | text | nullable |
| status | string(50) | default: 'pending' |
| deleted_at | timestamp | nullable |
| created_at | timestamp | |
| updated_at | timestamp | |
| UQ(product_id, user_id) | | |

### wishlists (pivot)
| Column | Type | Constraints |
|--------|------|-------------|
| id | unsignedBigInteger | PK, AI |
| user_id | unsignedBigInteger | FK users.id cascadeOnDelete |
| product_id | unsignedBigInteger | FK products.id cascadeOnDelete |
| created_at | timestamp | |
| updated_at | timestamp | |
| UQ(user_id, product_id) | | |

### shipping_methods
| Column | Type | Constraints |
|--------|------|-------------|
| id | unsignedBigInteger | PK, AI |
| name | string(255) | |
| price | decimal(12,2) | |
| is_active | boolean | default: true |
| created_at | timestamp | |
| updated_at | timestamp | |

### addresses
| Column | Type | Constraints |
|--------|------|-------------|
| id | unsignedBigInteger | PK, AI |
| user_id | unsignedBigInteger | FK users.id cascadeOnDelete |
| name | string(255) | |
| phone | string(50) | |
| line1 | string(255) | |
| line2 | string(255) | nullable |
| city | string(100) | |
| country | string(2) | |
| postal_code | string(20) | nullable |
| is_default | boolean | default: false |
| deleted_at | timestamp | nullable |
| created_at | timestamp | |
| updated_at | timestamp | |

### invitations
| Column | Type | Constraints |
|--------|------|-------------|
| id | unsignedBigInteger | PK, AI |
| invited_email | string(255) | |
| token_hash | string(64) | UQ |
| type | string(50) | 'staff' or 'master_admin' |
| created_by | unsignedBigInteger | FK users.id cascadeOnDelete |
| status | string(50) | default: 'pending', index |
| expires_at | timestamp | |
| accepted_at | timestamp | nullable |
| approved_at | timestamp | nullable |
| approved_by | unsignedBigInteger | nullable, FK users.id nullOnDelete |
| rejected_at | timestamp | nullable |
| revoked_at | timestamp | nullable |
| created_at | timestamp | |
| updated_at | timestamp | |
| index(invited_email) | | |

### notifications
| Column | Type | Constraints |
|--------|------|-------------|
| id | uuid | PK |
| type | string(255) | |
| notifiable_type | string(255) | morphs |
| notifiable_id | unsignedBigInteger | morphs |
| data | text | |
| read_at | timestamp | nullable |
| created_at | timestamp | |
| updated_at | timestamp | |

### payment_webhook_events
| Column | Type | Constraints |
|--------|------|-------------|
| id | unsignedBigInteger | PK, AI |
| gateway | string(50) | |
| event_id | string(100) | |
| payload_hash | string(64) | |
| processed_at | timestamp | nullable |
| created_at | timestamp | |
| updated_at | timestamp | |
| UQ(gateway, event_id) | | |

## Indexes
- `users`: email (UQ), role, status, google_id (UQ), deleted_at
- `categories`: slug (UQ), parent_id, deleted_at
- `products`: slug (UQ), sku (UQ), category_id, is_active, deleted_at
- `collections`: slug (UQ), deleted_at
- `carts`: user_id, guest_token (UQ)
- `orders`: number (UQ), status, user_id, deleted_at
- `payments`: transaction_reference (UQ), gateway_reference, status, order_id, deleted_at
- `invoices`: order_id (UQ), number (UQ), deleted_at
- `offers`: is_active, deleted_at
- `offer_products`: UQ(offer_id, product_id)
- `push_subscriptions`: UQ(user_id, endpoint)
- `coupons`: code (UQ)
- `reviews`: UQ(product_id, user_id), deleted_at
- `wishlists`: UQ(user_id, product_id)
- `shipping_methods`: is_active
- `addresses`: user_id, deleted_at
- `invitations`: token_hash (UQ), status, created_by, invited_email
- `notifications`: notifiable_type + notifiable_id (morphs)

## Migrations
1. `0001_01_01_000000_create_users_table.php` - users + password_reset_tokens + sessions
2. `2026_09_06_000001_create_categories_table.php`
3. `2026_09_06_000002_create_category_translations_table.php`
4. `2026_09_06_000002_create_payment_webhook_events_table.php`
5. `2026_09_06_000003_create_collections_table.php`
6. `2026_09_06_000004_create_products_table.php`
7. `2026_09_06_000005_create_product_translations_table.php`
8. `2026_09_06_000006_create_product_images_table.php`
9. `2026_09_06_000007_create_collection_product_table.php`
10. `2026_09_06_000008_create_carts_table.php`
11. `2026_09_06_000009_create_cart_items_table.php`
12. `2026_09_06_000010_create_addresses_table.php`
13. `2026_09_06_000011_create_shipping_methods_table.php`
14. `2026_09_06_000012_create_orders_table.php`
15. `2026_09_06_000013_create_order_items_table.php`
16. `2026_09_06_000014_create_payments_table.php`
17. `2026_09_06_000015_create_coupons_table.php`
17. `2026_09_06_000016_create_reviews_table.php`
18. `2026_09_06_000017_create_wishlists_table.php`
19. `2026_09_06_000018_create_invitations_table.php`
20. `2026_09_25_093937_create_collection_translations_table.php`
21. `2026_09_25_182657_create_invoices_table.php`
22. `2026_09_25_182714_create_offers_table.php`
23. `2026_09_25_182725_create_offer_products_table.php`
24. `2026_09_25_182732_create_push_subscriptions_table.php`
25. `2026_09_25_182911_create_notifications_table.php`
26. `2026_09_06_112215_create_personal_access_tokens_table.php`
27. `2026_09_28_092321_add_deleted_at_to_products_table.php`
28. `2026_09_28_092336_add_deleted_at_to_categories_table.php`
29. `2026_09_28_092454_add_deleted_at_to_collections_table.php`
29. `2026_09_28_092510_add_deleted_at_to_offers_table.php`
30. `2026_09_28_092524_add_deleted_at_to_reviews_table.php`
31. `2026_09_28_092541_add_deleted_at_to_orders_table.php`
32. `2026_09_28_092605_add_deleted_at_to_invoices_table.php`
33. `2026_09_28_092621_add_deleted_at_to_payments_table.php`
34. `2026_09_28_092638_add_deleted_at_to_users_table.php`
35. `2026_09_28_092707_add_deleted_at_to_addresses_table.php`