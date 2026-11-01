<?php

use App\Http\Controllers\Api\AddressController;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\CartController;
use App\Http\Controllers\Api\CategoryController;
use App\Http\Controllers\Api\CheckoutController;
use App\Http\Controllers\Api\CollectionController;
use App\Http\Controllers\Api\CouponController;
use App\Http\Controllers\Api\GoogleAuthController;
use App\Http\Controllers\Api\InvitationController;
use App\Http\Controllers\Api\InvoiceController;
use App\Http\Controllers\Api\NotificationController;
use App\Http\Controllers\Api\OfferController;
use App\Http\Controllers\Api\OrderController;
use App\Http\Controllers\Api\PaymentController;
use App\Http\Controllers\Api\PaymentWebhookController;
use App\Http\Controllers\Api\ProductController;
use App\Http\Controllers\Api\ProductImageController;
use App\Http\Controllers\Api\ReviewController;
use App\Http\Controllers\Api\ShippingMethodController;
use App\Http\Controllers\Api\UserController;
use App\Http\Controllers\Api\WishlistController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Payment Webhook Routes
|--------------------------------------------------------------------------
*/

Route::post(
    'v1/payments/{gateway}/webhook',
    [PaymentWebhookController::class, 'handle']
)->middleware('throttle:60,1');

Route::prefix('v1')->group(function () {

    /*
    |--------------------------------------------------------------------------
    | Authentication Routes
    |--------------------------------------------------------------------------
    */

    Route::middleware('throttle:auth')->prefix('auth')->group(function () {
        Route::post('register', [AuthController::class, 'register']);
        Route::post('login', [AuthController::class, 'login']);
        Route::post('forgot-password', [AuthController::class, 'forgot']);
        Route::post('reset-password', [AuthController::class, 'reset']);
    });

    Route::prefix('auth')->group(function () {
        Route::get(
            'email/verify/{id}/{hash}',
            [AuthController::class, 'verifyEmail']
        )->name('verification.verify');

        Route::post(
            'email/verification-notification',
            [AuthController::class, 'resendVerificationEmail']
        )
            ->middleware('auth:sanctum')
            ->name('verification.send');
    });

    /*
    |--------------------------------------------------------------------------
    | Public Product Routes
    |--------------------------------------------------------------------------
    */

    Route::get('products', [ProductController::class, 'index']);
    Route::get('products/{identifier}', [ProductController::class, 'show']);

    /*
    |--------------------------------------------------------------------------
    | Public Category Routes
    |--------------------------------------------------------------------------
    */

    Route::get('categories', [CategoryController::class, 'index']);

    /*
    |--------------------------------------------------------------------------
    | Public Collection Routes
    |--------------------------------------------------------------------------
    */

    Route::get('collections', [CollectionController::class, 'index']);
    Route::get('collections/{identifier}', [CollectionController::class, 'show']);

    /*
    |--------------------------------------------------------------------------
    | Public Cart Routes
    |--------------------------------------------------------------------------
    */

    Route::get('cart', [CartController::class, 'show']);
    Route::post('cart/items', [CartController::class, 'add']);
    Route::patch('cart/items/{item}', [CartController::class, 'update']);
    Route::delete('cart/items/{item}', [CartController::class, 'destroy']);

    /*
    |--------------------------------------------------------------------------
    | Public Review Routes
    |--------------------------------------------------------------------------
    */
    Route::get('/reviews', [ReviewController::class, 'index']);

    /*
    |--------------------------------------------------------------------------
    | Public shipping method Routes
    |--------------------------------------------------------------------------
    */
    Route::get('shipping-methods', [ShippingMethodController::class, 'index']);

    /*
    |--------------------------------------------------------------------------
    | Google Authentication Routes
    |--------------------------------------------------------------------------
    */

    Route::prefix('google')->group(function () {
        Route::get('redirect', [GoogleAuthController::class, 'redirect']);
        Route::get('callback', [GoogleAuthController::class, 'callback']);
    });

    /*
    |--------------------------------------------------------------------------
    | Authenticated Routes
    |--------------------------------------------------------------------------
    */

    Route::middleware('auth:sanctum')->group(function () {

        /*
        |--------------------------------------------------------------------------
        | Authenticated Account Routes
        |--------------------------------------------------------------------------
        */

        Route::get('auth/me', [AuthController::class, 'me']);
        Route::post('auth/logout', [AuthController::class, 'logout']);
        Route::post('auth/tokens', [AuthController::class, 'createToken']);
        Route::get('auth/tokens', [AuthController::class, 'tokens']);
        Route::delete('auth/tokens/{token}', [AuthController::class, 'revokeToken']);

        /*
        |--------------------------------------------------------------------------
        | Notification Routes
        |--------------------------------------------------------------------------
        */

        Route::get('notifications', [NotificationController::class, 'index']);
        Route::get('notifications/unread-count', [NotificationController::class, 'unreadCount']);
        Route::patch('notifications/read-all', [NotificationController::class, 'markAllAsRead']);
        Route::patch('notifications/{notification}/read', [NotificationController::class, 'markAsRead']);

        /*
        |--------------------------------------------------------------------------
        | Checkout Routes
        |--------------------------------------------------------------------------
        */

        Route::post('checkout', [CheckoutController::class, 'store']);

        /*
        |--------------------------------------------------------------------------
        | Payment Routes
        |--------------------------------------------------------------------------
        */

        Route::post(
            'payments/{payment}/initiate',
            [PaymentController::class, 'initiate']
        );

        /*
        |--------------------------------------------------------------------------
        | Customer Order Routes
        |--------------------------------------------------------------------------
        */

        Route::get('orders', [OrderController::class, 'index']);
        Route::get('orders/{order}', [OrderController::class, 'show']);

        /*
        |--------------------------------------------------------------------------
        | Invoice Routes
        |--------------------------------------------------------------------------
        */

        Route::get('invoices', [InvoiceController::class, 'index']);
        Route::get('invoices/{invoice}', [InvoiceController::class, 'show']);

        /*
        |--------------------------------------------------------------------------
        | Reviews Routes
        |--------------------------------------------------------------------------
        */
        Route::get('/reviews/mine', [ReviewController::class, 'myReviews']);
        Route::post('/reviews', [ReviewController::class, 'store']);
        Route::get('/reviews/{review}', [ReviewController::class, 'show']);
        Route::patch('/reviews/{review}', [ReviewController::class, 'update']);
        Route::delete('/reviews/{review}', [ReviewController::class, 'destroy']);

        /*
        |--------------------------------------------------------------------------
        | Wishlist Routes
        |--------------------------------------------------------------------------
        */
        Route::get('wishlist', [WishlistController::class, 'index']);
        Route::post('wishlist', [WishlistController::class, 'store']);
        Route::delete('wishlist/{product}', [WishlistController::class, 'destroy']);

        /*
        |--------------------------------------------------------------------------
        | Address Routes
        |--------------------------------------------------------------------------
        */
        Route::apiResource('addresses', AddressController::class);
        Route::patch(
            'addresses/{address}/default',
            [AddressController::class, 'setDefault']
        );

        /*
        |--------------------------------------------------------------------------
        | Admin Routes
        |--------------------------------------------------------------------------
        */

        Route::prefix('admin')->group(function () {

            /*
            |--------------------------------------------------------------------------
            | Admin Product Routes
            |--------------------------------------------------------------------------
            */

            Route::get('products', [ProductController::class, 'adminIndex'])
                ->withTrashed();

            Route::get('products/{product}', [ProductController::class, 'adminShow'])
                ->withTrashed();

            Route::post('products', [ProductController::class, 'store']);
            Route::patch('products/{product}', [ProductController::class, 'update'])
                ->withTrashed();
            Route::delete('products/{product}', [ProductController::class, 'destroy']);
            Route::post('products/{product}/restore', [ProductController::class, 'restore'])
                ->withTrashed();
            Route::delete('products/{product}/force', [ProductController::class, 'forceDelete'])
                ->withTrashed();
            // Admin Product Image Routes
            Route::post('products/{product}/images', [ProductImageController::class, 'store']);
            Route::post('products/{product}/images/{image}/replace', [ProductImageController::class, 'replace']);
            Route::patch('products/{product}/images/{image}', [ProductImageController::class, 'update']);
            Route::delete('products/{product}/images/{image}', [ProductImageController::class, 'destroy']);
            /*
            |--------------------------------------------------------------------------
            | Admin Category Routes
            |--------------------------------------------------------------------------
            */

            Route::get('categories', [CategoryController::class, 'adminIndex'])
                ->withTrashed();

            Route::get('categories/{category}', [CategoryController::class, 'adminShow'])
                ->withTrashed();

            Route::post('categories', [CategoryController::class, 'store']);
            Route::patch('categories/{category}', [CategoryController::class, 'update'])
                ->withTrashed();
            Route::delete('categories/{category}', [CategoryController::class, 'destroy']);
            Route::post('categories/{category}/restore', [CategoryController::class, 'restore'])
                ->withTrashed();
            Route::delete('categories/{category}/force', [CategoryController::class, 'forceDelete'])
                ->withTrashed();

            /*
            |--------------------------------------------------------------------------
            | Admin Collection Routes
            |--------------------------------------------------------------------------
            */

            Route::get('collections', [CollectionController::class, 'adminIndex'])
                ->withTrashed();

            Route::get('collections/{collection}', [CollectionController::class, 'adminShow'])
                ->withTrashed();

            Route::post('collections', [CollectionController::class, 'store']);
            Route::patch('collections/{collection}', [CollectionController::class, 'update'])
                ->withTrashed();
            Route::delete('collections/{collection}', [CollectionController::class, 'destroy']);
            Route::post('collections/{collection}/restore', [CollectionController::class, 'restore'])
                ->withTrashed();
            Route::delete('collections/{collection}/force', [CollectionController::class, 'forceDelete'])
                ->withTrashed();

            /*
            |--------------------------------------------------------------------------
            | Admin Offer Routes
            |--------------------------------------------------------------------------
            */
            Route::get('offers', [OfferController::class, 'adminIndex']);
            Route::get('offers/{offer}', [OfferController::class, 'adminShow'])->withTrashed();
            Route::post('offers', [OfferController::class, 'store']);
            Route::patch('offers/{offer}', [OfferController::class, 'update'])->withTrashed();
            Route::delete('offers/{offer}', [OfferController::class, 'destroy']);
            Route::post('offers/{offer}/restore', [OfferController::class, 'restore'])->withTrashed();
            Route::delete('offers/{offer}/force', [OfferController::class, 'forceDelete'])->withTrashed();

            /*
            |--------------------------------------------------------------------------
            | Admin Coupon Routes
            |--------------------------------------------------------------------------
            */

            Route::get('coupons', [CouponController::class, 'adminIndex']);
            Route::get('coupons/{coupon}', [CouponController::class, 'adminShow'])
                ->withTrashed();
            Route::post('coupons', [CouponController::class, 'store']);
            Route::patch('coupons/{coupon}', [CouponController::class, 'update'])->withTrashed();
            Route::delete('coupons/{coupon}', [CouponController::class, 'destroy']);
            Route::post('coupons/{coupon}/restore', [CouponController::class, 'restore'])->withTrashed();
            Route::delete('coupons/{coupon}/force', [CouponController::class, 'forceDelete'])->withTrashed();

            /*
            |--------------------------------------------------------------------------
            | Admin Review Routes
            |--------------------------------------------------------------------------
            */

            Route::get('reviews', [ReviewController::class, 'adminIndex']);
            Route::get('reviews/{review}', [ReviewController::class, 'adminShow'])->withTrashed();
            Route::patch('reviews/{review}/status', [ReviewController::class, 'moderate']);
            Route::delete('reviews/{review}', [ReviewController::class, 'destroy']);
            Route::post('reviews/{review}/restore', [ReviewController::class, 'restore'])->withTrashed();
            Route::delete('reviews/{review}/force', [ReviewController::class, 'forceDelete'])->withTrashed();

            /*
            |--------------------------------------------------------------------------
            | Admin Wishlist Routes
            |--------------------------------------------------------------------------
            */
            Route::get('wishlists', [WishlistController::class, 'adminIndex']);
            Route::get('wishlists/{wishlist}', [WishlistController::class, 'show']);

            /*
            |--------------------------------------------------------------------------
            | Admin Address Routes
            |--------------------------------------------------------------------------
            */
            Route::get('addresses', [AddressController::class, 'adminIndex']);
            Route::get('addresses/{address}', [AddressController::class, 'adminShow']);
            Route::patch('addresses/{address}', [AddressController::class, 'adminUpdate']);

            /*
            |--------------------------------------------------------------------------
            | Admin User Routes
            |--------------------------------------------------------------------------
            */

            Route::get('users', [UserController::class, 'index']);
            Route::get('users/{user}', [UserController::class, 'show'])->withTrashed();
            Route::post('users', [UserController::class, 'store']);
            Route::patch('users/{user}', [UserController::class, 'update'])->withTrashed();
            Route::delete('users/{user}', [UserController::class, 'destroy']);
            Route::post('users/{user}/restore', [UserController::class, 'restore'])->withTrashed();
            Route::delete('users/{user}/force', [UserController::class, 'forceDelete'])->withTrashed();
            Route::patch('users/{user}/activate', [UserController::class, 'activate']);
            Route::patch('users/{user}/deactivate', [UserController::class, 'deactivate']);

            /*
            |--------------------------------------------------------------------------
            | Admin Order Routes
            |--------------------------------------------------------------------------
            */

            Route::get('orders', [OrderController::class, 'adminIndex']);
            Route::get('orders/{order}', [OrderController::class, 'adminShow']);
            Route::patch('orders/{order}/status', [OrderController::class, 'adminUpdateStatus']);

            /*
            |--------------------------------------------------------------------------
            | Admin Shipping Method Routes
            |--------------------------------------------------------------------------
            */
            Route::controller(ShippingMethodController::class)->prefix('shipping-methods')->group(function () {
                Route::get('/', 'adminIndex')->name('shipping-methods.index');
                Route::get('{shippingMethod}', 'adminShow')->name('shipping-methods.show');
                Route::post('/', 'store')->name('shipping-methods.store');
                Route::patch('{shippingMethod}', 'update')->name('shipping-methods.update');
                Route::patch('{shippingMethod}/default', 'setDefault')->name('shipping-methods.default');
                Route::delete('{shippingMethod}', 'destroy')->name('shipping-methods.destroy');
            });

            /*
            |--------------------------------------------------------------------------
            | Admin Payment Routes
            |--------------------------------------------------------------------------
            */

            Route::get('payments', [PaymentController::class, 'adminIndex']);
            Route::get('payments/{payment}', [PaymentController::class, 'adminShow']);

            Route::post(
                'payments/{payment}/refund',
                [PaymentController::class, 'refund']
            );

            /*
            |--------------------------------------------------------------------------
            | Admin Invoice Routes
            |--------------------------------------------------------------------------
            */

            Route::get('invoices', [InvoiceController::class, 'adminIndex']);
            Route::get('invoices/{invoice}', [InvoiceController::class, 'adminShow'])
                ->withTrashed();
            Route::post('invoices/{invoice}/restore', [InvoiceController::class, 'restore'])
                ->withTrashed();

            /*
            |--------------------------------------------------------------------------
            | Admin Invitation Routes
            |--------------------------------------------------------------------------
            */

            Route::get('invitations', [InvitationController::class, 'index']);
            Route::get('invitations/{invitation}', [InvitationController::class, 'adminShow']);
            Route::post('invitations', [InvitationController::class, 'store']);
            Route::post(
                'invitations/{invitation}/approve',
                [InvitationController::class, 'approve']
            );
            Route::post(
                'invitations/{invitation}/reject',
                [InvitationController::class, 'reject']
            );
            Route::post(
                'invitations/{invitation}/revoke',
                [InvitationController::class, 'revoke']
            );
        });
    });

    /*
    |--------------------------------------------------------------------------
    | Public Invitation Routes
    |--------------------------------------------------------------------------
    |
    | The invitation token acts as the credential for unauthenticated
    | invitees. These routes are throttled separately.
    |
    */

    Route::middleware('throttle:invitations')->group(function () {
        Route::get(
            'invitations/{token}',
            [InvitationController::class, 'show']
        );

        Route::post(
            'invitations/{token}/accept',
            [InvitationController::class, 'accept']
        );
    });
});
