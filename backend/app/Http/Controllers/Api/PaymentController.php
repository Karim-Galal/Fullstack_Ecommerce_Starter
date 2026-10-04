<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Payment;
use App\Services\Payments\PaymentInitiationService;
use App\Services\Payments\PaymentRefundService;
use Illuminate\Http\Request;

class PaymentController extends Controller
{
    public function initiate(Request $request, Payment $payment, PaymentInitiationService $service)
    {
        abort_unless($payment->order->user_id === $request->user()->id, 403);

        return response()->json([
            'payment' => $service->initiate($payment),
        ]);
    }

    public function refund(Request $request, Payment $payment, PaymentRefundService $service)
    {
        abort_unless($request->user()->canAdmin('payments.refund'), 403);

        $result = $service->refund($payment);

        return response()->json([
            'refund' => $result,
        ]);
    }
}
