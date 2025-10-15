<?php

namespace App\Http\Controllers;

use App\Models\Transactions;
use App\Models\UserWallets;
use App\Models\WalletBalances;
use App\Models\PricingRules;
use App\Jobs\ProcessBlockchainWithdrawal;
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

    if ($request->wantsJson()) {
        return response()->json([
            'message' => 'Withdrawal request submitted successfully',
            'transaction_id' => $transaction->id,
        ]);
    }

    return redirect()->route('wallet')->with('success', 'Withdrawal request submitted!');
}

/**
 * Show the withdrawal form
 */
public function withdraw()
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

    return Inertia::render('Wallet/Withdraw', [
        'balances' => $balances,
    ]);
}

/**
 * Process withdrawal request from web form
 */
public function processWithdrawal(Request $request)
{
    $validated = $request->validate([
        'amount' => 'required|numeric|gt:0',
        'currency' => 'required|in:NGN,USD,USDT,USDC,BTC,ETH',
        'wallet_address' => 'required_if:currency,ETH,USDT,USDC|string|max:255',
        'network' => 'required_if:currency,ETH,USDT,USDC|in:ethereum,binance,arbitrum,optimism',
        'memo' => 'nullable|string|max:255',
    ]);

    // Additional validation for ETH address
    if (in_array($validated['currency'], ['ETH', 'USDT', 'USDC'])) {
        if (!preg_match('/^0x[a-fA-F0-9]{40}$/', $validated['wallet_address'])) {
            return back()->withErrors(['wallet_address' => 'Invalid Ethereum address format']);
        }
    }

    // Set minimum amount based on currency
    $minAmounts = [
        'NGN' => 500,
        'USD' => 10,
        'ETH' => 0.000001,
        'USDT' => 0.000001,
        'USDC' => 0.000001,
        'BTC' => 0.000001,
    ];

    if ($validated['amount'] < ($minAmounts[$validated['currency']] ?? 0)) {
        return back()->withErrors([
            'amount' => 'Minimum withdrawal amount for ' . $validated['currency'] . ' is ' . ($minAmounts[$validated['currency']] ?? 'unsupported')
        ]);
    }

    // Set destination and method
    $validated['method'] = in_array($validated['currency'], ['NGN', 'USD']) ? 'bank' : 'crypto';
    $validated['destination'] = $validated['wallet_address'] ?? '';
    
    // For fiat currencies, we need bank details
    if ($validated['method'] === 'bank') {
        // Handle bank withdrawal
        $bankDetails = $request->validate([
            'bank_name' => 'required|string|max:255',
            'account_number' => 'required|string|max:50',
            'account_name' => 'required|string|max:255',
        ]);
        
        $validated['destination'] = json_encode($bankDetails);
    }

    $user = $request->user();
    
    // Get user's wallet for the selected currency
    $wallet = UserWallets::where('user_id', $user->id)
        ->whereHas('chain', function($q) use ($validated) {
            $q->where('symbol', $validated['currency']);
        })
        ->first();
        
    if (!$wallet) {
        return back()->withErrors(['wallet' => 'No wallet found for the selected currency']);
    }

    // Check if user has sufficient balance
    $balance = $this->getUserBalance($user->id, $validated['currency']);
    if ($balance < $validated['amount']) {
        return back()->withErrors(['amount' => 'Insufficient balance']);
    }

    // Create withdrawal record
    $withdrawal = Transactions::create([
        'user_id' => $user->id,
        'type' => 'withdrawal',
        'status' => 'pending',
        'amount' => $validated['amount'],
        'currency' => $validated['currency'],
        'meta' => [
            'method' => $validated['method'],
            'destination' => $validated['destination'],
            'network' => $validated['network'] ?? null,
            'memo' => $validated['memo'] ?? null,
        ],
    ]);

    // Process the withdrawal
    try {
        if ($validated['method'] === 'crypto') {
            // Queue the blockchain withdrawal
            ProcessBlockchainWithdrawal::dispatch(
                $withdrawal,
                $user,
                $wallet,
                $validated['destination'],
                $validated['amount'],
                $validated['currency'],
                $validated['network'] ?? 'ethereum',
                $validated['memo'] ?? null
            )->onQueue('withdrawals');
            
            $message = 'Crypto withdrawal submitted. It may take a few minutes to process.';
        } else {
            // For bank withdrawals, mark as pending admin approval
            $withdrawal->update(['status' => 'processing']);
            // TODO: Notify admin about the bank withdrawal request
            $message = 'Bank withdrawal request submitted. It will be processed within 1-2 business days.';
        }

        return back()->with('success', $message);
        
    } catch (\Exception $e) {
        $withdrawal->update([
            'status' => 'failed',
            'failure_reason' => $e->getMessage()
        ]);
        
        Log::error('Withdrawal failed', [
            'user_id' => $user->id,
            'error' => $e->getMessage(),
            'trace' => $e->getTraceAsString(),
        ]);
        
        return back()->withErrors(['withdrawal' => 'Failed to process withdrawal. Please try again.']);
    }
}

    /**
     * Get user's balance for a specific currency
     * 
     * @param int $userId
     * @param string $currency
     * @return float
     */
    protected function getUserBalance($userId, $currency)
    {
        $balance = WalletBalances::where('user_id', $userId)
            ->where('currency', $currency)
            ->first();
        
        if (!$balance) {
            return 0;
        }
        
        // For cryptocurrencies, use token_balance, otherwise use balance_minor
        return in_array($currency, ['ETH', 'USDT', 'USDC', 'BTC']) 
            ? (float)$balance->token_balance 
            : (float)$balance->balance_minor;
    }
}