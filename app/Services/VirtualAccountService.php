<?php

namespace App\Services;

use App\Models\VirtualAccount;
use App\Models\User;
use App\Models\WalletBalances;
use App\Models\Transactions;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class VirtualAccountService
{
    private string $secretKey;
    private string $baseUrl;

    public function __construct()
    {
        $this->secretKey = config('services.paystack.secret_key');
        $this->baseUrl = config('services.paystack.base_url', 'https://api.paystack.co');
    }

    /**
     * Create a virtual account for a user
     */
    public function createForUser(User $user): VirtualAccount
    {
        // Check if user already has a virtual account
        $existingAccount = $user->virtualAccounts()
            ->where('status', 'active')
            ->where(function ($query) {
                $query->whereNull('expires_at')
                      ->orWhere('expires_at', '>', now());
            })
            ->first();

        if ($existingAccount) {
            return $existingAccount;
        }

        try {
            // If no API key is configured, create a mock virtual account for testing
            if (empty($this->secretKey) || $this->secretKey === 'your_secret_key_here') {
                Log::info('Creating mock virtual account for user', ['user_id' => $user->id]);

                $mockData = [
                    'reference' => 'MOCK_' . uniqid() . '_' . $user->id,
                    'account_name' => strtoupper($user->name),
                    'account_number' => $this->generateMockAccountNumber(),
                    'bank' => ['name' => 'Wema Bank'],
                    'created_at' => now(),
                ];

                return $this->createVirtualAccountRecord($user, $mockData);
            }

            $response = Http::withHeaders([
                'Authorization' => 'Bearer ' . $this->secretKey,
                'Content-Type' => 'application/json',
            ])->post($this->baseUrl . '/dedicated_account', [
                'customer' => [
                    'email' => $user->email,
                    'name' => $user->name,
                ],
                'preferred_bank' => 'wema-bank',
            ]);

            if (!$response->successful()) {
                Log::error('Paystack Virtual Account Creation Failed', [
                    'user_id' => $user->id,
                    'status' => $response->status(),
                    'response' => $response->body(),
                ]);

                // Fallback to mock account if API fails
                Log::info('Falling back to mock virtual account', ['user_id' => $user->id]);
                return $this->createMockAccount($user);
            }

            $data = $response->json('data');

            if (!$data) {
                Log::error('Invalid Paystack API response', [
                    'user_id' => $user->id,
                    'response' => $response->body(),
                ]);
                return $this->createMockAccount($user);
            }

            return $this->createVirtualAccountRecord($user, $data);

        } catch (\Exception $e) {
            Log::error('Exception creating virtual account', [
                'user_id' => $user->id,
                'error' => $e->getMessage(),
            ]);

            // Fallback to mock account if API fails
            return $this->createMockAccount($user);
        }
    }

    /**
     * Create a mock virtual account for testing
     */
    private function createMockAccount(User $user): VirtualAccount
    {
        $mockData = [
            'reference' => 'MOCK_' . uniqid() . '_' . $user->id,
            'account_name' => strtoupper($user->name),
            'account_number' => $this->generateMockAccountNumber(),
            'bank' => ['name' => 'Wema Bank'],
            'created_at' => now(),
        ];

        Log::info('Created mock virtual account', [
            'user_id' => $user->id,
            'account_number' => $mockData['account_number'],
        ]);

        return $this->createVirtualAccountRecord($user, $mockData);
    }

    /**
     * Create virtual account record in database
     */
    private function createVirtualAccountRecord(User $user, array $data): VirtualAccount
    {
        $virtualAccount = VirtualAccount::create([
            'user_id' => $user->id,
            'reference' => $data['reference'],
            'account_name' => $data['account_name'],
            'account_number' => $data['account_number'],
            'bank_name' => $data['bank']['name'] ?? 'Wema Bank',
            'provider' => 'paystack',
            'status' => 'active',
            'meta' => $data,
        ]);

        Log::info('Virtual account created successfully', [
            'user_id' => $user->id,
            'account_number' => $virtualAccount->account_number,
            'account_name' => $virtualAccount->account_name,
        ]);

        return $virtualAccount;
    }

    /**
     * Generate a mock account number
     */
    private function generateMockAccountNumber(): string
    {
        // Generate a 10-digit NGN-style account number
        return str_pad(mt_rand(1, 9999999999), 10, '0', STR_PAD_LEFT);
    }

    /**
     * Handle Paystack webhook events
     */
    public function handleWebhook(array $payload): void
    {
        $event = $payload['event'];

        switch ($event) {
            case 'transfer.success':
                $this->handleTransferSuccess($payload);
                break;
            case 'dedicatedaccount.account_assigned':
                Log::info('Virtual account assigned', ['data' => $payload['data']]);
                break;
            default:
                Log::info('Unhandled Paystack webhook event', ['event' => $event]);
        }
    }

    /**
     * Handle successful transfer events
     */
    private function handleTransferSuccess(array $payload): void
    {
        $data = $payload['data'];

        // Find virtual account by reference
        $virtualAccount = VirtualAccount::where('reference', $data['reference'])
            ->where('status', 'active')
            ->first();

        if (!$virtualAccount) {
            Log::warning('Virtual account not found for reference', ['reference' => $data['reference']]);
            return;
        }

        $amount = $data['amount']; // Amount in kobo
        $reference = $data['reference'];

        // Check if transaction already processed
        if (Transactions::where('reference', $reference)->exists()) {
            Log::info('Transaction already processed', ['reference' => $reference]);
            return;
        }

        // Ensure user has a NGN wallet balance
        $walletBalance = $virtualAccount->user->walletBalances()
            ->firstOrCreate(
                ['currency' => 'NGN'],
                ['balance_minor' => 0, 'reserved_minor' => 0]
            );

        // Credit the wallet
        $walletBalance->increment('balance_minor', $amount);

        // Create transaction record
        $transaction = Transactions::create([
            'user_id' => $virtualAccount->user_id,
            'type' => 'deposit',
            'currency' => 'NGN',
            'amount_minor' => $amount,
            'status' => 'completed',
            'reference' => $reference,
            'provider' => 'paystack',
            'meta' => [
                'virtual_account_id' => $virtualAccount->id,
                'bank_name' => $virtualAccount->bank_name,
                'account_number' => $virtualAccount->account_number,
            ],
        ]);

        Log::info('Virtual account deposit processed', [
            'user_id' => $virtualAccount->user_id,
            'amount' => $amount / 100, // Convert to naira
            'reference' => $reference,
        ]);
    }

    /**
     * Get or create virtual account for user
     */
    public function getOrCreateForUser(User $user): VirtualAccount
    {
        return $this->createForUser($user);
    }

    /**
     * Deactivate virtual account
     */
    public function deactivate(VirtualAccount $virtualAccount): void
    {
        $virtualAccount->update(['status' => 'inactive']);
    }
}
