<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\NotificationResource;
use Illuminate\Http\Request;
use Illuminate\Notifications\DatabaseNotification;

class NotificationController extends Controller
{
    public function index(Request $request)
    {
        $notifications = $request->user()
            ->notifications()
            ->paginate(20);

        return NotificationResource::collection($notifications);
    }

    public function unreadCount(Request $request)
    {
        return response()->json([
            'unread_count' => $request->user()->unreadNotifications()->count(),
        ]);
    }

    public function markAsRead(Request $request, DatabaseNotification $notification)
    {
        $this->authorize('update', $notification);

        $notification->markAsRead();

        return new NotificationResource($notification);
    }

    public function markAllAsRead(Request $request)
    {
        $request->user()->unreadNotifications()->update([
            'read_at' => now(),
            'updated_at' => now(),
        ]);

        return response()->json([
            'message' => __('api.notifications_marked_read'),
        ]);
    }
}
