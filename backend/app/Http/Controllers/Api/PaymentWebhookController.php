<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\Payments\PaymentWebhookService;
use Illuminate\Http\Request;

class PaymentWebhookController extends Controller
{
    public function handle(Request $request, string $gateway, PaymentWebhookService $service)
    {
        return response()->json(
            $service->handle($request, $gateway)
        );
    }
}
