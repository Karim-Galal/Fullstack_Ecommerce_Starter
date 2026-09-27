<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\UserResource;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Laravel\Socialite\Facades\Socialite;

class GoogleAuthController extends Controller
{
    public function redirect()
    {
        return Socialite::driver('google')->stateless()->redirect();
    }

    public function callback(Request $request)
    {
        $googleUser = Socialite::driver('google')->stateless()->user();

        $existingUser = User::where('google_id', $googleUser->getId())->first();

        if ($existingUser) {
            Auth::login($existingUser, true);

            return $this->handleAuthenticatedUser($existingUser, $request);
        }

        $existingEmailUser = User::where('email', $googleUser->getEmail())->first();

        if ($existingEmailUser) {
            // Link Google account to existing email account
            $existingEmailUser->update([
                'google_id' => $googleUser->getId(),
            ]);
            Auth::login($existingEmailUser, true);

            return $this->handleAuthenticatedUser($existingEmailUser, $request);
        }

        // Create new user
        $user = User::create([
            'name' => $googleUser->getName(),
            'email' => $googleUser->getEmail(),
            'password' => Hash::make(Str::random(32)),
            'google_id' => $googleUser->getId(),
            'email_verified_at' => now(),
            'role' => 'customer',
            'status' => 'active',
        ]);

        Auth::login($user, true);

        return $this->handleAuthenticatedUser($user, $request);
    }

    private function handleAuthenticatedUser(User $user, Request $request)
    {
        $request->session()->regenerate();

        if ($request->device_name) {
            $token = $user->createToken($request->device_name)->plainTextToken;

            return response()->json([
                'message' => 'Google login successful',
                'user' => new UserResource($user),
                'token' => $token,
            ]);
        }

        return response()->json([
            'message' => 'Google login successful',
            'user' => new UserResource($user),
        ]);
    }
}
