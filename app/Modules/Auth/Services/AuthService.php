<?php

namespace App\Modules\Auth\Services;

use App\Models\User;
use App\Modules\Auth\DTOs\RegisterDto;
use App\Modules\Auth\DTOs\LoginDto;
use App\Modules\Auth\Events\UserRegistered;
use Illuminate\Auth\Events\Registered;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

class AuthService
{
    public function register(RegisterDto $dto): User
    {
        // Validate password strength
        $this->validatePasswordStrength($dto->password);

        // Check if email or phone already exists
        if (User::where('email', $dto->email)->exists()) {
            throw ValidationException::withMessages([
                'email' => ['This email address is already registered.'],
            ]);
        }

        if (User::where('phone', $dto->phone)->exists()) {
            throw ValidationException::withMessages([
                'phone' => ['This phone number is already registered.'],
            ]);
        }

        $user = User::create([
            'name' => $dto->name,
            'email' => $dto->email,
            'phone' => $dto->phone,
            'password' => Hash::make($dto->password),
        ]);

        // Fire events
        event(new Registered($user));
        event(new UserRegistered($user));

        return $user;
    }

    public function login(LoginDto $dto): bool
    {
        $credentials = [
            'email' => $dto->email,
            'password' => $dto->password,
        ];

        if (Auth::attempt($credentials, $dto->remember)) {
            return true;
        }

        throw ValidationException::withMessages([
            'email' => ['The provided credentials are incorrect.'],
        ]);
    }

    public function logout(): void
    {
        Auth::logout();
    }

    private function validatePasswordStrength(string $password): void
    {
        if (strlen($password) < 8) {
            throw ValidationException::withMessages([
                'password' => ['Password must be at least 8 characters long.'],
            ]);
        }

        if (!preg_match('/[a-z]/', $password)) {
            throw ValidationException::withMessages([
                'password' => ['Password must contain at least one lowercase letter.'],
            ]);
        }

        if (!preg_match('/[A-Z]/', $password)) {
            throw ValidationException::withMessages([
                'password' => ['Password must contain at least one uppercase letter.'],
            ]);
        }

        if (!preg_match('/\d/', $password)) {
            throw ValidationException::withMessages([
                'password' => ['Password must contain at least one number.'],
            ]);
        }

        if (!preg_match('/[@$!%*?&]/', $password)) {
            throw ValidationException::withMessages([
                'password' => ['Password must contain at least one special character.'],
            ]);
        }
    }
}
