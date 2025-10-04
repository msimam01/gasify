<?php

namespace App\Http\Controllers;

use App\Models\Transactions;
use App\Models\UserWallets;
use App\Models\WalletBalances;
use App\Models\PricingRules;
use Illuminate\Http\Request;
use Inertia\Inertia;

class WalletController extends Controller
{
    public function index()
    {
        $user = auth()->user();

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

        // Get recent transactions
        $recentTransactions = Transactions::where('user_id', $user->id)
            ->orderBy('created_at', 'desc')
            ->limit(10)
            ->get()
            ->map(function ($transaction) {
                return [
                    'id' => $transaction->id,
                    'type' => $transaction->type,
                    'currency' => $transaction->currency,
                    'amount' => $transaction->amount_minor ? $transaction->amount_minor / 100 : $transaction->amount_token,
                    'reference' => $transaction->reference,
                    'created_at' => $transaction->created_at->format('M d, Y H:i'),
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
        $user = auth()->user();

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

public function processTopup(Request $request)
{
    $request->validate([
        'amount' => 'required|numeric|min:100',
        'currency' => 'required|in:NGN,USD',
        'payment_method' => 'required|in:opay,paystack,flutterwave',
    ]);

    $user = auth()->user();
    $amountMinor = $request->amount * 100;

    // 1. Calculate fees (using fiat "chain" rules)
    $pricing = \App\Models\PricingRules::whereHas('chain', fn($q) =>
        $q->where('slug', 'fiat')) // you can define a pseudo-chain for fiat
        ->first();

    $fee = ($pricing->percent_fee * $amountMinor) + $pricing->flat_fee_minor;
    $netAmount = $amountMinor - $fee;

    // 2. Update balance
    $balance = WalletBalances::firstOrCreate(
        ['user_id' => $user->id, 'currency' => $request->currency],
        ['balance_minor' => 0, 'reserved_minor' => 0]
    );

    $balanceBefore = $balance->balance_minor;
    $balance->balance_minor += $netAmount;
    $balance->save();

    // 3. Record deposit
    $deposit = \App\Models\Deposits::create([
        'user_id' => $user->id,
        'provider' => $request->payment_method,
        'amount_minor' => $amountMinor,
        'currency' => $request->currency,
        'status' => 'completed',
        'meta' => ['fee' => $fee],
    ]);

    // 4. Record transactions
    Transactions::create([
        'user_id' => $user->id,
        'type' => 'deposit',
        'currency' => $request->currency,
        'amount_minor' => $netAmount,
        'balance_before_minor' => $balanceBefore,
        'balance_after_minor' => $balance->balance_minor,
        'reference' => $deposit->id,
        'meta' => ['payment_method' => $request->payment_method],
    ]);

    // Separate fee transaction
    if ($fee > 0) {
        Transactions::create([
            'user_id' => $user->id,
            'type' => 'fee',
            'currency' => $request->currency,
            'amount_minor' => $fee,
            'balance_before_minor' => $balanceBefore,
            'balance_after_minor' => $balance->balance_minor,
            'reference' => $deposit->id,
            'meta' => ['context' => 'deposit'],
        ]);
    }

    return redirect()->route('wallet')->with('success', 'Wallet topped up successfully!');
}

    public function requestWithdrawal(Request $request)
{
    $request->validate([
        'amount' => 'required|numeric|min:500',
        'currency' => 'required|in:NGN,USD',
        'destination' => 'required|string', // e.g. bank acct or wallet address
    ]);

    $user = auth()->user();
    $amountMinor = $request->amount * 100;

    $balance = WalletBalances::where('user_id', $user->id)
        ->where('currency', $request->currency)
        ->firstOrFail();

    if ($balance->available_balance < $amountMinor / 100) {
        return back()->withErrors(['amount' => 'Insufficient funds']);
    }

    // Calculate fees
    $pricing = PricingRules::whereHas('chain', fn($q) =>
        $q->where('slug', 'fiat'))->first();

    $fee = ($pricing->percent_fee * $amountMinor) + $pricing->flat_fee_minor;
    $netAmount = $amountMinor - $fee;

    // Reserve balance (prevent double spend)
    $balanceBefore = $balance->balance_minor;
    $balance->balance_minor -= $amountMinor;
    $balance->reserved_minor += $amountMinor;
    $balance->save();

    // Create withdrawal transaction
    Transactions::create([
        'user_id' => $user->id,
        'type' => 'withdrawal',
        'currency' => $request->currency,
        'amount_minor' => $netAmount,
        'balance_before_minor' => $balanceBefore,
        'balance_after_minor' => $balance->balance_minor,
        'reference' => 'WDL-' . now()->timestamp,
        'meta' => ['destination' => $request->destination, 'fee' => $fee],
    ]);

    // Separate fee transaction
    if ($fee > 0) {
        Transactions::create([
            'user_id' => $user->id,
            'type' => 'fee',
            'currency' => $request->currency,
            'amount_minor' => $fee,
            'balance_before_minor' => $balanceBefore,
            'balance_after_minor' => $balance->balance_minor,
            'reference' => 'WDL-FEE-' . now()->timestamp,
            'meta' => ['context' => 'withdrawal'],
        ]);
    }

    // TODO: queue actual blockchain/bank payout job here

    return redirect()->route('wallet')->with('success', 'Withdrawal request submitted!');
}

}
