<?php

namespace App\Http\Controllers;

use App\Models\WalletBalances;
use App\Models\Transactions;
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
            'recentTransactions' => $recentTransactions,
        ]);
    }

    public function topup()
    {
        return Inertia::render('Wallet/Topup');
    }

    public function processTopup(Request $request)
    {
        $request->validate([
            'amount' => 'required|numeric|min:100',
            'currency' => 'required|in:NGN,USD',
            'payment_method' => 'required|in:opay,paystack,flutterwave',
        ]);

        // Here you would integrate with your payment processor
        // For now, we'll just simulate a successful payment
        
        $user = auth()->user();
        $amountMinor = $request->amount * 100; // Convert to minor units

        // Create or update wallet balance
        $balance = WalletBalances::firstOrCreate(
            [
                'user_id' => $user->id,
                'currency' => $request->currency,
            ],
            [
                'balance_minor' => 0,
                'reserved_minor' => 0,
            ]
        );

        $balanceBefore = $balance->balance_minor;
        $balance->balance_minor += $amountMinor;
        $balance->save();

        // Create transaction record
        Transactions::create([
            'user_id' => $user->id,
            'type' => 'deposit',
            'currency' => $request->currency,
            'amount_minor' => $amountMinor,
            'balance_before_minor' => $balanceBefore,
            'balance_after_minor' => $balance->balance_minor,
            'reference' => 'TOP-' . now()->format('YmdHis') . '-' . str_pad(rand(1, 999), 3, '0', STR_PAD_LEFT),
            'meta' => [
                'payment_method' => $request->payment_method,
                'status' => 'completed',
            ],
        ]);

        return redirect()->route('wallet')->with('success', 'Wallet topped up successfully!');
    }
}