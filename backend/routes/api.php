<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\CartController;
use App\Http\Controllers\Api\CategoryController;
use App\Http\Controllers\Api\CheckoutController;
use App\Http\Controllers\Api\GoogleAuthController;
use App\Http\Controllers\Api\InvitationController;
use App\Http\Controllers\Api\PaymentWebhookController;
use App\Http\Controllers\Api\ProductController;
use Illuminate\Support\Facades\Route;

Route::post('v1/payments/{gateway}/webhook', [PaymentWebhookController::class, 'handle'])->middleware('throttle:60,1');

Route::prefix('v1')->group(function () {
    Route::middleware('throttle:auth')->prefix('auth')->group(function () {
        Route::post('register', [AuthController::class, 'register']);
        Route::post('login', [AuthController::class, 'login']);
        Route::post('forgot-password', [AuthController::class, 'forgot']);
        Route::post('reset-password', [AuthController::class, 'reset']);
    });

    Route::prefix('auth')->group(function () {
        Route::get('email/verify/{id}/{hash}', [AuthController::class, 'verifyEmail'])->name('verification.verify');
        Route::post('email/verification-notification', [AuthController::class, 'resendVerificationEmail'])->middleware('auth:sanctum')->name('verification.send');
    });

    Route::get('products', [ProductController::class, 'index']);
    Route::get('products/{identifier}', [ProductController::class, 'show']);
    Route::get('categories', [CategoryController::class, 'index']);
    Route::get('cart', [CartController::class, 'show']);
    Route::post('cart/items', [CartController::class, 'add']);
    Route::patch('cart/items/{item}', [CartController::class, 'update']);
    Route::delete('cart/items/{item}', [CartController::class, 'destroy']);

    Route::prefix('google')->group(function () {
        Route::get('redirect', [GoogleAuthController::class, 'redirect']);
        Route::get('callback', [GoogleAuthController::class, 'callback']);
    });

    Route::middleware('auth:sanctum')->group(function () {
        Route::get('auth/me', [AuthController::class, 'me']);
        Route::post('auth/logout', [AuthController::class, 'logout']);
        Route::post('auth/tokens', [AuthController::class, 'createToken']);
        Route::get('auth/tokens', [AuthController::class, 'tokens']);
        Route::delete('auth/tokens/{token}', [AuthController::class, 'revokeToken']);
        Route::post('checkout', [CheckoutController::class, 'store']);
        Route::prefix('admin')->group(function () {
            Route::get('products', [ProductController::class, 'adminIndex']);
            Route::post('products', [ProductController::class, 'store']);
            Route::patch('products/{product}', [ProductController::class, 'update']);
            Route::delete('products/{product}', [ProductController::class, 'destroy']);
            Route::get('categories', [CategoryController::class, 'adminIndex']);
            Route::post('categories', [CategoryController::class, 'store']);
            Route::patch('categories/{category}', [CategoryController::class, 'update']);
            Route::delete('categories/{category}', [CategoryController::class, 'destroy']);
            Route::get('invitations', [InvitationController::class, 'index']);
            Route::post('invitations', [InvitationController::class, 'store']);
            Route::post('invitations/{invitation}/approve', [InvitationController::class, 'approve']);
            Route::post('invitations/{invitation}/reject', [InvitationController::class, 'reject']);
            Route::post('invitations/{invitation}/revoke', [InvitationController::class, 'revoke']);
        });
    });

    Route::middleware('throttle:invitations')->get('invitations/{token}', [InvitationController::class, 'show']);
    Route::middleware('throttle:invitations')->post('invitations/{token}/accept', [InvitationController::class, 'accept']);
});
