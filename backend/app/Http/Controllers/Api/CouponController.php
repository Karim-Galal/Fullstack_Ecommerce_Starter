<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\IndexAdminCouponsRequest;
use App\Http\Requests\StoreCouponRequest;
use App\Http\Requests\UpdateCouponRequest;
use App\Http\Resources\CouponResource;
use App\Models\Coupon;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class CouponController extends Controller
{
    public function adminIndex(IndexAdminCouponsRequest $request)
    {
        $this->authorize('viewAny', Coupon::class);

        $filters = $request->validated();
        $trashedOnly = filter_var(
            $filters['trashed'] ?? false,
            FILTER_VALIDATE_BOOLEAN
        );

        $query = Coupon::query()
            ->with(['createdBy', 'products'])
            ->when($trashedOnly, fn ($query) => $query->onlyTrashed())
            ->when(
                filled($filters['search'] ?? null),
                fn ($query) => $query->where('code', 'like', '%'.$filters['search'].'%')
            )
            ->when(
                array_key_exists('is_active', $filters),
                fn ($query) => $query->where(
                    'is_active',
                    filter_var($filters['is_active'], FILTER_VALIDATE_BOOLEAN)
                )
            )
            ->orderBy(
                in_array($filters['sort'] ?? null, ['created_at', 'code', 'expires_at', 'used_count'], true)
                    ? $filters['sort']
                    : 'created_at',
                ($filters['direction'] ?? null) === 'asc' ? 'asc' : 'desc'
            );

        return CouponResource::collection(
            $query->paginate((int) ($filters['per_page'] ?? 30))
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

    public function restore(Coupon $coupon)
    {
        $this->authorize('restore', $coupon);

        if ($coupon->trashed()) {
            $coupon->restore();
        }

        return new CouponResource(
            $coupon->fresh()->load(['createdBy', 'products'])
        );
    }

    public function forceDelete(Coupon $coupon)
    {
        $this->authorize('forceDelete', $coupon);

        if (! $coupon->trashed()) {
            throw ValidationException::withMessages([
                'coupon' => [__('api.coupon_must_be_trashed')],
            ]);
        }

        DB::transaction(function () use ($coupon) {
            $coupon->products()->detach();
            $coupon->forceDelete();
        });

        return response()->noContent();
    }
}
