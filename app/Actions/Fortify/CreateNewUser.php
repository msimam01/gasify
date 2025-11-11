<?php

namespace App\Actions\Fortify;

use App\Models\User;
use App\Modules\Auth\DTOs\RegisterDto;
use App\Modules\Auth\Services\AuthService;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\Rule;
use Laravel\Fortify\Contracts\CreatesNewUsers;

class CreateNewUser implements CreatesNewUsers
{
    public function __construct(
        protected AuthService $authService
    ) {}

    /**
     * Create a newly registered user.
     *
     * @param  array<string, string>  $input
     */
    public function create(array $input): User
    {
        Validator::make($input, [
            'name' => ['required', 'string', 'max:255'],
            'email' => [
                'required',
                'string',
                'email',
                'max:255',
                Rule::unique(User::class),
            ],
            'phone' => [
                'required',
                'string',
                'max:20',
                Rule::unique(User::class),
            ],
            'password' => ['required', 'string', 'confirmed', 'min:8'],
        ])->validate();

        $dto = RegisterDto::fromRequest($input);

        return $this->authService->register($dto);
    }
}
