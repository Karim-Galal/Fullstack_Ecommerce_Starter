<?php

namespace App\Services;

use App\Models\Store;
use Illuminate\Http\Request;
use Symfony\Component\HttpKernel\Exception\HttpException;

class StoreContext
{
    public function resolve(Request $request): Store
    {
        if ($request->user()?->store_id) {
            $store = Store::find($request->user()->store_id);

            if (! $store) {
                throw new HttpException(403, 'Store access is unavailable.');
            }

            $requestedSlug = $request->header('X-Store-Slug');

            if ($requestedSlug && $requestedSlug !== $store->slug) {
                throw new HttpException(403, 'Store context does not match this account.');
            }

            return $store;
        }

        $slug = $request->header('X-Store-Slug');

        if (! $slug) {
            throw new HttpException(400, 'X-Store-Slug is required for public requests.');
        }

        return Store::where('slug', $slug)->firstOrFail();
    }
}
