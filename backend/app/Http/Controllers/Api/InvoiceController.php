<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\IndexInvoiceRequest;
use App\Http\Resources\InvoiceResource;
use App\Models\Invoice;
use Illuminate\Http\Request;

class InvoiceController extends Controller
{
    public function index(Request $request)
    {
        $invoices = Invoice::query()
            ->whereHas('order', function ($query) use ($request) {
                $query->where('user_id', $request->user()->id);
            })
            ->with(['order.items'])
            ->latest('issued_at')
            ->latest('id')
            ->paginate(20);

        return InvoiceResource::collection($invoices);
    }

    public function show(Request $request, Invoice $invoice)
    {
        $this->authorize('view', $invoice);

        return new InvoiceResource(
            $invoice->load(['order.items'])
        );
    }

    public function adminIndex(IndexInvoiceRequest $request)
    {
        $this->authorize('viewAny', Invoice::class);

        $data = $request->validated();
        $search = $data['search'] ?? null;

        $invoices = Invoice::withTrashed()
            ->with(['order.items', 'order.user'])
            ->when($search, function ($query) use ($search) {
                $query->where(function ($query) use ($search) {
                    $query->where('number', 'like', "%{$search}%")
                        ->orWhereHas('order', function ($orderQuery) use ($search) {
                            $orderQuery->where('number', 'like', "%{$search}%")
                                ->orWhereHas('user', function ($userQuery) use ($search) {
                                    $userQuery->where('name', 'like', "%{$search}%")
                                        ->orWhere('email', 'like', "%{$search}%");
                                });
                        });
                });
            })
            ->when($data['issued_from'] ?? null, fn ($query, $date) => $query->whereDate('issued_at', '>=', $date))
            ->when($data['issued_to'] ?? null, fn ($query, $date) => $query->whereDate('issued_at', '<=', $date))
            ->latest('issued_at')
            ->latest('id')
            ->paginate($data['per_page'] ?? 30);

        return InvoiceResource::collection($invoices);
    }

    public function adminShow(Invoice $invoice)
    {
        $this->authorize('view', $invoice);

        return new InvoiceResource(
            $invoice->load(['order.items', 'order.user'])
        );
    }
}
