<?php

namespace App\Http\Controllers;

use App\Models\Transactions;
use App\Models\UserWallets;
use App\Models\WalletBalances;
use App\Models\PricingRules;
use App\Jobs\ProcessBlockchainWithdrawal;
use App\Services\SolanaService;
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

public function processTopup(Request $request)
{
    $request->validate([
        'amount' => 'required|numeric|min:100',
        'currency' => 'required|in:NGN,USD',
        'payment_method' => 'required|in:opay,paystack,flutterwave',
    ]);

    $user = Auth::user();
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

    $user = Auth::user();
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
            'transaction_id' => 'pending',
        ]);
    }

    return redirect()->route('wallet')->with('success', 'Withdrawal request submitted!');
}

/**
 * Show the withdrawal form
 */
public function withdraw()
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

    return Inertia::render('Wallet/Withdraw', [
        'balances' => $balances,
    ]);
}

/**
 * Process withdrawal request from web form
 */
    public function processWithdrawal(Request $request)
{
        Log::info('processWithdrawal invoked', [
            'user_id' => optional($request->user())->id,
            'payload' => $request->only(['amount','currency','wallet_address','network'])
        ]);
    $validated = $request->validate([
        'amount' => 'required|numeric|gt:0',
            'currency' => 'required|in:NGN,USD,USDT,USDC,BTC,ETH,SOL',
            'wallet_address' => 'required_if:currency,ETH,USDT,USDC,SOL|string|max:255',
            'network' => 'nullable|in:ethereum,binance,arbitrum,optimism,solana',
        'memo' => 'nullable|string|max:255',
    ]);

        Log::info('processWithdrawal validated', [
            'user_id' => optional($request->user())->id,
            'currency' => $validated['currency'],
            'amount' => $validated['amount'],
            'dest_present' => isset($validated['wallet_address']) && $validated['wallet_address'] !== '',
        ]);

        // Additional validation for ETH address
    if (in_array($validated['currency'], ['ETH', 'USDT', 'USDC'])) {
        if (!preg_match('/^0x[a-fA-F0-9]{40}$/', $validated['wallet_address'])) {
            return back()->withErrors(['wallet_address' => 'Invalid Ethereum address format']);
        }
    }

        // Additional validation for SOL address (Base58)
        if ($validated['currency'] === 'SOL') {
            // Base58 character set: 123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz
            // Allow typical Solana pubkey lengths 32-44
            if (!preg_match('/^[1-9A-HJ-NP-Za-km-z]{32,44}$/', $validated['wallet_address'])) {
                Log::warning('processWithdrawal invalid SOL address', [
                    'user_id' => optional($request->user())->id,
                    'address' => $validated['wallet_address'],
                ]);
                return back()->withErrors(['wallet_address' => 'Invalid Solana address format']);
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
            'SOL' => 0.001,
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
    Log::info('processWithdrawal user resolved', [
        'user_id' => optional($user)->id,
    ]);

    // Get user's wallet for the selected currency
    $wallet = UserWallets::where('user_id', $user->id)
        ->whereHas('chain', function($q) use ($validated) {
            $q->where('symbol', $validated['currency']);
        })
        ->first();
    Log::info('processWithdrawal wallet query done', [
        'found' => (bool)$wallet,
    ]);

    if (!$wallet) {
        Log::warning('processWithdrawal no wallet found for currency', [
            'user_id' => $user->id,
            'currency' => $validated['currency'],
        ]);
        return back()->withErrors(['wallet' => 'No wallet found for the selected currency']);
    }

    Log::info('processWithdrawal wallet found', [
        'user_id' => $user->id,
        'currency' => $validated['currency'],
        'wallet_id' => $wallet->id,
        'address' => $wallet->address,
    ]);

    // Check if user has sufficient balance
    $balance = $this->getUserBalance($user->id, $validated['currency']);
    Log::info('processWithdrawal internal balance check', [
        'currency' => $validated['currency'],
        'balance' => $balance,
        'amount' => $validated['amount'],
    ]);
    if ($balance < $validated['amount']) {
        Log::warning('processWithdrawal insufficient internal balance', [
            'user_id' => $user->id,
            'currency' => $validated['currency'],
            'have' => $balance,
            'want' => $validated['amount'],
        ]);
        return back()->withErrors(['amount' => 'Insufficient balance']);
    }

    // Reserve balance for crypto withdrawals BEFORE creating transaction
    if ($validated['method'] === 'crypto') {
        $balanceRecord = WalletBalances::where('user_id', $user->id)
            ->where('currency', $validated['currency'])->firstOrFail();
        if ($balanceRecord->available_token < $validated['amount']) {
            return back()->withErrors(['amount' => 'Insufficient available balance']);
        }
        $balanceRecord->reserved_token += $validated['amount'];
        $balanceRecord->save();
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
                ($validated['currency'] === 'SOL') ? 'solana' : ($validated['network'] ?? 'ethereum'),
                $validated['memo'] ?? null
            )->onQueue('withdrawals');
            Log::info('processWithdrawal job dispatched', [
                'withdrawal_id' => $withdrawal->id,
                'queue' => 'withdrawals',
                'network' => ($validated['currency'] === 'SOL') ? 'solana' : ($validated['network'] ?? 'ethereum'),
            ]);

            $message = 'Withdrawal initiated successfully. Transaction is being processed.';
        } else {
            // For bank withdrawals, mark as pending admin approval
            $withdrawal->update(['status' => 'processing']);
            // TODO: Notify admin about the bank withdrawal request
            $message = 'Bank withdrawal request submitted. It will be processed within 1-2 business days.';
        }

        if ($request->wantsJson()) {
            return response()->json([
                'status' => 'processing',
                'message' => $message,
                'transaction_id' => $withdrawal->id,
                'explorer_url' => null,
                'error' => null
            ]);
        }

        return back()->with('success', $message);

    } catch (\Exception $e) {
        // Map exception to human-readable error
        $humanReadableError = $this->mapExceptionToUserMessage($e);
        
        $withdrawal->update([
            'status' => 'failed',
            'failure_reason' => $humanReadableError
        ]);

        Log::error('Withdrawal controller exception', [
            'user_id' => $user->id,
            'withdrawal_id' => $withdrawal->id,
            'human_readable_error' => $humanReadableError,
            'raw_error' => $e->getMessage(),
            'trace' => $e->getTraceAsString(),
        ]);

        if ($request->wantsJson()) {
            return response()->json([
                'status' => 'failed',
                'message' => null,
                'transaction_id' => $withdrawal->id,
                'explorer_url' => null,
                'error' => $humanReadableError
            ], 422);
        }

        return back()->withErrors(['withdrawal' => $humanReadableError]);
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
        return in_array($currency, ['ETH', 'USDT', 'USDC', 'BTC', 'SOL'])
            ? (float)$balance->token_balance
            : (float)$balance->balance_minor;
    }

    /**
     * Request devnet tokens from Solana faucet (devnet only)
     */
    public function requestDevnetTokens(Request $request, SolanaService $solanaService)
    {
        $request->validate([
            'wallet_id' => 'required|exists:user_wallets,id',
            'amount' => 'nullable|numeric|min:0.1|max:5',
        ]);

        $user = Auth::user();
        $wallet = UserWallets::where('id', $request->wallet_id)
            ->where('user_id', $user->id)
            ->with('chain')
            ->firstOrFail();

        // Only allow for Solana wallets
        if ($wallet->chain->slug !== 'solana') {
            return response()->json([
                'success' => false,
                'message' => 'This feature only works for Solana wallets',
            ], 400);
        }

        // Only allow on devnet
        $network = config('services.solana.network', 'devnet');
        if ($network !== 'devnet') {
            return response()->json([
                'success' => false,
                'message' => "Faucet only available on devnet. Current network: {$network}",
            ], 400);
        }

        $amount = $request->input('amount', 1.0);
        $lamports = $solanaService->convertToLamports($amount);

        try {
            // Request airdrop
            $signature = $this->requestAirdrop($wallet->address, $lamports);

            if (!$signature) {
                throw new \RuntimeException('Failed to request airdrop from faucet');
            }

            Log::info('Devnet faucet request successful', [
                'user_id' => $user->id,
                'wallet_id' => $wallet->id,
                'address' => $wallet->address,
                'amount' => $amount,
                'signature' => $signature,
            ]);

            return response()->json([
                'success' => true,
                'message' => "Successfully requested {$amount} SOL from devnet faucet",
                'signature' => $signature,
                'explorer_url' => $solanaService->getTransactionUrl($signature),
            ]);

        } catch (\Throwable $e) {
            Log::error('Devnet faucet request failed', [
                'user_id' => $user->id,
                'wallet_id' => $wallet->id,
                'address' => $wallet->address,
                'error' => $e->getMessage(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to request tokens: ' . $e->getMessage(),
                'fallback_url' => 'https://faucet.solana.com',
            ], 500);
        }
    }

    /**
     * Request airdrop from Solana devnet
     */
    private function requestAirdrop(string $address, int $lamports): ?string
    {
        $rpcUrl = config('services.solana.rpc', 'https://api.devnet.solana.com');
        
        $payload = [
            'jsonrpc' => '2.0',
            'id' => 1,
            'method' => 'requestAirdrop',
            'params' => [$address, $lamports],
        ];

        $response = Http::timeout(30)->post($rpcUrl, $payload);

        if (!$response->ok()) {
            throw new \RuntimeException("RPC error: HTTP {$response->status()}");
        }

        $json = $response->json();
        
        if (isset($json['error'])) {
            $errorMsg = $json['error']['message'] ?? 'Unknown error';
            throw new \RuntimeException("Faucet error: {$errorMsg}");
        }

        return $json['result'] ?? null;
    }

    /**
     * Map exception to user-friendly error message
     */
    private function mapExceptionToUserMessage(\Throwable $exception): string
    {
        $message = $exception->getMessage();
        
        // Network/RPC errors
        if (stripos($message, 'cURL') !== false || stripos($message, 'timeout') !== false || stripos($message, 'timed out') !== false) {
            return 'Network temporarily unavailable. Please try again in a few moments.';
        }
        
        if (stripos($message, 'RPC') !== false || stripos($message, 'connection') !== false) {
            return 'Unable to connect to blockchain network. Please try again later.';
        }
        
        // Balance errors
        if (stripos($message, 'insufficient') !== false && (stripos($message, 'balance') !== false || stripos($message, 'funds') !== false)) {
            return 'Insufficient blockchain balance to complete this withdrawal.';
        }
        
        // Wallet/key errors
        if (stripos($message, 'decrypt') !== false || stripos($message, 'private key') !== false) {
            return 'Wallet configuration error. Please contact support.';
        }
        
        // Address validation errors
        if (stripos($message, 'invalid') !== false && stripos($message, 'address') !== false) {
            return 'Invalid destination address. Please check and try again.';
        }
        
        // Default: return a generic error message
        return 'Unable to process withdrawal at this time. Please try again or contact support if the issue persists.';
    }

    /**
     * Get withdrawal status (API endpoint for polling)
     */
    public function getWithdrawalStatus(Request $request, $id)
    {
        $user = $request->user();
        
        $withdrawal = Transactions::where('id', $id)
            ->where('user_id', $user->id)
            ->where('type', 'withdrawal')
            ->firstOrFail();
        
        $response = [
            'status' => $withdrawal->status,
            'message' => $this->getStatusMessage($withdrawal),
            'explorer_url' => $withdrawal->explorer_url ?? null,
            'failure_reason' => $withdrawal->failure_reason ?? null,
            'amount' => $withdrawal->amount,
            'currency' => $withdrawal->currency,
            'created_at' => $withdrawal->created_at->toIso8601String(),
            'completed_at' => $withdrawal->completed_at ? $withdrawal->completed_at->toIso8601String() : null,
        ];
        
        return response()->json($response);
    }

    /**
     * Get user-friendly status message for withdrawal
     */
    private function getStatusMessage(Transactions $withdrawal): string
    {
        return match($withdrawal->status) {
            'pending' => 'Your withdrawal is queued and will be processed shortly.',
            'processing' => 'Your withdrawal is being processed on the blockchain.',
            'completed' => 'Withdrawal successful! Your transaction has been confirmed.',
            'failed' => $withdrawal->failure_reason ?? 'Withdrawal failed. Please try again.',
            default => 'Withdrawal status unknown.',
        };
    }
}
