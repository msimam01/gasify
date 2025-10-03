<?php

namespace App\Jobs;

use App\Models\UserWallets;
use App\Models\WalletBalances;
use App\Services\WalletService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;

class UpdateWalletBalances implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public function handle(WalletService $walletService): void
    {
       \Log::info("UpdateWalletBalances job started!");

    $wallets = UserWallets::with('chain')->get();
    \Log::info("Found wallets: " . $wallets->count());
        foreach ($wallets as $wallet) {
            try {
                $balance = 0;

                switch ($wallet->chain->slug) {
                    case 'ethereum':
                        $balance = $walletService->getEvmBalance($wallet->address, config('services.ethereum.rpc'));
                        break;

                    case 'sidra':
                        $balance = $walletService->getEvmBalance($wallet->address, config('services.sidra.rpc'));
                        break;

                    case 'solana':
                        $balance = $walletService->getSolanaBalance($wallet->address);
                        break;

                    default:
                        $balance = 0;
                }

                // update or create WalletBalances row
                WalletBalances::updateOrCreate(
                    [
                        'user_id' => $wallet->user_id,
                        'currency' => $wallet->chain->symbol, // e.g. ETH, SOL
                    ],
                    [
                        'token_balance' => $balance,
                    ]
                );
            } catch (\Throwable $e) {
                Log::error("Balance update failed for wallet {$wallet->id}: {$e->getMessage()}");
            }
        }
    }
}
