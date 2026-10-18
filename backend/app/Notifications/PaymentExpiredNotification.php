<?php

namespace App\Notifications;

use App\Models\Order;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;

class PaymentExpiredNotification extends Notification
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
            'type' => 'payment_expired',
            'order_id' => $this->order->id,
            'order_number' => $this->order->number,
            'total' => $this->order->total,
            'currency' => $this->order->currency,
            'message' => __('api.payment_expired_notification', [
                'number' => $this->order->number,
            ]),
            'url' => '/account/orders/'.$this->order->id,
        ];
    }
}
