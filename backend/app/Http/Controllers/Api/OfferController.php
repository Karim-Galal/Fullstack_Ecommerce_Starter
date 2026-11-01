<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\IndexAdminOffersRequest;
use App\Http\Requests\StoreOfferRequest;
use App\Http\Requests\UpdateOfferRequest;
use App\Http\Resources\OfferResource;
use App\Models\Offer;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class OfferController extends Controller
{
    public function adminIndex(IndexAdminOffersRequest $request)
    {
        $this->authorize('viewAny', Offer::class);

        $filters = $request->validated();
        $trashedOnly = filter_var(
            $filters['trashed'] ?? false,
            FILTER_VALIDATE_BOOLEAN
        );

        $query = Offer::query()
            ->with('products')
            ->when($trashedOnly, fn ($query) => $query->onlyTrashed())
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
                filled($filters['type'] ?? null),
                fn ($query) => $query->where('type', $filters['type'])
            )
            ->orderBy(
                in_array($filters['sort'] ?? null, ['created_at', 'name', 'starts_at', 'ends_at'], true)
                    ? $filters['sort']
                    : 'created_at',
                ($filters['direction'] ?? null) === 'asc' ? 'asc' : 'desc'
            );

        return OfferResource::collection(
            $query->paginate((int) ($filters['per_page'] ?? 30))
        );
    }

    public function adminShow(Offer $offer)
    {
        $this->authorize('view', $offer);

        return new OfferResource(
            $offer->load('products')
        );
    }

    public function store(StoreOfferRequest $request)
    {
        $this->authorize('create', Offer::class);

        $data = $request->validated();

        $productIds = $data['product_ids'];
        unset($data['product_ids']);

        $offer = Offer::create([
            ...$data,
            'created_by' => $request->user()->id,
        ]);

        $offer->products()->sync($productIds);

        return (new OfferResource($offer->load('products')))
            ->response()
            ->setStatusCode(201);
    }

    public function update(UpdateOfferRequest $request, Offer $offer)
    {
        $this->authorize('update', $offer);

        $data = $request->validated();

        if (array_key_exists('product_ids', $data)) {
            $productIds = $data['product_ids'];
            unset($data['product_ids']);

            $offer->products()->sync($productIds);
        }

        $offer->update($data);

        return new OfferResource(
            $offer->fresh()->load('products')
        );
    }

    public function destroy(Offer $offer)
    {
        $this->authorize('delete', $offer);

        $offer->delete();

        return response()->noContent();
    }

    public function restore(Offer $offer)
    {
        $this->authorize('restore', $offer);

        if ($offer->trashed()) {
            $offer->restore();
        }

        return new OfferResource($offer->fresh()->load('products'));
    }

    public function forceDelete(Offer $offer)
    {
        $this->authorize('forceDelete', $offer);

        if (! $offer->trashed()) {
            throw ValidationException::withMessages([
                'offer' => [__('api.offer_must_be_trashed')],
            ]);
        }

        DB::transaction(function () use ($offer) {
            $offer->products()->detach();
            $offer->forceDelete();
        });

        return response()->noContent();
    }
}
