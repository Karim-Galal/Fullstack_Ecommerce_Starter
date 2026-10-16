<?php

namespace App\Providers;

use App\Policies\NotificationPolicy;
use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Http\Request;
use Illuminate\Notifications\DatabaseNotification;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        Gate::policy(DatabaseNotification::class, NotificationPolicy::class);

        RateLimiter::for('auth', fn (Request $request) => Limit::perMinute(5)->by($request->ip().'|'.$request->input('email')));
        RateLimiter::for('invitations', fn (Request $request) => Limit::perMinute(10)->by($request->ip()));
    }
}
