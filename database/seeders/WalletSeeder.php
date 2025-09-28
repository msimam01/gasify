<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\User;
use App\Models\WalletBalances;
use App\Models\Transactions;

class WalletSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Get the first user (assuming you have at least one user)
        $user = User::first();
        
        if (!$user) {
            $this->command->info('No users found. Please create a user first.');
            return;
        }

        // Create wallet balances
        WalletBalances::create([
            'user_id' => $user->id,
            'currency' => 'NGN',
            'balance_minor' => 50000000, // ₦500,000 in kobo
            'reserved_minor' => 5000000, // ₦50,000 reserved
        ]);

        WalletBalances::create([
            'user_id' => $user->id,
            'currency' => 'USD',
            'balance_minor' => 100000, // $1,000 in cents
            'reserved_minor' => 0,
        ]);

        // Create sample transactions
        $transactions = [
            [
                'user_id' => $user->id,
                'type' => 'deposit',
                'currency' => 'NGN',
                'amount_minor' => 10000000, // ₦100,000
                'balance_before_minor' => 40000000,
                'balance_after_minor' => 50000000,
                'reference' => 'DEP-' . now()->format('YmdHis') . '-001',
                'created_at' => now()->subDays(2),
                'updated_at' => now()->subDays(2),
            ],
            [
                'user_id' => $user->id,
                'type' => 'purchase',
                'currency' => 'NGN',
                'amount_minor' => 2500000, // ₦25,000
                'balance_before_minor' => 50000000,
                'balance_after_minor' => 47500000,
                'reference' => 'PUR-' . now()->format('YmdHis') . '-001',
                'created_at' => now()->subDays(1),
                'updated_at' => now()->subDays(1),
            ],
            [
                'user_id' => $user->id,
                'type' => 'deposit',
                'currency' => 'USD',
                'amount_minor' => 50000, // $500
                'balance_before_minor' => 50000,
                'balance_after_minor' => 100000,
                'reference' => 'DEP-' . now()->format('YmdHis') . '-002',
                'created_at' => now()->subHours(12),
                'updated_at' => now()->subHours(12),
            ],
            [
                'user_id' => $user->id,
                'type' => 'fee',
                'currency' => 'NGN',
                'amount_minor' => 150000, // ₦1,500
                'balance_before_minor' => 47500000,
                'balance_after_minor' => 47350000,
                'reference' => 'FEE-' . now()->format('YmdHis') . '-001',
                'created_at' => now()->subHours(6),
                'updated_at' => now()->subHours(6),
            ],
            [
                'user_id' => $user->id,
                'type' => 'withdrawal',
                'currency' => 'NGN',
                'amount_minor' => 5000000, // ₦50,000
                'balance_before_minor' => 47350000,
                'balance_after_minor' => 42350000,
                'reference' => 'WTH-' . now()->format('YmdHis') . '-001',
                'created_at' => now()->subHours(2),
                'updated_at' => now()->subHours(2),
            ],
        ];

        foreach ($transactions as $transaction) {
            Transactions::create($transaction);
        }

        $this->command->info('Wallet data seeded successfully!');
    }
}