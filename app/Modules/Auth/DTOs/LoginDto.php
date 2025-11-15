<?php

namespace App\Modules\Auth\DTOs;

class LoginDto
{
    public function __construct(
        public ?string $email = null,
        public ?string $phone = null,
        public string $password,
        public bool $remember = false
    ) {}

    public static function fromRequest(array $data): self
    {
        return new self(
            email: isset($data['email']) ? strtolower($data['email']) : null,
            phone: $data['phone'] ?? null,
            password: $data['password'],
            remember: $data['remember'] ?? false
        );
    }

    public function toArray(): array
    {
        return [
            'email' => $this->email,
            'phone' => $this->phone,
            'password' => $this->password,
            'remember' => $this->remember,
        ];
    }

    public function getIdentifier(): string
    {
        return $this->email ?: $this->phone;
    }

    public function isPhoneLogin(): bool
    {
        return !empty($this->phone);
    }

    public function isEmailLogin(): bool
    {
        return !empty($this->email);
    }
}
