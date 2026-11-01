<?php

namespace App\Http\Controllers\Api;

use App\Actions\CreateInvitation;
use App\Http\Controllers\Controller;
use App\Http\Requests\StoreInvitationRequest;
use App\Http\Resources\InvitationResource;
use App\Models\Invitation;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

class InvitationController extends Controller
{
    public function index(Request $request)
    {
        $this->authorize('viewAny', Invitation::class);

        $filters = $request->validate([
            'search' => ['sometimes', 'nullable', 'string', 'max:255'],
            'status' => ['sometimes', 'string', 'in:pending,accepted,approved,rejected,revoked'],
            'type' => ['sometimes', 'string', 'in:staff,master_admin'],
            'per_page' => ['sometimes', 'integer', 'min:1', 'max:100'],
        ]);

        $invitations = Invitation::query()
            ->when(
                filled($filters['search'] ?? null),
                fn ($query) => $query->where(
                    'invited_email',
                    'like',
                    '%'.$filters['search'].'%'
                )
            )
            ->when(
                $filters['status'] ?? null,
                fn ($query, $status) => $query->where('status', $status)
            )
            ->when(
                $filters['type'] ?? null,
                fn ($query, $type) => $query->where('type', $type)
            )
            ->latest()
            ->paginate((int) ($filters['per_page'] ?? 30));

        return InvitationResource::collection($invitations);
    }

    public function adminShow(Invitation $invitation)
    {
        $this->authorize('view', $invitation);

        return new InvitationResource($invitation);
    }

    public function store(
        StoreInvitationRequest $request,
        CreateInvitation $action
    ) {
        $this->authorize('create', Invitation::class);

        $data = $request->validated();

        [$invitation, $token] = $action->handle(
            $request->user(),
            $data['email'],
            $data['type']
        );

        return response()->json([
            'invitation' => new InvitationResource($invitation),
            'invitation_url' => config('app.frontend_url').'/invite/'.$token,
        ], 201);
    }

    public function show(string $token)
    {
        $invitation = Invitation::where(
            'token_hash',
            hash('sha256', $token)
        )->first();

        if (! $invitation || ! $invitation->valid()) {
            throw ValidationException::withMessages([
                'invitation' => [__('api.invitation_invalid_or_expired')],
            ]);
        }

        return new InvitationResource($invitation);
    }

    public function accept(
        Request $request,
        string $token
    ) {
        $invitation = Invitation::where(
            'token_hash',
            hash('sha256', $token)
        )->first();

        if (! $invitation || ! $invitation->valid()) {
            throw ValidationException::withMessages([
                'invitation' => [__('api.invitation_invalid_or_expired')],
            ]);
        }

        $data = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email'],
            'password' => ['required', 'string', 'min:12', 'confirmed'],
        ]);

        $email = mb_strtolower($data['email']);

        if ($email !== $invitation->invited_email) {
            throw ValidationException::withMessages([
                'email' => [__('api.invitation_email_mismatch')],
            ]);
        }

        if (User::where('email', $email)->exists()) {
            throw ValidationException::withMessages([
                'email' => [__('api.invitation_email_already_registered')],
            ]);
        }

        $user = DB::transaction(function () use (
            $invitation,
            $data,
            $email
        ) {
            $user = User::create([
                'name' => $data['name'],
                'email' => $email,
                'password' => Hash::make($data['password']),
                'role' => $invitation->type === 'master_admin'
                    ? 'master_admin'
                    : 'staff',
                'status' => 'inactive',
            ]);

            $invitation->update([
                'status' => 'accepted',
                'accepted_at' => now(),
            ]);

            return $user;
        });

        return response()->json([
            'message' => __('api.invitation_registration_received'),
            'user_id' => $user->id,
        ], 201);
    }

    public function approve(
        Request $request,
        Invitation $invitation
    ) {
        $this->authorize('approve', $invitation);

        if ($invitation->status !== 'accepted') {
            throw ValidationException::withMessages([
                'invitation' => [
                    __('api.invitation_must_be_accepted'),
                ],
            ]);
        }

        $user = User::where('email', $invitation->invited_email)
            ->where('status', 'inactive')
            ->first();

        if (! $user) {
            throw ValidationException::withMessages([
                'invitation' => [
                    __('api.invitation_inactive_user_not_found'),
                ],
            ]);
        }

        DB::transaction(function () use (
            $request,
            $invitation,
            $user
        ) {
            $user->update([
                'status' => 'active',
                'approved_at' => now(),
                'approved_by' => $request->user()->id,
            ]);

            $invitation->update([
                'status' => 'approved',
                'approved_at' => now(),
                'approved_by' => $request->user()->id,
            ]);
        });

        return response()->json([
            'invitation' => new InvitationResource(
                $invitation->fresh()
            ),
        ]);
    }

    public function reject(
        Request $request,
        Invitation $invitation
    ) {
        $this->authorize('reject', $invitation);

        if ($invitation->status !== 'accepted') {
            throw ValidationException::withMessages([
                'invitation' => [
                    __('api.invitation_must_be_accepted'),
                ],
            ]);
        }

        DB::transaction(function () use ($invitation) {
            $invitation->update([
                'status' => 'rejected',
                'rejected_at' => now(),
            ]);

            User::where('email', $invitation->invited_email)
                ->where('status', 'inactive')
                ->update([
                    'status' => 'rejected',
                ]);
        });

        return response()->noContent();
    }

    public function revoke(
        Request $request,
        Invitation $invitation
    ) {
        $this->authorize('revoke', $invitation);

        if ($invitation->status !== 'pending') {
            throw ValidationException::withMessages([
                'invitation' => [
                    __('api.invitation_must_be_pending'),
                ],
            ]);
        }

        $invitation->update([
            'status' => 'revoked',
            'revoked_at' => now(),
        ]);

        return response()->noContent();
    }
}
