# Backend Architecture

## Framework
- **Laravel 12** (PHP 8.2+)
- **Sanctum 4** for authentication
- **Socialite 5** for OAuth (Google)
- **Intervention Image v3** for image processing

## Directory Structure
```
backend/
├── app/
│   ├── Actions/           # Single-responsibility action classes
│   │   └── CreateInvitation.php
│   ├── Console/
│   │   └── Commands/
│   │       ├── CleanupProductImages.php
│   │       └── ExpirePendingPayments.php
│   ├── Exceptions/
│   │   └── CartMergeException.php
│   ├── Filters/
│   │   ├── Admin/
│   │   │   ├── UserFilter.php
│   │   │   └── ProductFilter.php
│   │   └── Store/
│   │       └── ProductFilter.php
│   ├── Http/
│   │   ├── Controllers/
│   │   │   ├── Controller.php
│   │   │   └── Api/
│   │   │       ├── AddressController.php
│   │   │       ├── AuthController.php
│   │   │       ├── CartController.php
│   │   │       ├── CategoryController.php
│   │   │       ├── CheckoutController.php
│   │   │       ├── CollectionController.php
│   │   │       ├── CouponController.php
│   │   │       ├── GoogleAuthController.php
│   │   │       ├── InvitationController.php
│   │   │       ├── InvoiceController.php
│   │   │       ├── NotificationController.php
│   │   │       ├── OfferController.php
│   │   │       ├── OrderController.php
│   │   │       ├── PaymentController.php
│   │   │       ├── PaymentWebhookController.php
│   │   │       ├── ProductController.php
│   │   │       ├── ProductImageController.php
│   │   │       ├── ReviewController.php
│   │   │       ├── ShippingMethodController.php
│   │   │       ├── UserController.php
│   │   │       └── WishlistController.php
│   │   ├── Middleware/
│   │   │   └── EnsureFrontendRequestsAreStateful.php
│   │   └── Requests/
│   │       └── Auth/
│   │           ├── RegisterRequest.php
│   │           ├── LoginRequest.php
│   │           ├── ForgotPasswordRequest.php
│   │           ├── ResetPasswordRequest.php
│   │           ├── VerifyEmailRequest.php
│   │           └── TokenRequest.php
│   ├── Jobs/
│   │   ├── SendOrderConfirmation.php
│   │   ├── ProcessProductImage.php
│   │   └── PaymentExpirationJob.php
│   ├── Models/            # Eloquent models
│   │   ├── Address.php
│   │   ├── Cart.php
│   │   ├── CartItem.php
│   │   ├── Category.php
│   │   ├── CategoryTranslation.php
│   │   ├── Collection.php
│   │   ├── CollectionTranslation.php
│   │   ├── Coupon.php
│   │   ├── Invoice.php
│   │   ├── Offer.php
│   │   ├── Order.php
│   │   ├── OrderItem.php
│   │   ├── Payment.php
│   │   ├── Product.php
│   │   ├── ProductImage.php
│   │   ├── ProductImageCleanup.php
│   │   ├── ProductTranslation.php
│   │   ├── PushSubscription.php
│   │   ├── Review.php
│   │   ├── ShippingMethod.php
│   │   ├── User.php
│   │   └── Wishlist.php (pivot model not used)
│   ├── Notifications/
│   │   ├── OrderPlacedNotification.php
│   │   ├── PaymentConfirmedNotification.php
│   │   └── ResetPasswordNotification.php
│   ├── Policies/          # Authorization policies
│   │   ├── AddressPolicy.php
│   │   ├── CategoryPolicy.php
│   │   ├── CollectionPolicy.php
│   │   ├── CouponPolicy.php
│   │   ├── InvitationPolicy.php
│   │   ├── NotificationPolicy.php
│   │   ├── OfferPolicy.php
│   │   ├── PaymentPolicy.php
│   │   ├── ProductPolicy.php
│   │   ├── ReviewPolicy.php
│   │   ├── ShippingMethodPolicy.php
│   │   ├── UserPolicy.php
│   │   └── WishlistPolicy.php
│   ├── Providers/
│   │   └── AppServiceProvider.php
│   ├── Resources/
│   │   ├── AddressResource.php
│   │   ├── CartItemResource.php
│   │   ├── CartResource.php
│   │   ├── CategoryResource.php
│   │   ├── CategoryTranslationResource.php
│   │   ├── CollectionResource.php
│   │   ├── CollectionTranslationResource.php
│   │   ├── CouponResource.php
│   │   ├── InvoiceResource.php
│   │   ├── NotificationResource.php
│   │   ├── OfferResource.php
│   │   ├── OrderItemResource.php
│   │   ├── OrderResource.php
│   │   ├── PaymentResource.php
│   │   ├── ProductImageResource.php
│   │   ├── ProductResource.php
│   │   ├── ProductTranslationResource.php
│   │   ├── ReviewResource.php
│   │   ├── ShippingMethodResource.php
│   │   ├── UserResource.php
│   │   └── WishlistResource.php
│   └── Services/
│       ├── CartMergeService.php
│       ├── InvoiceService.php
│       └── Payments/
│           ├── PaymentGatewayManager.php
│           ├── PaymentInitiationService.php
│           ├── PaymentRefundService.php
│           ├── PaymentStateService.php
│           ├── PaymentWebhookService.php
│           └── Gateways/
│               ├── PaymobGateway.php
│               ├── PaymobWebhookHandler.php
│               ├── StripeGateway.php
│               └── StripeWebhookHandler.php
├── bootstrap/
│   └── app.php
├── config/
│   ├── app.php
│   ├── auth.php
│   ├── cache.php
│   ├── database.php
│   ├── ecommerce.php
│   ├── filesystems.php
│   ├── image.php
│   ├── mail.php
│   ├── logging.php
│   ├── product-images.php
│   ├── queue.php
│   ├── sanctum.php
│   ├── services.php
│   └── session.php
├── database/
│   ├── factories/
│   ├── migrations/
│   └── seeders/
├── routes/
│   ├── api.php
│   ├── web.php
│   └── console.php
├── tests/
│   ├── Feature/
│   │   ├── AuthTest.php
│   │   ├── AuthorizationTest.php
│   │   ├── CartMergeTest.php
│   │   ├── CartTest.php
│   │   ├── CategoryTest.php
│   │   ├── CheckoutTest.php
│   │   ├── CollectionDeleteTest.php
│   │   ├── CollectionIndexTest.php
│   │   ├── CollectionRelationshipTest.php
│   │   ├── CollectionTest.php
│   │   ├── CollectionUpdateTest.php
│   │   ├── CouponDeleteTest.php
│   │   ├── CouponTest.php
│   │   ├── CouponValidationTest.php
│   │   ├── ExampleTest.php
│   │   ├── GoogleAuthTest.php
│   │   ├── InvitationTest.php
│   │   ├── InvoiceTest.php
│   │   ├── NotificationTest.php
│   │   ├── OfferTest.php
│   │   ├── OrderTest.php
│   │   ├── PaymentTest.php
│   │   ├── PolicyTest.php
│   │   ├── ProductImageTest.php
│   │   ├── ProductTest.php
│   │   ├── ReviewTest.php
│   │   ├── ShippingMethodTest.php
│   │   ├── UserTest.php
│   │   └── WishlistTest.php
│   ├── TestCase.php
│   └── Unit/
│       └── ExampleTest.php
└── vendor/
```

## Key Components

### Controllers
All API controllers in `app/Http/Controllers/Api/`:

| Controller | Responsibility |
|------------|----------------|
| AuthController | Register, login, logout, me, password reset, email verification, mobile tokens |
| GoogleAuthController | Google OAuth redirect and callback |
| ProductController | Public listing/show + admin CRUD |
| CategoryController | Public tree + admin CRUD |
| CollectionController | Public listing/show + admin CRUD |
| CartController | Guest/user cart management |
| CheckoutController | Order creation from cart, applies offers/coupons |
| PaymentController | Payment initiation, refunds (admin) |
| PaymentWebhookController | Stripe/Paymob webhook handling |
| InvoiceController | Customer invoice list/show + admin invoice list/show |
| InvitationController | Staff/master_admin invitation flow |
| CouponController | Admin coupon CRUD (list, show, create, update, soft delete) |
| ReviewController | Public reviews + user reviews + admin moderation |
| WishlistController | User wishlist + admin view |
| AddressController | User address book + admin view |
| ShippingMethodController | Public list + admin CRUD |
| UserController | Admin user management |
| OrderController | Admin order listing/show |
| ProductImageController | Admin image upload, replace, update, delete with processing |
| OfferController | Admin offer CRUD |
| NotificationController | Authenticated user in-app notifications: list, unread count, mark one/all as read |

### Models
All models in `app/Models/`:

| Model | Key Relationships |
|-------|-------------------|
| User | role, status, permissions (JSON), approved_by, addresses, orders, reviews, pushSubscriptions, wishlist, cart, invitationsCreated, invitationsApproved, coupons, offers |
| Product | category, translations, images, collections, offers, reviews, orderItems, wishlistedBy, cartItems |
| Category | parent/children (self), translations, products |
| Collection | translations, products |
| CollectionTranslation | collection |
| ProductTranslation | product |
| ProductImage | product, variants, processing_status |
| ProductImageCleanup | disk, paths, delete_after |
| Cart | user (nullable), guest_token, items |
| CartItem | cart, product |
| Address | user |
| ShippingMethod | orders |
| Order | user, shipping_method, items, payments, invoice |
| OrderItem | order, product |
| Payment | order |
| Invoice | order |
| Offer | createdBy, products (belongsToMany via offer_products) |
| Coupon | createdBy, products (belongsToMany via coupon_products), SoftDeletes |
| Review | product, user |
| Invitation | createdBy, approvedBy |
| PushSubscription | user |

### Policies
- **ProductPolicy**: viewAny, create, update, delete → checks `canAdmin('products.*')`
- **CategoryPolicy**: viewAny, create, update, delete → checks `canAdmin('categories.*')`
- **CollectionPolicy**: viewAny, create, update, delete → checks `canAdmin('collections.*')`
- **CouponPolicy**: viewAny, view, create, update, delete → checks `canAdmin('coupons.*')`
- **OfferPolicy**: viewAny, view, create, update, delete → checks `canAdmin('offers.*')`
- **ReviewPolicy**: view, create, update, delete, viewAny, moderate → purchase verification for create, ownership for update/delete
- **UserPolicy**: viewAny, manageStaff, update, delete → `viewAny` allows active staff with `users.view` (master_admin bypasses); management actions remain master_admin only
- **AddressPolicy**: viewAny, view, create, update, delete, setDefault → ownership for user, admin for admin
- **PaymentPolicy**: view, refund → admin only for refund
- **InvoicePolicy**: viewAny, view → admin with `invoices.view` for admin lists, invoice owner or admin for individual invoices
- **ShippingMethodPolicy**: viewAny, create, update, delete, setDefault → admin only
- **WishlistPolicy**: view, create, delete → ownership
- **InvitationPolicy**: viewAny, create, approve, reject, revoke → admin
- **NotificationPolicy**: view, update → ownership; registered for `Illuminate\Notifications\DatabaseNotification` (no custom model, per ADR-003)

### Services
- **PaymentStateService**: Enforces payment state transitions, validates amounts, triggers order confirmation, atomically records a durable invoice-issuance work item, creates the payment-confirmed in-app notification, and restores stock on expiry
- **InvoiceService**: Issues one invoice per confirmed order inside a transaction, snapshots order financial totals, generates a deterministic `INV-` number, and returns the existing invoice on retries
- **PaymentInitiationService**: Creates payment intent (Stripe) or intention (Paymob), returns client_secret
- **PaymentRefundService**: Processes refunds via gateway
- **PaymentGatewayManager**: Resolves gateway by name (stripe/paymob)
- **PaymentWebhookService**: Handles webhook idempotency atomically, delegates to gateway handlers, applies state transitions, and allows failed processing to be retried
- **CartMergeService**: Merges guest cart into user cart on login/register, validates stock

### Actions
- **CreateInvitation**: Generates secure token, creates invitation record

### Notifications
- **ResetPasswordNotification**: Custom password reset email with frontend URL
- **OrderPlacedNotification**: Database notification sent to the order owner after checkout succeeds (payload type `order_placed`)
- **PaymentConfirmedNotification**: Database notification sent to the order owner when a payment transitions to `paid` (payload type `payment_confirmed`)

### Middleware
- **EnsureFrontendRequestsAreStateful**: Custom Sanctum middleware that only starts session for SPA requests (not Bearer token requests)

### Jobs
- **SendOrderConfirmation**: Queued after payment confirmed (currently only logs, no email sent)
- **IssueOrderInvoice**: Processes durable invoice-issuance work with bounded retries, backoff, and idempotent invoice creation
- **ProcessProductImage**: Processes uploaded images to WebP variants (thumbnail/card/detail), handles replacement cleanup
- **PaymentExpirationJob**: Expires pending payments, restores stock

### Console Commands
- **CleanupProductImages**: Permanently deletes expired product image files after 7-day retention
- **ExpirePendingPayments**: Finds and expires pending payments past their expiry
- **DispatchPendingInvoiceIssuances**: Dispatches due or stale `invoice_issuances` work; scheduled every minute

## Configuration

### config/ecommerce.php
```php
return [
    'invitation_days' => env('INVITATION_EXPIRY_DAYS', 7),
    'payment_gateway' => env('PAYMENT_GATEWAY', 'stripe'),
];
```

### config/product-images.php
```php
return [
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
];
```

### config/sanctum.php
- `stateful` domains: localhost:3000, localhost:8000, 127.0.0.1:8000
- `guard`: ['web']
- `expiration`: null (no token expiry for SPA)
- Middleware: authenticate_session, encrypt_cookies, validate_csrf_token, stateful (custom)

### config/auth.php
- Default guard: `web` (session)
- Provider: `users` (Eloquent, User model)
- Password reset: 60 min expiry, 60 sec throttle

## Routing
All API routes in `routes/api.php`:
- Public: products, categories, collections, cart, auth/register, auth/login, auth/forgot-password, auth/reset-password, google/redirect, google/callback, invitations/{token}, invitations/{token}/accept, shipping-methods, reviews
- Authenticated (auth:sanctum): auth/me, auth/logout, auth/tokens, auth/email/verify, auth/email/verification-notification, checkout, payments/{payment}/initiate, invoices, invoices/{invoice}, reviews/mine, reviews CRUD, wishlist CRUD, addresses CRUD, notifications, notifications/unread-count, notifications/{notification}/read, notifications/read-all, admin/* (including admin/invoices)
- Webhooks: payments/{gateway}/webhook (no auth, signature verified)
- Rate limited: auth (5/min), invitations (10/min), webhooks (60/min)

## Database
- MySQL via Eloquent ORM.
- Migrations are maintained in `database/migrations/`.
- Foreign-key delete behavior is defined per relationship, including `cascadeOnDelete` and `nullOnDelete` where appropriate.
- Invoice `order_id` uses `restrictOnDelete`, so an order with an invoice cannot be hard-deleted and financial history is preserved.
- Coupon and offer creator references use `nullOnDelete` to preserve records when their creator is deleted.
- Soft deletes are enabled on selected catalog and historical records, including coupons.
- JSON columns store flexible data such as permissions, shipping addresses, gateway metadata, and image variants.


## Testing
* PHPUnit in `tests/`
* Run tests with `php artisan test`.
* Feature tests cover authentication, authorization, policies, catalog, invitations, coupons, offers, cart, checkout, payments, invoices, product images, reviews, wishlists, addresses, shipping methods, and in-app notifications.
* **Full test suite:** 251 tests passed, 981 assertions.


## Queue/Jobs
- **SendOrderConfirmation** job queued after payment confirmed
- **IssueOrderInvoice** job queued after commit and also dispatched from the recovery sweep; 5 attempts with 60s/300s/900s/1800s backoff
- **ProcessProductImage** job queued on image upload/replacement
- **PaymentExpirationJob** for expiring pending payments
- Database queue driver (configured in .env)
- Invoice work is stored in `invoice_issuances` in the same transaction as the paid/confirmed state, so a missing or failed queue dispatch is recoverable

## Scheduled Tasks
- `product-images:cleanup` - daily, removes expired image files
- `payments:expire-pending` - runs every minute, expires pending payments
- `invoices:dispatch-pending` - runs every minute, dispatches due invoice issuance work

## Security
- Validation uses Form Requests and inline validation where appropriate.
- Form Requests for authentication endpoints
- Policies for authorization
- CSRF via Sanctum for web
- Rate limiting on public endpoints
- Webhook signature verification (Stripe HMAC-SHA256, Paymob HMAC-SHA512)
- SQL injection prevention via Eloquent
- Password hashing via bcrypt
- Custom password reset notification with frontend URL
- Idempotency for webhooks via `payment_webhook_events` table