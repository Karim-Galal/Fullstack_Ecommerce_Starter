<?php

namespace App\Services\Payments\Gateways;

use App\Models\Order;
use App\Models\Payment;
use Illuminate\Support\Facades\Http;
use RuntimeException;

class PaymobGateway
{
    public function createPayment(Payment $payment, Order $order): array
    {
        $address = $order->shipping_address;

        $integrationIds = config('services.paymob.integration_ids');

        if (empty($integrationIds)) {
            throw new RuntimeException('Paymob integration_ids configuration is required.');
        }

        $address = $order->shipping_address;

        $response = Http::withToken(config('services.paymob.secret_key'))
            ->acceptJson()
            ->post(config('services.paymob.base_url').'/v1/intention/', [
                'amount' => $this->toMinorUnits($payment->amount),
                'currency' => $payment->currency,
                'payment_methods' => config('services.paymob.integration_ids'),
                'items' => $order->items->map(fn ($item) => [
                    'name' => $item->name,
                    'amount' => $this->toMinorUnits($item->unit_price),
                    'description' => $item->name,
                    'quantity' => $item->quantity,
                ])->values()->all(),
                'billing_data' => [
                    'first_name' => $this->firstName($address['name'] ?? ''),
                    'last_name' => $this->lastName($address['name'] ?? ''),
                    'phone_number' => $address['phone'] ?? '',
                    'street' => $address['line1'] ?? '',
                    'city' => $address['city'] ?? '',
                    'country' => $address['country'] ?? 'EG',
                    'postal_code' => $address['postal_code'] ?? '',
                    'email' => $order->user?->email ?? '',
                ],
                'special_reference' => $payment->transaction_reference,
                'notification_url' => route('payments.webhook', ['gateway' => 'paymob']),
                'redirection_url' => config('services.paymob.redirection_url'),
            ]);

        if ($response->failed()) {
            throw new RuntimeException('Paymob payment initialization failed.');
        }

        $data = $response->json();

        return [
            'gateway_reference' => (string) ($data['id'] ?? ''),
            'client_secret' => $data['client_secret'] ?? null,
            'status' => $data['status'] ?? 'intended',
            'metadata' => [
                'intention_id' => $data['id'] ?? null,
                'paymob_order_id' => $data['intention_order_id'] ?? null,
                'client_secret' => $data['client_secret'] ?? null,
            ],
        ];
    }

    public function refund(Payment $payment, ?int $amount = null): array
    {
        $transactionId = $payment->gateway_metadata['transaction_id'] ?? null;

        if (! $transactionId) {
            throw new RuntimeException('Paymob transaction ID is missing in gateway_metadata.');
        }

        $refundAmount = $amount ?? $this->toMinorUnits($payment->amount);

        $response = Http::withToken(config('services.paymob.secret_key'))
            ->acceptJson()
            ->post(config('services.paymob.base_url').'/api/acceptance/void_refund/refund', [
                'transaction_id' => $transactionId,
                'amount_cents' => $refundAmount,
            ]);

        if ($response->failed()) {
            throw new RuntimeException('Paymob refund failed.');
        }

        $data = $response->json();

        return [
            'id' => $data['id'] ?? null,
            'status' => $data['is_refunded'] ?? false ? 'refunded' : 'pending',
            'amount' => $data['refunded_amount_cents'] ?? $refundAmount,
        ];
    }

    private function toMinorUnits(string|float $amount): int
    {
        return (int) round((float) $amount * 100);
    }

    private function firstName(string $name): string
    {
        return explode(' ', trim($name), 2)[0] ?? '';
    }

    private function lastName(string $name): string
    {
        $parts = explode(' ', trim($name), 2);

        return $parts[1] ?? $parts[0] ?? '';
    }
}
