<?php

namespace App\Services;

use App\Models\Chains;
use App\Models\User;
use App\Models\UserWallets;
use App\Models\WalletBalances;
use Illuminate\Support\Facades\Crypt;
use Illuminate\Support\Str;

class WalletService
{
    /**
     * Initialize fiat + blockchain wallets for a new user
     */
    public function initializeUserWallets(User $user): void
    {
        // 1. Fiat wallet (NGN only for now)
        WalletBalances::firstOrCreate([
            'user_id' => $user->id,
            'currency' => 'NGN',
        ], [
            'balance_minor' => 0,
            'reserved_minor' => 0,
        ]);

        // 2. Blockchain wallets
        $chains = Chains::all();

        foreach ($chains as $chain) {
            // Generate dummy wallets (replace later with real SDKs per chain)
            $address = match ($chain->slug) {
                'ethereum' => '0x' . Str::random(40),
                'solana'   => Str::random(44),
                'pi'       => 'PI' . Str::upper(Str::random(38)),
                'sidra'    => 'SIDRA' . Str::upper(Str::random(36)),
                default    => Str::random(42),
            };

            $privateKey = Str::random(64);

            UserWallets::firstOrCreate([
                'user_id' => $user->id,
                'chain_id' => $chain->id,
                'address' => $address,
            ], [
                'is_primary' => true,
                'meta' => [
                    'encrypted_pk' => Crypt::encryptString($privateKey),
                ],
            ]);
        }
    }
}
