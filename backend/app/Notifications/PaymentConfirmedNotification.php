<?php

namespace App\Notifications;

use App\Models\Order;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;

class PaymentConfirmedNotification extends Notification
{
    use Queueable;

    public function __construct(public Order $order) {}

    public function via(object $notifiable): array
    {
        return ['database'];
    }

    public function toArray(object $notifiable): array
    {
        return [
            'type' => 'payment_confirmed',
            'order_id' => $this->order->id,
            'order_number' => $this->order->number,
            'total' => $this->order->total,
            'currency' => $this->order->currency,
            'message' => __('api.notification_payment_confirmed', [
                'number' => $this->order->number,
            ]),
            'url' => '/orders/'.$this->order->id,
        ];
    }
}
