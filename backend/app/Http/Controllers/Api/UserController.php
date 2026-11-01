<?php

namespace App\Http\Controllers\Api;

use App\Filters\Admin\UserFilter;
use App\Http\Controllers\Controller;
use App\Http\Requests\IndexUsersRequest;
use App\Http\Requests\StoreUserRequest;
use App\Http\Requests\UpdateUserRequest;
use App\Http\Resources\UserResource;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

class UserController extends Controller
{
    public function index(IndexUsersRequest $request, UserFilter $filter)
    {
        $this->authorize('viewAny', User::class);

        $filters = $request->validated();
        $perPage = (int) ($filters['per_page'] ?? 20);

        $users = $filter
            ->apply(User::query(), $filters)
            ->paginate($perPage);

        return UserResource::collection($users);
    }

    public function show(User $user)
    {
        $this->authorize('update', $user);

        return new UserResource($user);
    }

    public function store(StoreUserRequest $request)
    {
        $this->authorize('create', User::class);

        $data = $request->validated();

        $permissions = $data['role'] === 'staff'
            ? array_values($data['permissions'] ?? [])
            : [];

        if ($permissions !== []) {
            $this->authorize('manageStaff', User::class);
        }

        $user = DB::transaction(function () use ($data, $permissions) {
            return User::create([
                'name' => $data['name'],
                'email' => $data['email'],
                'password' => Hash::make($data['password']),
                'role' => $data['role'],
                'status' => $data['status'] ?? 'active',
                'permissions' => $permissions,
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

        if (array_key_exists('permissions', $data)) {
            if ($user->role !== 'staff') {
                throw ValidationException::withMessages([
                    'permissions' => [__('api.permissions_staff_only')],
                ]);
            }

            $data['permissions'] = array_values($data['permissions']);
        }

        $user->update(
            collect($data)
                ->except('password')
                ->all()
        );

        if (($data['role'] ?? null) === 'customer') {
            $user->update(['permissions' => []]);
        }

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

    public function restore(User $user)
    {
        $this->authorize('restore', $user);

        if ($user->trashed()) {
            $user->restore();
        }

        return new UserResource($user->fresh());
    }

    public function forceDelete(User $user)
    {
        $this->authorize('forceDelete', $user);

        if (! $user->trashed()) {
            throw ValidationException::withMessages([
                'user' => [__('api.user_must_be_trashed')],
            ]);
        }

        if ($user->orders()->withTrashed()->exists()) {
            throw ValidationException::withMessages([
                'user' => [__('api.user_with_orders_cannot_be_deleted')],
            ]);
        }

        $user->forceDelete();

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
