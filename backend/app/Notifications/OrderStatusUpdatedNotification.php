<?php

namespace App\Notifications;

use App\Models\Order;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;

class OrderStatusUpdatedNotification extends Notification
{
    use Queueable;

    public function __construct(
        public Order $order,
        public string $previousStatus,
    ) {}

    public function via(object $notifiable): array
    {
        return ['database'];
    }

    public function toArray(object $notifiable): array
    {
        return [
            'type' => 'order_status_updated',
            'order_id' => $this->order->id,
            'order_number' => $this->order->number,
            'previous_status' => $this->previousStatus,
            'status' => $this->order->status,
            'message' => __('api.order_status_updated', [
                'number' => $this->order->number,
                'status' => $this->order->status,
            ]),
            'url' => '/account/orders/'.$this->order->id,
        ];
    }
}
