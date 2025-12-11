<?php

namespace App\Http\Controllers;

use App\Models\Transactions;
use App\Models\UserWallets;
use App\Models\WalletBalances;
use App\Models\PricingRules;
use App\Jobs\ProcessBlockchainWithdrawal;
use App\Services\SolanaService;
use App\Services\VirtualAccountService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Http;
use Inertia\Inertia;

class WalletController extends Controller
{
    public function index()
    {
        $user = Auth::user();

        // Get user's wallet balances
        $balances = WalletBalances::where('user_id', $user->id)
            ->get()
            ->map(function ($balance) {
                return [
                    'currency' => $balance->currency,
                    'balance' => $balance->balance_minor / 100, // Convert from minor units
                    'reserved' => $balance->reserved_minor / 100,
                    'available' => ($balance->balance_minor - $balance->reserved_minor) / 100,
                    'token_balance' => $balance->token_balance,
                ];
            });
        // Blockchain wallets
        $wallets = UserWallets::with('chain')
            ->where('user_id', $user->id)
            ->get()
            ->map(function ($wallet) {
                return [
                    'id' => $wallet->id,
                    'chain' => $wallet->chain->name,
                    'symbol' => $wallet->chain->symbol,
                    'address' => $wallet->address,
                    'is_primary' => $wallet->is_primary,
                    'logo' => $wallet->chain->logo,
                    'balance' => optional(
                        \App\Models\WalletBalances::where('user_id', $wallet->user_id)
                            ->where('currency', $wallet->chain->symbol)
                            ->first()
                    )->token_balance ?? 0,
                ];
            });

        // Get recent transactions (limit to 5)
        $recentTransactions = Transactions::where('user_id', $user->id)
            ->orderBy('created_at', 'desc')
            ->limit(5)
            ->get()
            ->map(function ($transaction) {
                // Determine chain name based on currency
                $chainName = null;
                $chainLogo = null;

                if (in_array($transaction->currency, ['SOL'])) {
                    $chainName = 'Solana';
                    $chainLogo = '/solana-logo.svg';
                } elseif (in_array($transaction->currency, ['ETH', 'USDT', 'USDC'])) {
                    $chainName = 'Ethereum';
                    $chainLogo = '/ethereum-logo.svg';
                } elseif (in_array($transaction->currency, ['BTC'])) {
                    $chainName = 'Bitcoin';
                    $chainLogo = '/bitcoin-logo.svg';
                } elseif (in_array($transaction->currency, ['NGN', 'USD'])) {
                    $chainName = 'Fiat';
                    $chainLogo = null;
                }

                // Determine amount based on currency type
                $amount = 0;
                if (in_array($transaction->currency, ['NGN', 'USD'])) {
                    // Fiat currencies use amount_minor
                    $amount = $transaction->amount_minor ? $transaction->amount_minor / 100 : 0;
                } else {
                    // Crypto currencies use amount_token
                    $amount = $transaction->amount_token ?? 0;
                }

                return [
                    'id' => $transaction->id,
                    'type' => $transaction->type,
                    'currency' => $transaction->currency,
                    'amount' => $amount,
                    'reference' => $transaction->reference,
                    'created_at' => $transaction->created_at->format('M d, Y H:i'),
                    'date' => $transaction->created_at->format('M d, Y'),
                    'time' => $transaction->created_at->format('H:i'),
                    'status' => $transaction->status ?? 'completed',
                    'chain_name' => $chainName,
                    'chain_logo' => $chainLogo,
                    'explorer_url' => $transaction->explorer_url ?? null,
                    'tx_hash' => $transaction->tx_hash ?? null,
                    'meta' => $transaction->meta,
                ];
            });

        return Inertia::render('Wallet/Index', [
            'balances' => $balances,
            'wallets' => $wallets,
            'recentTransactions' => $recentTransactions,
        ]);
    }

    public function topup()
    {
        $user = Auth::user();

        // Fetch user's blockchain wallets to display for crypto deposits
        $wallets = UserWallets::with('chain')
            ->where('user_id', $user->id)
            ->get()
            ->map(function ($wallet) {
                return [
                    'id' => $wallet->id,
                    'chain' => $wallet->chain->name,
                    'symbol' => $wallet->chain->symbol,
                    'address' => $wallet->address,
                    'logo' => $wallet->chain->logo,
                ];
            });

        return Inertia::render('Wallet/Topup', [
            'wallets' => $wallets,
        ]);
    }

    public function getVirtualAccount()
    {
        $user = auth()->user();

        $virtualAccount = $user->virtualAccounts()
            ->where('status', 'active')
            ->where(function ($query) {
                $query->whereNull('expires_at')
                      ->orWhere('expires_at', '>', now());
            })
            ->first();

        if (!$virtualAccount) {
            // Create virtual account if it doesn't exist
            $virtualAccount = app(VirtualAccountService::class)->createForUser($user);
        }

        return response()->json([
            'account_name' => $virtualAccount->account_name,
            'account_number' => $virtualAccount->account_number,
            'bank_name' => $virtualAccount->bank_name,
            'provider' => $virtualAccount->provider,
            'reference' => $virtualAccount->reference,
        ]);
    }
}
