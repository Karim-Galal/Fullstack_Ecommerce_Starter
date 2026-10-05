<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreOfferRequest;
use App\Http\Requests\UpdateOfferRequest;
use App\Http\Resources\OfferResource;
use App\Models\Offer;

class OfferController extends Controller
{
    public function adminIndex()
    {
        $this->authorize('viewAny', Offer::class);

        return OfferResource::collection(
            Offer::withTrashed()
                ->with('products')
                ->latest()
                ->paginate(30)
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
}
