<?php

namespace App\Services;

use App\Models\Chains;
use App\Models\User;
use App\Models\UserWallets;
use App\Models\WalletBalances;
use Illuminate\Support\Facades\Crypt;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use kornrunner\Keccak;
use Elliptic\EC;

class WalletService
{
    /**
     * Initialize fiat + blockchain wallets for a new user
     */
    public function initializeUserWallets(User $user): void
    {
        // 1. Fiat NGN wallet
        WalletBalances::firstOrCreate([
            'user_id' => $user->id,
            'currency' => 'NGN',
        ], [
            'balance_minor' => 0,
            'reserved_minor' => 0,
        ]);

        // 2. Blockchain wallets
        $chains = Chains::all();

        foreach ($chains as $chain) {
            [$address, $privateKey] = $this->generateWalletForChain($chain->slug);

            UserWallets::firstOrCreate([
                'user_id' => $user->id,
                'chain_id' => $chain->id,
                'address' => $address,
            ], [
                'is_primary' => true,
                'meta' => [
                    'encrypted_pk' => Crypt::encryptString($privateKey),
                ],
            ]);
        }
    }

    /**
     * Generate a real wallet for the given chain
     */
    private function generateWalletForChain(string $slug): array
    {
        return match ($slug) {
            'ethereum', 'sidra' => $this->generateEthereumWallet(),
            'pi' => $this->generatePiWallet(), // custom for Pi (not EVM)
            'solana' => $this->generateSolanaWallet(),
            default => [bin2hex(random_bytes(20)), bin2hex(random_bytes(32))],
        };
    }

    /**
     * Generate Ethereum/EVM wallet
     */
    private function generateEthereumWallet(): array
    {
        $ec = new EC('secp256k1');
        $key = $ec->genKeyPair();
        $privateKey = $key->getPrivate()->toString(16);
        $publicKey = $key->getPublic(false, 'hex');

        // Keccak hash of public key (skip "0x04" prefix)
        $hash = Keccak::hash(substr(hex2bin($publicKey), 1), 256);

        // Take last 20 bytes
        $address = "0x" . substr($hash, -40);

        return [$address, $privateKey];
    }

    /**
     * Generate Solana wallet with proper Ed25519 keypair
     */
    private function generateSolanaWallet(): array
    {
        // Generate proper Ed25519 keypair using libsodium
        $keypair = sodium_crypto_sign_keypair();
        $secretKey = sodium_crypto_sign_secretkey($keypair);
        $publicKey = sodium_crypto_sign_publickey($keypair);

        // Use proper Base58 encoding that preserves leading zeros
        $address = $this->base58Encode($publicKey);
        $privateKey = base64_encode($secretKey);

        return [$address, $privateKey];
    }

    /**
     * Generate Pi wallet (placeholder since Pi is NOT EVM)
     * NOTE: This will just behave like Ethereum keypair for now
     * until Pi Network provides proper dev tools.
     */
    private function generatePiWallet(): array
    {
        $ec = new EC('secp256k1');
        $key = $ec->genKeyPair();
        $privateKey = $key->getPrivate()->toString(16);
        $publicKey = $key->getPublic(false, 'hex');

        $hash = Keccak::hash(substr(hex2bin($publicKey), 1), 256);
        $address = "Pi_" . substr($hash, -40); // prefix with "Pi_" so we know it's not EVM

        return [$address, $privateKey];
    }

    /**
     * Get balance of an EVM-compatible chain (Ethereum, Sidra, BSC, Polygon, etc.)
     */
    public function getEvmBalance(string $address, string $rpcUrl): float
    {
        $response = Http::post($rpcUrl, [
            "jsonrpc" => "2.0",
            "id" => 1,
            "method" => "eth_getBalance",
            "params" => [$address, "latest"],
        ]);

        $result = $response->json('result');

        // Convert hex -> decimal (wei) -> ether
        $balanceWei = $result ? hexdec($result) : 0;
        return $balanceWei / 1e18;
    }

    /**
     * Get Solana balance (in SOL)
     */
    public function getSolanaBalance(string $address): float
    {
        $rpcUrl = config('services.solana.rpc', 'https://api.devnet.solana.com');

        try {
            $response = Http::timeout(20)->post($rpcUrl, [
                "jsonrpc" => "2.0",
                "id" => 1,
                "method" => "getBalance",
                "params" => [$address],
            ]);

            if (!$response->ok()) {
                Log::error("Solana RPC failed", ['address' => $address, 'error' => "HTTP {$response->status()}" ]);
                return 0.0;
            }

            $json = $response->json();
            $value = $json['result']['value'] ?? null;

            if ($value === null) {
                Log::warning("Solana account not found on-chain", ['address' => $address]);
                return 0.0;
            }

            $lamports = (int)$value;
            return $lamports / 1e9; // 1 SOL = 1e9 lamports
        } catch (\Throwable $e) {
            Log::error("Solana RPC failed", ['address' => $address, 'error' => $e->getMessage()]);
            return 0.0;
        }
    }

    /**
     * Base58 encoding (for Solana addresses) - matches Solana standard (bs58)
     */
    private function base58Encode(string $data): string
    {
        $alphabet = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
        $num = gmp_init(bin2hex($data), 16);
        $encoded = '';

        while (gmp_cmp($num, 0) > 0) {
            [$num, $rem] = gmp_div_qr($num, 58);
            $encoded = $alphabet[gmp_intval($rem)] . $encoded;
        }

        // Preserve leading zeros - critical for Solana address validity
        foreach (str_split($data) as $c) {
            if ($c === "\x00") {
                $encoded = '1' . $encoded;
            } else {
                break;
            }
        }

        return $encoded === '' ? '1' : $encoded;
    }
}
