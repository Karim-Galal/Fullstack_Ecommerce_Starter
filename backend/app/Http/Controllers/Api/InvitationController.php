<?php

namespace App\Http\Controllers\Api;

use App\Actions\CreateInvitation;
use App\Http\Controllers\Controller;
use App\Models\Invitation;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

class InvitationController extends Controller
{
    private function master(Request $r): void
    {
        abort_unless($r->user()->isMasterAdmin(), 403);
    }

    public function index(Request $r)
    {
        $this->master($r);

        return Invitation::latest()->paginate(30);
    }

    public function store(Request $r, CreateInvitation $action)
    {
        $this->master($r);
        $d = $r->validate(['email' => 'required|email', 'type' => 'required|in:staff,master_admin']);
        [$i, $token] = $action->handle($r->user(), $d['email'], $d['type']);

        return response()->json(['invitation' => $i, 'invitation_url' => config('app.frontend_url').'/invite/'.$token], 201);
    }

    public function show(string $token)
    {
        $i = Invitation::where('token_hash', hash('sha256', $token))->first();
        abort_unless($i?->valid(), 404);

        return ['email' => $i->invited_email, 'type' => $i->type, 'expires_at' => $i->expires_at];
    }

    public function accept(Request $r, string $token)
    {
        $i = Invitation::where('token_hash', hash('sha256', $token))->first();
        abort_unless($i?->valid(), 422, 'Invalid invitation.');
        $d = $r->validate(['name' => 'required|string|max:255', 'email' => 'required|email', 'password' => 'required|min:12|confirmed']);
        abort_unless(mb_strtolower($d['email']) === $i->invited_email, 422, 'Email does not match invitation.');
        abort_if(User::where('email', $d['email'])->exists(), 422, 'Email already registered.');
        $user = User::create([
            'name' => $d['name'],
            'email' => $d['email'],
            'password' => Hash::make($d['password']),
            'role' => $i->type === 'master_admin' ? 'master_admin' : 'staff',
            'status' => 'pending_approval',
        ]);
        $i->update(['status' => 'accepted', 'accepted_at' => now()]);

        return response()->json(['message' => 'Registration received; a Master Admin must approve access.', 'user_id' => $user->id], 201);
    }

    public function approve(Request $r, Invitation $invitation)
    {
        $this->master($r);
        abort_unless($invitation->status === 'accepted', 422);
        $user = User::where('email', $invitation->invited_email)->where('status', 'pending_approval')->firstOrFail();
        $user->update(['status' => 'active', 'approved_at' => now(), 'approved_by' => $r->user()->id]);
        $invitation->update(['status' => 'approved', 'approved_at' => now(), 'approved_by' => $r->user()->id]);

        return response()->json(['user' => $user]);
    }

    public function reject(Request $r, Invitation $invitation)
    {
        $this->master($r);
        $invitation->update(['status' => 'rejected', 'rejected_at' => now()]);
        User::where('email', $invitation->invited_email)->where('status', 'pending_approval')->update(['status' => 'rejected']);

        return response()->noContent();
    }

    public function revoke(Request $r, Invitation $invitation)
    {
        $this->master($r);
        abort_unless($invitation->status === 'pending', 422);
        $invitation->update(['status' => 'revoked', 'revoked_at' => now()]);

        return response()->noContent();
    }
}
