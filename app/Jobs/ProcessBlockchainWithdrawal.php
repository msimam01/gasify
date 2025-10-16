<?php

namespace App\Jobs;

use App\Models\Transactions;
use App\Models\WalletBalances;
use App\Models\UserWallets;
use App\Models\Chains;
use App\Services\EthereumService;
use App\Services\SolanaService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;
use Web3\Utils;

class ProcessBlockchainWithdrawal implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    protected $withdrawal;
    protected $user;
    protected $sourceWallet;
    protected $destination;
    protected $amount;
    protected $currency;
    protected $network;
    protected $memo;

    /**
     * Create a new job instance.
     */
    public function __construct($withdrawal, $user, $sourceWallet, $destination, $amount, $currency, $network = 'ethereum', $memo = null)
    {
        $this->withdrawal = $withdrawal;
        $this->user = $user;
        $this->sourceWallet = $sourceWallet;
        $this->destination = $destination;
        $this->amount = $amount;
        $this->currency = $currency;
        $this->network = $network;
        $this->memo = $memo;

        $this->onQueue('withdrawals');
    }

    /**
     * Execute the job.
     */
    public function handle(EthereumService $ethereumService, SolanaService $solanaService)
    {
        try {
            // Get the chain for the wallet
            $chain = Chains::where('symbol', $this->currency)
                ->orWhere('slug', $this->network)
                ->firstOrFail();

            // Get user's wallet for this currency
            $userWallet = UserWallets::where('user_id', $this->user->id)
                ->where('chain_id', $chain->id)
                ->firstOrFail();

            // Get the encrypted private key from wallet meta
            if (empty($userWallet->meta['encrypted_pk'])) {
                throw new \Exception('Wallet private key not found');
            }

            try {
                // Decrypt the private key
                $privateKey = \Illuminate\Support\Facades\Crypt::decryptString($userWallet->meta['encrypted_pk']);
            } catch (\Exception $e) {
                Log::error('Failed to decrypt private key', [
                    'user_id' => $this->user->id,
                    'wallet_id' => $userWallet->id,
                    'error' => $e->getMessage(),
                ]);
                throw new \Exception('Failed to access wallet credentials');
            }

            // Check if user has sufficient balance
            $balance = $this->getWalletBalance($userWallet, $this->currency);
            if ($balance < $this->amount) {
                throw new \Exception('Insufficient balance for withdrawal');
            }

            // Determine if it's Solana or EVM chain
            $isSolana = in_array($this->currency, ['SOL']) || $this->network === 'solana';

            if ($isSolana) {
                // Process Solana transaction
                $txHash = $this->processSolanaWithdrawal($solanaService, $userWallet, $privateKey);
            } else {
                // Process EVM transaction (Ethereum, BSC, etc.)
                $txHash = $this->processEvmWithdrawal($ethereumService, $userWallet, $privateKey);
            }

            // Update withdrawal status
            $this->withdrawal->update([
                'status' => 'completed',
                'tx_hash' => $txHash,
                'completed_at' => now(),
                'meta' => array_merge($this->withdrawal->meta ?? [], [
                    'from_wallet' => $userWallet->address,
                    'to_address' => $this->destination,
                    'network' => $this->network,
                    'blockchain' => $isSolana ? 'solana' : 'evm',
                ]),
            ]);

            // Update user's balance
            $this->updateUserBalance();

            // Log successful withdrawal
            Log::info('Withdrawal processed', [
                'user_id' => $this->user->id,
                'wallet_id' => $userWallet->id,
                'amount' => $this->amount,
                'currency' => $this->currency,
                'destination' => $this->destination,
                'tx_hash' => $txHash,
                'blockchain' => $isSolana ? 'solana' : 'evm',
            ]);

        } catch (\Exception $e) {
            // Update withdrawal status to failed
            $this->withdrawal->update([
                'status' => 'failed',
                'failure_reason' => $e->getMessage(),
            ]);

            // Revert reserved balance
            $this->revertReservedBalance();

            // Log the error
            Log::error('Withdrawal failed: ' . $e->getMessage(), [
                'user_id' => $this->user->id,
                'wallet_id' => $userWallet->id ?? null,
                'amount' => $this->amount,
                'currency' => $this->currency,
                'destination' => $this->destination,
                'trace' => $e->getTraceAsString(),
            ]);

            // Re-throw to allow job to be retried
            throw $e;
        }
    }

    /**
     * Process Solana withdrawal
     */
    /**
 */
protected function processSolanaWithdrawal(SolanaService $solanaService, $userWallet, $privateKey): string
{
    Log::info('Processing Solana withdrawal', [
        'from' => $userWallet->address,
        'to' => $this->destination,
        'amount' => $this->amount,
    ]);

    // Amount provided to this job is in SOL units. Convert to lamports.
    $lamports = (int)round($this->amount * 1000000000);

    // On-chain balance check (amount + estimated fee)
    $onChainLamports = $solanaService->getBalance($userWallet->address);
    $estimatedFeeLamports = $solanaService->estimateFee([]);
    if ($onChainLamports < ($lamports + $estimatedFeeLamports)) {
        $haveSol = $solanaService->convertFromLamports($onChainLamports);
        $needSol = $solanaService->convertFromLamports($lamports + $estimatedFeeLamports);
        throw new \Exception('Insufficient blockchain balance for withdrawal. Have ' . $haveSol . ' SOL, need at least ' . $needSol . ' SOL including fees.');
    }

    // ✅ FIXED: Debug FIRST, BEFORE sendTransaction
    $solanaService->debugTransaction(
        $userWallet->address, 
        $this->destination, 
        $lamports, 
        $privateKey
    );

    // Send transaction
    $signature = $solanaService->sendTransaction([
        'from' => $userWallet->address,
        'to' => $this->destination,
        'amount' => $lamports,
        'private_key' => $privateKey,
        'memo' => $this->memo,
    ]);

    // Wait for confirmation
    try {
        $solanaService->waitForConfirmation($signature, 30, 2);
        Log::info('Solana transaction confirmed', ['signature' => $signature]);
    } catch (\Exception $e) {
        Log::warning('Could not confirm Solana transaction', [
            'signature' => $signature,
            'error' => $e->getMessage(),
        ]);
    }

    return $signature;
}

    /**
     * Process EVM (Ethereum, BSC, etc.) withdrawal
     */
    protected function processEvmWithdrawal(EthereumService $ethereumService, $userWallet, $privateKey): string
    {
        // Convert amount to the smallest unit (wei for ETH, etc.)
        $amountInWei = $this->convertToSmallestUnit($this->amount, $this->currency);

        Log::info('Processing EVM withdrawal', [
            'from' => $userWallet->address,
            'to' => $this->destination,
            'amount' => $this->amount,
            'amount_wei' => $amountInWei,
            'network' => $this->network,
        ]);

        // Process the transaction
        $txHash = $ethereumService->sendTransaction([
            'from' => $userWallet->address,
            'to' => $this->destination,
            'value' => $amountInWei,
            'currency' => $this->currency,
            'network' => $this->network,
            'private_key' => $privateKey,
        ]);

        return $txHash;
    }

    /**
     * Update user's balance after successful withdrawal
     */
    protected function updateUserBalance()
    {
        $balance = WalletBalances::where('user_id', $this->user->id)
            ->where('currency', $this->currency)
            ->first();

        if ($balance) {
            // Deduct from reserved balance
            if (in_array($this->currency, ['ETH', 'USDT', 'USDC', 'BTC', 'SOL'])) {
                // For crypto, use token_balance
                $balance->token_balance = max(0, $balance->token_balance - $this->amount);
            } else {
                // For fiat, use balance_minor
                $amountMinor = $this->amount * 100;
                $balance->reserved_minor = max(0, $balance->reserved_minor - $amountMinor);
            }
            $balance->save();
        }
    }

    /**
     * Revert reserved balance on failure
     */
    protected function revertReservedBalance()
    {
        $balance = WalletBalances::where('user_id', $this->user->id)
            ->where('currency', $this->currency)
            ->first();

        if ($balance) {
            if (in_array($this->currency, ['ETH', 'USDT', 'USDC', 'BTC', 'SOL'])) {
                // For crypto, add back to token_balance
                $balance->token_balance += $this->amount;
            } else {
                // For fiat, move from reserved back to balance
                $amountMinor = $this->amount * 100;
                $balance->balance_minor += $amountMinor;
                $balance->reserved_minor = max(0, $balance->reserved_minor - $amountMinor);
            }
            $balance->save();
        }
    }

    /**
     * Get wallet balance
     */
    protected function getWalletBalance($wallet, $currency)
    {
        // Get the wallet balance from the wallet_balances table
        $balance = WalletBalances::where('user_id', $this->user->id)
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
     * Convert amount to the smallest unit (e.g., wei for ETH, lamports for SOL)
     */
    protected function convertToSmallestUnit($amount, $currency)
    {
        // For SOL, convert to lamports
        if ($currency === 'SOL') {
            return bcmul($amount, '1000000000', 0); // 1 SOL = 1 billion lamports
        }

        // For ETH, convert to wei (1 ETH = 10^18 wei)
        if ($currency === 'ETH') {
            $wei = Utils::toWei((string)$amount, 'ether');
            // Convert BigInteger to string to avoid issues with the EthereumService
            if (is_object($wei) && method_exists($wei, 'toString')) {
                return $wei->toString();
            }
            return (string)$wei;
        }

        // For tokens, we assume they use 18 decimals by default
        // Adjust if your tokens use different decimals
        $amountInWei = bcmul($amount, bcpow('10', '18', 0), 0);
        return (string)$amountInWei;
    }

    /**
     * Handle a job failure.
     */
    public function failed(\Throwable $exception)
    {
        // Revert reserved balance
        $this->revertReservedBalance();

        // Update withdrawal status
        $this->withdrawal->update([
            'status' => 'failed',
            'failure_reason' => $exception->getMessage(),
        ]);

        Log::error('Withdrawal job failed permanently', [
            'user_id' => $this->user->id,
            'withdrawal_id' => $this->withdrawal->id,
            'error' => $exception->getMessage(),
        ]);
    }
}
