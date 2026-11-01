<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreShippingMethodRequest;
use App\Http\Requests\UpdateShippingMethodRequest;
use App\Http\Resources\ShippingMethodResource;
use App\Models\ShippingMethod;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class ShippingMethodController extends Controller
{
    public function index()
    {
        $shippingMethods = ShippingMethod::query()
            ->where('is_active', true)
            ->orderByDesc('is_default')
            ->orderBy('price')
            ->get();

        return ShippingMethodResource::collection($shippingMethods);
    }

    public function adminIndex(Request $request)
    {
        $this->authorize('viewAny', ShippingMethod::class);

        $filters = $request->validate([
            'search' => ['sometimes', 'nullable', 'string', 'max:255'],
            'is_active' => ['sometimes', 'in:0,1,true,false'],
            'is_default' => ['sometimes', 'in:0,1,true,false'],
            'per_page' => ['sometimes', 'integer', 'min:1', 'max:100'],
        ]);

        $shippingMethods = ShippingMethod::query()
            ->when(
                filled($filters['search'] ?? null),
                fn ($query) => $query->where('name', 'like', '%'.$filters['search'].'%')
            )
            ->when(
                array_key_exists('is_active', $filters),
                fn ($query) => $query->where(
                    'is_active',
                    filter_var($filters['is_active'], FILTER_VALIDATE_BOOLEAN)
                )
            )
            ->when(
                array_key_exists('is_default', $filters),
                fn ($query) => $query->where(
                    'is_default',
                    filter_var($filters['is_default'], FILTER_VALIDATE_BOOLEAN)
                )
            )
            ->orderByDesc('is_default')
            ->orderBy('name')
            ->paginate((int) ($filters['per_page'] ?? 30));

        return ShippingMethodResource::collection($shippingMethods);
    }

    public function adminShow(ShippingMethod $shippingMethod)
    {
        $this->authorize('view', $shippingMethod);

        return new ShippingMethodResource($shippingMethod);
    }

    public function store(StoreShippingMethodRequest $request)
    {
        $this->authorize('create', ShippingMethod::class);

        $data = $request->validated();

        $shippingMethod = DB::transaction(function () use ($data) {
            $isDefault = $data['is_default'] ?? false;

            if ($isDefault) {
                ShippingMethod::query()
                    ->where('is_default', true)
                    ->update(['is_default' => false]);
            }

            return ShippingMethod::create([
                'name' => $data['name'],
                'description' => $data['description'] ?? null,
                'price' => $data['price'],
                'is_active' => $data['is_active'] ?? true,
                'is_default' => $isDefault,
            ]);
        });

        return (new ShippingMethodResource($shippingMethod))
            ->response()
            ->setStatusCode(201);
    }

    public function update(
        UpdateShippingMethodRequest $request,
        ShippingMethod $shippingMethod
    ) {
        $this->authorize('update', $shippingMethod);

        $data = $request->validated();

        if (
            $shippingMethod->is_default
            && array_key_exists('is_active', $data)
            && $data['is_active'] === false
        ) {
            throw ValidationException::withMessages([
                'is_active' => [__('api.shipping_default_cannot_deactivate')],
            ]);
        }

        $shippingMethod->update($data);

        return new ShippingMethodResource($shippingMethod->fresh());
    }

    public function setDefault(ShippingMethod $shippingMethod)
    {
        $this->authorize('update', $shippingMethod);

        if (! $shippingMethod->is_active) {
            throw ValidationException::withMessages([
                'shipping_method' => [__('api.shipping_inactive_cannot_be_default')],
            ]);
        }

        DB::transaction(function () use ($shippingMethod) {
            ShippingMethod::query()
                ->where('is_default', true)
                ->whereKeyNot($shippingMethod->id)
                ->update(['is_default' => false]);

            $shippingMethod->update([
                'is_default' => true,
            ]);
        });

        return new ShippingMethodResource($shippingMethod->fresh());
    }

    public function destroy(ShippingMethod $shippingMethod)
    {
        $this->authorize('delete', $shippingMethod);

        if ($shippingMethod->is_default) {
            throw ValidationException::withMessages([
                'shipping_method' => [__('api.shipping_default_cannot_delete')],
            ]);
        }

        if (ShippingMethod::query()->count() <= 1) {
            throw ValidationException::withMessages([
                'shipping_method' => [__('api.shipping_at_least_one_required')],
            ]);
        }

        $shippingMethod->delete();

        return response()->noContent();
    }
}
