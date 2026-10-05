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
    public function index()
    {
        $this->authorize('viewAny', Invitation::class);

        return InvitationResource::collection(
            Invitation::latest()->paginate(30)
        );
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
                'invitation' => ['This invitation is invalid or has expired.'],
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
                'invitation' => ['This invitation is invalid or has expired.'],
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
                'email' => ['The email address does not match the invitation.'],
            ]);
        }

        if (User::where('email', $email)->exists()) {
            throw ValidationException::withMessages([
                'email' => ['This email address is already registered.'],
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
            'message' => 'Registration received. A Master Admin must approve access.',
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
                    'Only accepted invitations can be approved.',
                ],
            ]);
        }

        $user = User::where('email', $invitation->invited_email)
            ->where('status', 'inactive')
            ->first();

        if (! $user) {
            throw ValidationException::withMessages([
                'invitation' => [
                    'No inactive user is associated with this invitation.',
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
                    'Only accepted invitations can be rejected.',
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
                    'Only pending invitations can be revoked.',
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
