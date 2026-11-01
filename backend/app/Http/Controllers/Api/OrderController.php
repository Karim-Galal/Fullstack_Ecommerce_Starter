<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\IndexAdminOrdersRequest;
use App\Http\Requests\UpdateOrderStatusRequest;
use App\Http\Resources\OrderResource;
use App\Models\Order;
use App\Services\Orders\OrderStatusService;
use Illuminate\Http\Request;

class OrderController extends Controller
{
    public function index(Request $request)
    {
        $orders = Order::where('user_id', $request->user()->id)
            ->with([
                'items',
                'shippingMethod',
            ])
            ->latest()
            ->paginate(20);

        return OrderResource::collection($orders);
    }

    public function show(Request $request, Order $order)
    {
        abort_unless(
            $order->user_id === $request->user()->id,
            403
        );

        return new OrderResource(
            $order->load([
                'items',
                'shippingMethod',
            ])
        );
    }

    public function adminIndex(IndexAdminOrdersRequest $request)
    {
        $this->authorize('viewAny', Order::class);

        $filters = $request->validated();
        $search = $filters['search'] ?? null;

        $orders = Order::query()
            ->with([
                'items',
                'user',
                'shippingMethod',
                'payments',
            ])
            ->when($search, function ($query) use ($search) {
                $query->where(function ($query) use ($search) {
                    $query->where('number', 'like', "%{$search}%")
                        ->orWhereHas('user', function ($userQuery) use ($search) {
                            $userQuery->where('name', 'like', "%{$search}%")
                                ->orWhere('email', 'like', "%{$search}%");
                        });
                });
            })
            ->when(
                $filters['status'] ?? null,
                fn ($query, $status) => $query->where('status', $status)
            )
            ->when(
                $filters['created_from'] ?? null,
                fn ($query, $date) => $query->whereDate('created_at', '>=', $date)
            )
            ->when(
                $filters['created_to'] ?? null,
                fn ($query, $date) => $query->whereDate('created_at', '<=', $date)
            )
            ->orderBy(
                in_array($filters['sort'] ?? null, ['created_at', 'total', 'number', 'status'], true)
                    ? $filters['sort']
                    : 'created_at',
                ($filters['direction'] ?? null) === 'asc' ? 'asc' : 'desc'
            );

        return OrderResource::collection(
            $orders->paginate((int) ($filters['per_page'] ?? 30))
        );
    }

    public function adminShow(Order $order)
    {
        $this->authorize('view', $order);

        return new OrderResource(
            $order->load([
                'items',
                'user',
                'shippingMethod',
                'payments',
                'invoice',
            ])
        );
    }

    public function adminUpdateStatus(
        UpdateOrderStatusRequest $request,
        Order $order,
        OrderStatusService $service
    ) {
        $this->authorize('update', $order);

        $order = $service->update($order, $request->validated()['status']);

        return new OrderResource(
            $order->load([
                'items',
                'user',
                'shippingMethod',
                'payments',
                'invoice',
            ])
        );
    }
}
