<?php

namespace App\Actions\Fortify;

use App\Models\User;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Password;
use Illuminate\Support\Str;
use Illuminate\Validation\Rules;
use Laravel\Fortify\Contracts\ResetsUserPasswords;

class ResetUserPassword implements ResetsUserPasswords
{
    /**
     * Validate and reset the user's forgotten password.
     *
     * @param  array<string, string>  $input
     */
    public function reset(User $user, array $input): void
    {
        // Validate password strength
        $this->validatePasswordStrength($input['password']);

        $user->forceFill([
            'password' => Hash::make($input['password']),
            'remember_token' => Str::random(60),
        ])->save();

        // You may want to log the user out of all sessions here
        // $user->tokens()->delete();
    }

    private function validatePasswordStrength(string $password): void
    {
        if (strlen($password) < 8) {
            throw \Illuminate\Validation\ValidationException::withMessages([
                'password' => ['Password must be at least 8 characters long.'],
            ]);
        }

        if (!preg_match('/[a-z]/', $password)) {
            throw \Illuminate\Validation\ValidationException::withMessages([
                'password' => ['Password must contain at least one lowercase letter.'],
            ]);
        }

        if (!preg_match('/[A-Z]/', $password)) {
            throw \Illuminate\Validation\ValidationException::withMessages([
                'password' => ['Password must contain at least one uppercase letter.'],
            ]);
        }

        if (!preg_match('/\d/', $password)) {
            throw \Illuminate\Validation\ValidationException::withMessages([
                'password' => ['Password must contain at least one number.'],
            ]);
        }

        if (!preg_match('/[@$!%*?&]/', $password)) {
            throw \Illuminate\Validation\ValidationException::withMessages([
                'password' => ['Password must contain at least one special character.'],
            ]);
        }
    }
}
