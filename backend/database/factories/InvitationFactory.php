<?php

namespace Database\Factories;

use App\Models\Invitation;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * @extends Factory<Invitation>
 */
class InvitationFactory extends Factory
{
    /**
     * The name of the factory's corresponding model.
     *
     * @var string
     */
    protected $model = Invitation::class;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'invited_email' => fake()->unique()->safeEmail(),
            'token_hash' => hash('sha256', Str::random(80)),
            'type' => fake()->randomElement(['staff', 'master_admin']),
            'created_by' => User::factory(),
            'status' => 'pending',
            'expires_at' => now()->addDays(7),
            'accepted_at' => null,
            'approved_by' => null,
            'approved_at' => null,
            'rejected_at' => null,
            'revoked_at' => null,
        ];
    }
}
