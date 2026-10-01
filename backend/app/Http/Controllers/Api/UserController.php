<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreUserRequest;
use App\Http\Requests\UpdateUserRequest;
use App\Http\Resources\UserResource;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

class UserController extends Controller
{
    public function index(Request $request)
    {
        $query = User::query();

        if ($request->filled('role')) {
            $query->where('role', $request->string('role'));
        }

        $users = $query
            ->orderBy('created_at', 'desc')
            ->paginate(20);

        return UserResource::collection($users);
    }

    public function show(User $user)
    {
        $this->authorize('update', $user);

        return new UserResource($user);
    }

    public function store(StoreUserRequest $request)
    {
        $data = $request->validated();

        if ($data['role'] !== 'customer') {
            $this->authorize('manageStaff', User::class);
        }

        $user = DB::transaction(function () use ($data) {
            return User::create([
                'name' => $data['name'],
                'email' => $data['email'],
                'password' => Hash::make($data['password']),
                'role' => $data['role'],
                'status' => $data['status'] ?? 'active',
            ]);
        });

        return (new UserResource($user))
            ->response()
            ->setStatusCode(201);
    }

    public function update(UpdateUserRequest $request, User $user)
    {
        $data = $request->validated();

        $this->authorize('update', $user);

        if (
            array_key_exists('role', $data)
            && $data['role'] !== $user->role
        ) {
            $this->authorize('manageStaff', User::class);
        }

        $user->update(
            collect($data)
                ->except('password')
                ->all()
        );

        if (! empty($data['password'])) {
            $user->update([
                'password' => Hash::make($data['password']),
            ]);
        }

        return new UserResource($user->fresh());
    }

    public function destroy(User $user)
    {
        $this->authorize('delete', $user);

        $user->delete();

        return response()->noContent();
    }

    public function activate(User $user)
    {
        $this->authorize('manageStaff', User::class);

        abort_if(
            $user->role !== 'staff',
            422,
            'Only staff users can be activated or deactivated.'
        );

        $user->update([
            'status' => 'active',
        ]);

        return new UserResource($user->fresh());
    }

    public function deactivate(User $user)
    {
        $this->authorize('manageStaff', User::class);

        abort_if(
            $user->role !== 'staff',
            422,
            'Only staff users can be activated or deactivated.'
        );

        $user->update([
            'status' => 'inactive',
        ]);

        return new UserResource($user->fresh());
    }
}
