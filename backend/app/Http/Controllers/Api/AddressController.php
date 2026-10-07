<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreAddressRequest;
use App\Http\Requests\UpdateAddressRequest;
use App\Http\Resources\AddressResource;
use App\Models\Address;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class AddressController extends Controller
{
    public function index(Request $request)
    {
        $addresses = Address::query()
            ->where('user_id', $request->user()->id)
            ->latest('is_default')
            ->latest()
            ->paginate(20);

        return AddressResource::collection($addresses);
    }

    public function store(StoreAddressRequest $request)
    {
        $user = $request->user();
        $data = $request->validated();

        $address = DB::transaction(function () use ($user, $data) {
            $isDefault = $data['is_default'] ?? false;

            if ($isDefault) {
                $user->addresses()->update([
                    'is_default' => false,
                ]);
            }

            return $user->addresses()->create([
                ...$data,
                'is_default' => $isDefault,
            ]);
        });

        return (new AddressResource($address))
            ->response()
            ->setStatusCode(201);
    }

    public function show(Address $address)
    {
        $this->authorize('view', $address);

        return new AddressResource($address);
    }

    public function update(
        UpdateAddressRequest $request,
        Address $address
    ) {
        $this->authorize('update', $address);

        $data = $request->validated();

        DB::transaction(function () use ($address, $data) {
            if (($data['is_default'] ?? false) === true) {
                $address->user->addresses()
                    ->whereKeyNot($address->id)
                    ->update([
                        'is_default' => false,
                    ]);
            }

            $address->update($data);
        });

        return new AddressResource(
            $address->fresh()
        );
    }

    public function destroy(Address $address)
    {
        $this->authorize('delete', $address);

        $address->delete();

        return response()->noContent();
    }

    public function setDefault(Address $address)
    {
        $this->authorize('update', $address);

        DB::transaction(function () use ($address) {
            $address->user->addresses()->update([
                'is_default' => false,
            ]);

            $address->update([
                'is_default' => true,
            ]);
        });

        return new AddressResource(
            $address->fresh()
        );
    }

    public function adminIndex()
    {
        $this->authorize('viewAny', Address::class);

        $addresses = Address::query()
            ->with('user')
            ->latest()
            ->paginate(30);

        return AddressResource::collection($addresses);
    }

    public function adminShow(Address $address)
    {
        $this->authorize('view', $address);

        return new AddressResource(
            $address->load('user')
        );
    }
}
