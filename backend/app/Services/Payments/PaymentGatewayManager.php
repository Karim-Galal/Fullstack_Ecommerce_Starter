<?php

namespace App\Services\Payments;

use App\Services\Payments\Gateways\PaymobGateway;
use App\Services\Payments\Gateways\StripeGateway;
use InvalidArgumentException;

class PaymentGatewayManager
{
    public function __construct(
        private StripeGateway $stripe,
        private PaymobGateway $paymob
    ) {}

    public function gateway(string $name): StripeGateway|PaymobGateway
    {
        return match ($name) {
            'stripe' => $this->stripe,
            'paymob' => $this->paymob,
            default => throw new InvalidArgumentException('Unsupported payment gateway.'),
        };
    }
}
