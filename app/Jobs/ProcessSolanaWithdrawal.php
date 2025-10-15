<?php

namespace App\Jobs;

use App\Models\Transactions;
use App\Models\WalletBalances;
use App\Models\UserWallets;
use App\Services\SolanaService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\DB;

class ProcessSolanaWithdrawal implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    protected $withdrawal;
    protected $user;
    protected $wallet;
    protected $destination;
    protected $amount;
    protected $tokenMint;

    /**
     * Create a new job instance.
     */
    public function __construct($withdrawal, $user, $wallet, $destination, $amount, $tokenMint = null)
    {
        $this->withdrawal = $withdrawal;
        $this->user = $user;
        $this->wallet = $wallet;
        $this->destination = $destination;
        $this->amount = $amount;
        $this->tokenMint = $tokenMint;

        $this->onQueue('withdrawals');
    }

    /**
     * Execute the job.
     */
    public function handle(SolanaService $solanaService)
    {
        DB::beginTransaction();

        try {
            // Get real-time balance from blockchain
            $currentBalance = $solanaService->getBalance($this->wallet->address);

            if ($currentBalance < $this->amount) {
                throw new \Exception('Insufficient blockchain balance for withdrawal');
            }

            // Preemptively deduct from DB balance
            $this->deductBalance();

            // Process the withdrawal
            $txHash = $this->processWithdrawal($solanaService);

            // Wait for confirmation
            $solanaService->waitForConfirmation($txHash, 30, 2);

            // Update withdrawal status
            $this->withdrawal->update([
                'status' => 'completed',
                'tx_hash' => $txHash,
                'completed_at' => now(),
                'meta' => array_merge($this->withdrawal->meta ?? [], [
                    'from_wallet' => $this->wallet->address,
                    'to_address' => $this->destination,
                    'blockchain' => 'solana',
                    'token_mint' => $this->tokenMint,
                    'explorer_url' => $solanaService->getTransactionUrl($txHash),
                ]),
            ]);

            DB::commit();

            Log::info('Solana withdrawal completed successfully', [
                'user_id' => $this->user->id,
                'wallet_id' => $this->wallet->id,
                'amount' => $this->amount,
                'destination' => $this->destination,
                'tx_hash' => $txHash,
                'token_mint' => $this->tokenMint,
            ]);

        } catch (\Exception $e) {
            DB::rollBack();

            // Rollback balance deduction
            $this->rollbackBalance();

            // Update withdrawal status
            $this->withdrawal->update([
                'status' => 'failed',
                'failure_reason' => $e->getMessage(),
            ]);

            Log::error('Solana withdrawal failed', [
                'user_id' => $this->user->id,
                'wallet_id' => $this->wallet->id,
                'amount' => $this->amount,
                'destination' => $this->destination,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            throw $e;
        }
    }

    /**
     * Process the actual withdrawal transaction
     */
    protected function processWithdrawal(SolanaService $solanaService): string
    {
        $keypair = $solanaService->getKeypairFromWallet($this->wallet);

        if ($this->tokenMint) {
            // SPL Token withdrawal
            return $solanaService->sendSPLTransaction([
                'from' => $this->wallet->address,
                'to' => $this->destination,
                'amount' => $this->amount,
                'token_mint' => $this->tokenMint,
                'private_key' => $solanaService->base58Encode($keypair['private_key_bytes']),
            ]);
        } else {
            // SOL withdrawal
            return $solanaService->sendTransaction([
                'from' => $this->wallet->address,
                'to' => $this->destination,
                'amount' => $this->amount,
                'private_key' => $solanaService->base58Encode($keypair['private_key_bytes']),
            ]);
        }
    }

    /**
     * Deduct balance from database preemptively
     */
    protected function deductBalance()
    {
        $balance = WalletBalances::where('user_id', $this->user->id)
            ->where('currency', $this->tokenMint ? 'SOL' : 'SOL') // Assuming SOL is the base currency
            ->firstOrFail();

        if ($this->tokenMint) {
            // For tokens, deduct from token_balance
            if ($balance->token_balance < $this->amount) {
                throw new \Exception('Insufficient token balance');
            }
            $balance->token_balance -= $this->amount;
        } else {
            // For SOL, deduct from token_balance (assuming SOL is stored as token_balance)
            if ($balance->token_balance < $this->amount) {
                throw new \Exception('Insufficient SOL balance');
            }
            $balance->token_balance -= $this->amount;
        }

        $balance->save();
    }

    /**
     * Rollback balance deduction on failure
     */
    protected function rollbackBalance()
    {
        $balance = WalletBalances::where('user_id', $this->user->id)
            ->where('currency', $this->tokenMint ? 'SOL' : 'SOL')
            ->first();

        if ($balance) {
            if ($this->tokenMint) {
                $balance->token_balance += $this->amount;
            } else {
                $balance->token_balance += $this->amount;
            }
            $balance->save();
        }
    }

    /**
     * Handle a job failure.
     */
    public function failed(\Throwable $exception)
    {
        // Rollback balance
        $this->rollbackBalance();

        // Update withdrawal status
        $this->withdrawal->update([
            'status' => 'failed',
            'failure_reason' => $exception->getMessage(),
        ]);

        Log::error('Solana withdrawal job failed permanently', [
            'user_id' => $this->user->id,
            'withdrawal_id' => $this->withdrawal->id,
            'error' => $exception->getMessage(),
        ]);
    }
}