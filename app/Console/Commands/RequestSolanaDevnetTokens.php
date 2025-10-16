<?php

namespace App\Console\Commands;

use App\Services\SolanaService;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class RequestSolanaDevnetTokens extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'solana:request-devnet-tokens {address} {--amount=1}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Request test SOL tokens from Solana devnet faucet';

    /**
     * Execute the console command.
     */
    public function handle(SolanaService $solanaService)
    {
        $address = $this->argument('address');
        $amount = (float) $this->option('amount');

        // Validate it's devnet
        $network = config('services.solana.network', 'devnet');
        if ($network !== 'devnet') {
            $this->error("⚠️  This command only works on devnet. Current network: {$network}");
            $this->info("💡 Set SOLANA_NETWORK=devnet in your .env file");
            return 1;
        }

        // Validate address
        if (!$solanaService->validateAddress($address)) {
            $this->error("❌ Invalid Solana address: {$address}");
            return 1;
        }

        $this->info("🔄 Requesting {$amount} SOL from devnet faucet for address: {$address}");

        try {
            // Request airdrop from Solana devnet faucet
            $lamports = $solanaService->convertToLamports($amount);
            $signature = $this->requestAirdrop($address, $lamports);

            if ($signature) {
                $this->info("✅ Airdrop requested successfully!");
                $this->info("📝 Transaction signature: {$signature}");
                
                $explorerUrl = $solanaService->getTransactionUrl($signature);
                $this->info("🔗 View on Solana Explorer: {$explorerUrl}");

                // Wait for confirmation
                $this->info("⏳ Waiting for confirmation...");
                $status = $solanaService->waitForConfirmation($signature, 30, 2);
                
                if ($status) {
                    $this->info("✅ Transaction confirmed!");
                    
                    // Check new balance
                    $balance = $solanaService->getBalance($address);
                    $solBalance = $solanaService->convertFromLamports($balance);
                    $this->info("💰 New balance: {$solBalance} SOL");
                } else {
                    $this->warn("⚠️  Transaction sent but confirmation timed out. Check explorer.");
                }

                return 0;
            } else {
                $this->error("❌ Failed to request airdrop from faucet");
                return 1;
            }
        } catch (\Throwable $e) {
            $this->error("❌ Error: " . $e->getMessage());
            Log::error('Solana devnet faucet request failed', [
                'address' => $address,
                'amount' => $amount,
                'error' => $e->getMessage(),
            ]);
            
            $this->newLine();
            $this->info("💡 Alternative: Visit https://faucet.solana.com and paste your address");
            
            return 1;
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
}
