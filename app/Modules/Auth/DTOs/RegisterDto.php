<?php

namespace App\Modules\Auth\DTOs;

class RegisterDto
{
    public function __construct(
        public string $name,
        public string $email,
        public string $phone,
        public string $country,
        public string $city,
        public string $password,
        public string $password_confirmation
    ) {}

    public static function fromRequest(array $data): self
    {
        return new self(
            name: $data['name'],
            email: strtolower($data['email']),
            phone: $data['phone'],
            country: $data['country'],
            city: $data['city'],
            password: $data['password'],
            password_confirmation: $data['password_confirmation']
        );
    }

    public function toArray(): array
    {
        return [
            'name' => $this->name,
            'email' => $this->email,
            'phone' => $this->phone,
            'country' => $this->country,
            'city' => $this->city,
            'password' => $this->password,
            'password_confirmation' => $this->password_confirmation,
        ];
    }
}
