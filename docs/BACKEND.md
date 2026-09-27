# Backend Architecture

## Framework
- **Laravel 12** (PHP 8.2+)
- **Sanctum 4** for authentication
- **Socialite 5** for OAuth (Google)

## Directory Structure
```
backend/
├── app/
│   ├── Actions/           # Single-responsibility action classes
│   │   └── CreateInvitation.php
│   ├── Http/
│   │   ├── Controllers/
│   │   │   ├── Controller.php
│   │   │   └── Api/
│   │   │       ├── AuthController.php
│   │   │       ├── GoogleAuthController.php
│   │   │       ├── ProductController.php
│   │   │       ├── CategoryController.php
│   │   │       ├── CartController.php
│   │   │       ├── CheckoutController.php
│   │   │       ├── PaymentWebhookController.php
│   │   │       └── InvitationController.php
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
│   ├── Models/            # Eloquent models
│   │   ├── User.php
│   │   ├── Product.php
│   │   ├── Category.php
│   │   ├── ProductTranslation.php
│   │   ├── ProductImage.php
│   │   ├── CategoryTranslation.php
│   │   ├── Collection.php
│   │   ├── CollectionTranslation.php
│   │   ├── Cart.php
│   │   ├── CartItem.php
│   │   ├── Address.php
│   │   ├── ShippingMethod.php
│   │   ├── Order.php
│   │   ├── OrderItem.php
│   │   ├── Payment.php
│   │   ├── Invoice.php
│   │   ├── Offer.php
│   │   ├── Coupon.php
│   │   ├── Review.php
│   │   ├── Invitation.php
│   │   └── PushSubscription.php
│   ├── Notifications/
│   │   └── ResetPasswordNotification.php
│   ├── Policies/          # Authorization policies
│   │   ├── ProductPolicy.php
│   │   ├── CategoryPolicy.php
│   │   └── UserPolicy.php
│   ├── Providers/
│   │   └── AppServiceProvider.php
│   ├── Resources/
│   │   └── UserResource.php
│   └── Services/
│       └── Payments/
│           └── PaymentStateService.php
├── bootstrap/
│   └── app.php
├── config/
│   ├── app.php
│   ├── auth.php
│   ├── database.php
│   ├── ecommerce.php
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
| CartController | Guest/user cart management |
| CheckoutController | Order creation from cart |
| PaymentWebhookController | Stripe/Paymob webhook handling |
| InvitationController | Staff/master_admin invitation flow |

### Models
All models in `app/Models/`:

| Model | Key Relationships |
|-------|-------------------|
| User | role, status, permissions (JSON), approved_by, addresses, orders, reviews, pushSubscriptions, wishlist, cart, invitationsCreated, invitationsApproved, sendPasswordResetNotification |
| Product | category, translations, images, collections, offers, reviews, orderItems, wishlistedBy, cartItems |
| Category | parent/children (self), translations, products |
| Collection | translations, products |
| CollectionTranslation | collection |
| Cart | user (nullable), guest_token, items |
| CartItem | cart, product |
| Address | user |
| ShippingMethod | orders |
| Order | user, shipping_method, items, payments, invoice |
| OrderItem | order, product |
| Payment | order |
| Invoice | order |
| Offer | products (belongsToMany via offer_products) |
| Coupon | - |
| Review | product, user |
| Invitation | createdBy, approvedBy |
| PushSubscription | user |

### Policies
- **ProductPolicy**: viewAny, create, update, delete → checks `canAdmin('products.*')`
- **CategoryPolicy**: viewAny, create, update, delete → checks `canAdmin('categories.*')`
- **UserPolicy**: manageStaff, update, delete → master_admin only

### Services
- **PaymentStateService**: Enforces payment state transitions, validates amounts, triggers order confirmation

### Actions
- **CreateInvitation**: Generates secure token, creates invitation record

### Notifications
- **ResetPasswordNotification**: Custom password reset email with frontend URL

### Middleware
- **EnsureFrontendRequestsAreStateful**: Custom Sanctum middleware that only starts session for SPA requests (not Bearer token requests)

## Configuration

### config/ecommerce.php
```php
return [
    'invitation_days' => env('INVITATION_EXPIRY_DAYS', 7),
    'payment_gateway' => env('PAYMENT_GATEWAY', 'stripe'),
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
- Public: products, categories, cart, auth/register, auth/login, auth/forgot-password, auth/reset-password, google/redirect, google/callback, invitations/{token}, invitations/{token}/accept
- Authenticated (auth:sanctum): auth/me, auth/logout, auth/tokens, auth/email/verify, auth/email/verification-notification, checkout, admin/*
- Webhooks: payments/{gateway}/webhook (no auth, signature verified)
- Rate limited: auth (5/min), invitations (10/min), webhooks (60/min)

## Database
- MySQL via Eloquent ORM
- Migrations in `database/migrations/` (26 migrations)
- Foreign keys with cascade delete
- No soft deletes
- JSON columns for flexible data (permissions, shipping_address, gateway_metadata)

## Testing
- PHPUnit in `tests/`
- Run: `php artisan test`
- Feature tests for authentication, authorization, policies
- 36 tests passing (122 assertions)

## Queue/Jobs
- **SendOrderConfirmation** job queued after payment confirmed
- Database queue driver (configured in .env)
- Retry: 3 attempts with exponential backoff (30s, 120s, 300s)

## Security
- Input validation in controllers (`$request->validate()`)
- Form Requests for authentication endpoints
- Policies for authorization
- CSRF via Sanctum for web
- Rate limiting on public endpoints
- Webhook signature verification
- SQL injection prevention via Eloquent
- Password hashing via bcrypt
- Custom password reset notification with frontend URL