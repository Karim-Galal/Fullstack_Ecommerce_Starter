<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\App;
use Symfony\Component\HttpFoundation\Response;

class SetLocale
{
    public function handle(Request $request, Closure $next): Response
    {
        $locale = $request->getPreferredLanguage(['en', 'ar']) ?? config('app.fallback_locale', 'en');

        App::setLocale($locale);

        return $next($request);
    }
}

