<?php

namespace App\Modules\Auth\DTOs;

class LoginDto
{
    public function __construct(
        public string $email,
        public string $password,
        public bool $remember = false
    ) {}

    public static function fromRequest(array $data): self
    {
        return new self(
            email: strtolower($data['email']),
            password: $data['password'],
            remember: $data['remember'] ?? false
        );
    }

    public function toArray(): array
    {
        return [
            'email' => $this->email,
            'password' => $this->password,
            'remember' => $this->remember,
        ];
    }
}
