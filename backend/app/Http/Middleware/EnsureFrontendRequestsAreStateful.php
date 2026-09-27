<?php

namespace App\Http\Middleware;

use Illuminate\Http\Request;
use Laravel\Sanctum\Http\Middleware\EnsureFrontendRequestsAreStateful as BaseEnsureFrontendRequestsAreStateful;

class EnsureFrontendRequestsAreStateful extends BaseEnsureFrontendRequestsAreStateful
{
    protected function isFrontendRequest(Request $request): bool
    {
        // Check if this is a SPA request (has X-Requested-With header or specific Accept header)
        // For API token requests, we don't want to start a session
        if ($request->bearerToken()) {
            return false;
        }

        // Check for SPA indicators
        if ($request->header('X-Requested-With') === 'XMLHttpRequest') {
            return true;
        }

        if ($request->header('X-Inertia')) {
            return true;
        }

        // Check if the request is from a known frontend domain
        $origin = $request->header('Origin');
        if ($origin) {
            $statefulDomains = config('sanctum.stateful', []);
            foreach ($statefulDomains as $domain) {
                if (str_ends_with($origin, $domain)) {
                    return true;
                }
            }
        }

        return false;
    }
}
