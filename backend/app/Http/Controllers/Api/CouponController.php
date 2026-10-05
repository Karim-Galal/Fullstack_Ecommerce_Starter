<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreCouponRequest;
use App\Http\Requests\UpdateCouponRequest;
use App\Http\Resources\CouponResource;
use App\Models\Coupon;

class CouponController extends Controller
{
    public function adminIndex()
    {
        $this->authorize('viewAny', Coupon::class);

        return CouponResource::collection(
            Coupon::withTrashed()
                ->with(['createdBy', 'products'])
                ->latest()
                ->paginate(30)
        );
    }

    public function adminShow(Coupon $coupon)
    {
        $this->authorize('view', $coupon);

        return new CouponResource(
            $coupon->load(['createdBy', 'products'])
        );
    }

    public function store(StoreCouponRequest $request)
    {
        $this->authorize('create', Coupon::class);

        $data = $request->validated();

        $productIds = $data['product_ids'] ?? [];
        unset($data['product_ids']);

        $coupon = Coupon::create([
            ...$data,
            'created_by' => $request->user()->id,
        ]);

        $coupon->products()->sync($productIds);

        return (new CouponResource($coupon->load(['createdBy', 'products'])))
            ->response()
            ->setStatusCode(201);
    }

    public function update(UpdateCouponRequest $request, Coupon $coupon)
    {
        $this->authorize('update', $coupon);

        $data = $request->validated();

        if (array_key_exists('product_ids', $data)) {
            $productIds = $data['product_ids'];
            unset($data['product_ids']);

            $coupon->products()->sync($productIds);
        }

        $coupon->update($data);

        return new CouponResource(
            $coupon->fresh()->load(['createdBy', 'products'])
        );
    }

    public function destroy(Coupon $coupon)
    {
        $this->authorize('delete', $coupon);

        $coupon->delete();

        return response()->noContent();
    }
}
