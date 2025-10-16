<?php

namespace App\Jobs;

use App\Models\Transactions;
use App\Models\WalletBalances;
use App\Models\UserWallets;
use App\Models\Chains;
use App\Services\EthereumService;
use App\Services\SolanaService;
use App\Events\WithdrawalStatusUpdated;
use App\Notifications\WithdrawalCompleted;
use App\Notifications\WithdrawalFailed;
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

            // Build explorer URL
            $explorerUrl = $this->getExplorerUrl($txHash, $isSolana);
            
            // Update withdrawal status to completed
            $this->withdrawal->update([
                'status' => 'completed',
                'tx_hash' => $txHash,
                'explorer_url' => $explorerUrl,
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

            // Broadcast event for real-time updates
            event(new WithdrawalStatusUpdated(
                $this->withdrawal,
                'completed',
                'Withdrawal successful! View on Explorer',
                $explorerUrl
            ));

            // Send notification to user
            $this->user->notify(new WithdrawalCompleted($this->withdrawal, $explorerUrl));

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
            // Map to human-readable error message
            $humanReadableError = $this->getHumanReadableError($e);
            
            // Update withdrawal status to failed
            $this->withdrawal->update([
                'status' => 'failed',
                'failure_reason' => $humanReadableError,
            ]);

            // Revert reserved balance
            $this->revertReservedBalance();

            // Broadcast event for real-time updates
            event(new WithdrawalStatusUpdated(
                $this->withdrawal,
                'failed',
                'Withdrawal failed',
                null,
                $humanReadableError
            ));

            // Send notification to user
            $this->user->notify(new WithdrawalFailed($this->withdrawal, $humanReadableError));

            // Log the error with full details
            Log::error('Withdrawal failed: ' . $e->getMessage(), [
                'user_id' => $this->user->id,
                'wallet_id' => $userWallet->id ?? null,
                'amount' => $this->amount,
                'currency' => $this->currency,
                'destination' => $this->destination,
                'human_readable_error' => $humanReadableError,
                'raw_error' => $e->getMessage(),
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
            ->where('currency', $this->currency)->first();
        if ($balance && in_array($this->currency, ['ETH','USDT','USDC','BTC','SOL'])) {
            $balance->reserved_token = max(0, $balance->reserved_token - $this->amount);
            $balance->save();
        }
    }

    /**
     * Revert reserved balance on failure
     */
    protected function revertReservedBalance()
    {
        $balance = WalletBalances::where('user_id', $this->user->id)
            ->where('currency', $this->currency)->first();
        if ($balance && in_array($this->currency, ['ETH','USDT','USDC','BTC','SOL'])) {
            $balance->reserved_token = max(0, $balance->reserved_token - $this->amount);
            $balance->token_balance += $this->amount;
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

        // Map to human-readable error
        $humanReadableError = $this->getHumanReadableError($exception);

        // Update withdrawal status
        $this->withdrawal->update([
            'status' => 'failed',
            'failure_reason' => $humanReadableError,
        ]);

        // Broadcast event for real-time updates
        event(new WithdrawalStatusUpdated(
            $this->withdrawal,
            'failed',
            'Withdrawal failed',
            null,
            $humanReadableError
        ));

        // Send notification to user
        $this->user->notify(new WithdrawalFailed($this->withdrawal, $humanReadableError));

        Log::error('Withdrawal job failed permanently', [
            'user_id' => $this->user->id,
            'withdrawal_id' => $this->withdrawal->id,
            'human_readable_error' => $humanReadableError,
            'raw_error' => $exception->getMessage(),
            'trace' => $exception->getTraceAsString(),
        ]);
    }

    /**
     * Get explorer URL for transaction
     */
    protected function getExplorerUrl(string $txHash, bool $isSolana): string
    {
        if ($isSolana) {
            $network = config('services.solana.network', 'devnet');
            $cluster = $network === 'mainnet-beta' ? '' : "?cluster={$network}";
            return "https://explorer.solana.com/tx/{$txHash}{$cluster}";
        }
        
        // For EVM chains, determine network
        $network = $this->network ?? 'ethereum';
        
        return match($network) {
            'ethereum' => "https://etherscan.io/tx/{$txHash}",
            'binance' => "https://bscscan.com/tx/{$txHash}",
            'arbitrum' => "https://arbiscan.io/tx/{$txHash}",
            'optimism' => "https://optimistic.etherscan.io/tx/{$txHash}",
            default => "https://etherscan.io/tx/{$txHash}",
        };
    }

    /**
     * Map exception to human-readable error message
     */
    protected function getHumanReadableError(\Throwable $exception): string
    {
        $message = $exception->getMessage();
        
        // Solana-specific error mapping
        if (stripos($message, 'insufficient') !== false && stripos($message, 'funds') !== false) {
            return 'Insufficient funds on the blockchain. Please ensure your wallet has enough balance to cover the transaction and network fees.';
        }
        
        if (stripos($message, 'InsufficientFundsForFee') !== false) {
            return 'Not enough SOL to pay for transaction fees. Please add more SOL to your wallet.';
        }
        
        if (stripos($message, 'invalid') !== false && stripos($message, 'address') !== false) {
            return 'Invalid destination address. Please check the address and try again.';
        }
        
        if (stripos($message, 'blockhash') !== false && stripos($message, 'not found') !== false) {
            return 'Transaction expired. Please try again.';
        }
        
        if (stripos($message, 'timeout') !== false || stripos($message, 'timed out') !== false) {
            return 'Transaction confirmation timed out. The transaction may still be processing on the blockchain.';
        }
        
        if (stripos($message, 'RPC') !== false || stripos($message, 'network') !== false) {
            return 'Network connection error. Please try again in a few moments.';
        }
        
        // EVM-specific error mapping
        if (stripos($message, 'gas') !== false) {
            return 'Insufficient gas for transaction. Please try again with a higher gas limit.';
        }
        
        if (stripos($message, 'nonce') !== false) {
            return 'Transaction nonce error. Please try again.';
        }
        
        // Generic errors
        if (stripos($message, 'private key') !== false) {
            return 'Wallet configuration error. Please contact support.';
        }
        
        // Default: return a sanitized version of the original message
        // Remove any sensitive information
        $sanitized = preg_replace('/0x[a-fA-F0-9]{64}/', '[REDACTED]', $message);
        $sanitized = preg_replace('/[A-Za-z0-9+\/]{40,}/', '[REDACTED]', $sanitized);
        
        return strlen($sanitized) > 200 
            ? substr($sanitized, 0, 200) . '...' 
            : $sanitized;
    }
}
