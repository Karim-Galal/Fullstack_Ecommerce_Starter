<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\IndexAdminPaymentsRequest;
use App\Http\Requests\RefundPaymentRequest;
use App\Http\Resources\PaymentResource;
use App\Models\Payment;
use App\Services\Payments\PaymentInitiationService;
use App\Services\Payments\PaymentRefundService;
use App\Services\Payments\PaymentStateService;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;

class PaymentController extends Controller
{
    public function initiate(Request $request, Payment $payment, PaymentInitiationService $service)
    {
        abort_unless($payment->order->user_id === $request->user()->id, 403);

        return response()->json([
            'payment' => $service->initiate($payment),
        ]);
    }

    public function adminIndex(IndexAdminPaymentsRequest $request)
    {
        $this->authorize('viewAny', Payment::class);

        $filters = $request->validated();
        $search = $filters['search'] ?? null;

        $payments = Payment::query()
            ->with(['order.user'])
            ->when($search, function ($query) use ($search) {
                $query->where(function ($query) use ($search) {
                    $query->where('transaction_reference', 'like', "%{$search}%")
                        ->orWhere('gateway_reference', 'like', "%{$search}%")
                        ->orWhereHas('order', function ($orderQuery) use ($search) {
                            $orderQuery->where('number', 'like', "%{$search}%");
                        });
                });
            })
            ->when(
                $filters['status'] ?? null,
                fn ($query, $status) => $query->where('status', $status)
            )
            ->when(
                $filters['gateway'] ?? null,
                fn ($query, $gateway) => $query->where('gateway', $gateway)
            )
            ->when(
                $filters['created_from'] ?? null,
                fn ($query, $date) => $query->whereDate('created_at', '>=', $date)
            )
            ->when(
                $filters['created_to'] ?? null,
                fn ($query, $date) => $query->whereDate('created_at', '<=', $date)
            )
            ->latest('created_at')
            ->latest('id');

        return PaymentResource::collection(
            $payments->paginate((int) ($filters['per_page'] ?? 30))
        );
    }

    public function adminShow(Payment $payment)
    {
        $this->authorize('view', $payment);

        return new PaymentResource(
            $payment->load('order.user')
        );
    }

    public function refund(
        RefundPaymentRequest $request,
        Payment $payment,
        PaymentRefundService $service,
        PaymentStateService $stateService
    ) {
        $this->authorize('refund', $payment);

        $amount = $request->validated()['amount'] ?? null;

        $result = $service->refund(
            $payment,
            $amount === null ? null : (int) round((float) $amount * 100)
        );

        $gatewayStatus = strtolower((string) ($result['status'] ?? ''));

        if (
            $amount === null
            && in_array($gatewayStatus, ['succeeded', 'success', 'refunded'], true)
        ) {
            $stateService->apply(
                $payment,
                'refunded',
                $payment->gateway_reference,
                ['refund' => $result]
            );
        }

        return response()->json([
            'refund' => $result,
            'payment' => new PaymentResource($payment->fresh()->load('order.user')),
        ]);
    }
}
