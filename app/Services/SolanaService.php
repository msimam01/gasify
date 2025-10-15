<?php

namespace App\Services;

use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Http;
use Exception;

class SolanaService
{
    protected string $rpcUrl;
    protected string $network;
    
    // Solana constants
    const LAMPORTS_PER_SOL = 1000000000; // 1 SOL = 1 billion lamports
    const COMMITMENT_FINALIZED = 'finalized';
    const COMMITMENT_CONFIRMED = 'confirmed';

    public function __construct()
    {
        $this->rpcUrl = env('SOLANA_RPC', 'https://api.devnet.solana.com');
        $this->network = str_contains($this->rpcUrl, 'mainnet') ? 'mainnet' : 'devnet';
    }

    /**
     * Set the RPC URL dynamically
     */
    public function setRpcUrl(string $url): self
    {
        $this->rpcUrl = $url;
        $this->network = str_contains($url, 'mainnet') ? 'mainnet' : 'devnet';
        return $this;
    }

    /**
     * Make RPC call to Solana node
     */
    protected function rpcCall(string $method, array $params = []): array
    {
        try {
            $response = Http::timeout(30)->post($this->rpcUrl, [
                'jsonrpc' => '2.0',
                'id' => 1,
                'method' => $method,
                'params' => $params,
            ]);

            if (!$response->successful()) {
                throw new Exception("RPC call failed: " . $response->body());
            }

            $data = $response->json();

            if (isset($data['error'])) {
                throw new Exception("Solana RPC error: " . json_encode($data['error']));
            }

            return $data;
        } catch (Exception $e) {
            Log::error('Solana RPC call failed', [
                'method' => $method,
                'params' => $params,
                'error' => $e->getMessage(),
            ]);
            throw $e;
        }
    }

    /**
     * Get balance in SOL for an address
     */
    public function getBalance(string $address): float
    {
        $result = $this->rpcCall('getBalance', [
            $address,
            ['commitment' => self::COMMITMENT_FINALIZED]
        ]);

        $lamports = $result['result']['value'] ?? 0;
        return $this->lamportsToSol($lamports);
    }

    /**
     * Get balance in lamports for an address
     */
    public function getBalanceInLamports(string $address): int
    {
        $result = $this->rpcCall('getBalance', [
            $address,
            ['commitment' => self::COMMITMENT_FINALIZED]
        ]);

        return $result['result']['value'] ?? 0;
    }

    /**
     * Send SOL transaction
     * 
     * @param array $params ['from' => address, 'to' => address, 'amount' => float, 'private_key' => base58]
     * @return string Transaction signature
     */
    public function sendTransaction(array $params): string
    {
        foreach (['from', 'to', 'amount', 'private_key'] as $field) {
            if (!isset($params[$field])) {
                throw new Exception("Missing required parameter: {$field}");
            }
        }

        $fromAddress = $params['from'];
        $toAddress = $params['to'];
        $amount = $params['amount'];
        $privateKey = $params['private_key'];

        // Validate addresses
        $this->validateAddress($fromAddress);
        $this->validateAddress($toAddress);

        // Convert SOL to lamports
        $lamports = $this->solToLamports($amount);

        Log::info('Initiating Solana transaction', [
            'network' => $this->network,
            'from' => $fromAddress,
            'to' => $toAddress,
            'amount_sol' => $amount,
            'amount_lamports' => $lamports,
        ]);

        try {
            // Get recent blockhash
            $recentBlockhash = $this->getRecentBlockhash();

            // Create transaction
            $transaction = $this->createTransaction([
                'from' => $fromAddress,
                'to' => $toAddress,
                'lamports' => $lamports,
                'recentBlockhash' => $recentBlockhash,
            ]);

            // Sign transaction
            $signedTransaction = $this->signTransaction($transaction, $privateKey);

            // Send transaction
            $signature = $this->sendRawTransaction($signedTransaction);

            Log::info('Solana transaction sent successfully', [
                'signature' => $signature,
                'from' => $fromAddress,
                'to' => $toAddress,
                'amount_sol' => $amount,
                'explorer_url' => $this->getTransactionUrl($signature),
            ]);

            return $signature;

        } catch (Exception $e) {
            Log::error('Solana transaction failed', [
                'error' => $e->getMessage(),
                'from' => $fromAddress,
                'to' => $toAddress,
                'amount' => $amount,
                'trace' => $e->getTraceAsString(),
            ]);
            throw $e;
        }
    }

    /**
     * Get recent blockhash
     */
    protected function getRecentBlockhash(): string
    {
        $result = $this->rpcCall('getLatestBlockhash', [
            ['commitment' => self::COMMITMENT_FINALIZED]
        ]);

        return $result['result']['value']['blockhash'] ?? throw new Exception('Failed to get recent blockhash');
    }

    /**
     * Create a transfer transaction
     */
    protected function createTransaction(array $params): array
    {
        $from = $params['from'];
        $to = $params['to'];
        $lamports = $params['lamports'];
        $recentBlockhash = $params['recentBlockhash'];

        // Create transfer instruction
        $instruction = [
            'programId' => '11111111111111111111111111111111', // System Program
            'keys' => [
                ['pubkey' => $from, 'isSigner' => true, 'isWritable' => true],
                ['pubkey' => $to, 'isSigner' => false, 'isWritable' => true],
            ],
            'data' => $this->encodeTransferInstruction($lamports),
        ];

        return [
            'recentBlockhash' => $recentBlockhash,
            'feePayer' => $from,
            'instructions' => [$instruction],
        ];
    }

    /**
     * Encode transfer instruction data
     */
    protected function encodeTransferInstruction(int $lamports): string
    {
        // Transfer instruction: [2, 0, 0, 0] followed by lamports as 64-bit little-endian
        $data = pack('V', 2); // Instruction index for transfer
        $data .= pack('P', $lamports); // 64-bit lamports amount
        return base64_encode($data);
    }

    /**
     * Sign transaction with private key
     */
    protected function signTransaction(array $transaction, string $privateKeyBase58): string
    {
        // Decode private key from base58
        $privateKeyBytes = $this->base58Decode($privateKeyBase58);
        
        if (strlen($privateKeyBytes) !== 64) {
            throw new Exception('Invalid private key length. Expected 64 bytes.');
        }

        // Serialize transaction for signing
        $messageBytes = $this->serializeTransaction($transaction);

        // Sign the message using Ed25519
        $signature = $this->ed25519Sign($messageBytes, $privateKeyBytes);

        // Encode signed transaction
        return $this->encodeSignedTransaction($transaction, $signature, $privateKeyBytes);
    }

    /**
     * Serialize transaction to bytes for signing
     */
    protected function serializeTransaction(array $transaction): string
    {
        // This is a simplified version - production should use proper Solana serialization
        $message = json_encode([
            'recentBlockhash' => $transaction['recentBlockhash'],
            'feePayer' => $transaction['feePayer'],
            'instructions' => $transaction['instructions'],
        ]);

        return hash('sha256', $message, true);
    }

    /**
     * Sign message with Ed25519
     */
    protected function ed25519Sign(string $message, string $privateKey): string
    {
        // Use sodium for Ed25519 signing
        if (!function_exists('sodium_crypto_sign_detached')) {
            throw new Exception('Sodium extension required for Ed25519 signing');
        }

        // Extract seed (first 32 bytes) from private key
        $seed = substr($privateKey, 0, 32);
        
        // Generate keypair from seed
        $keypair = sodium_crypto_sign_seed_keypair($seed);
        
        // Sign the message
        $signature = sodium_crypto_sign_detached($message, $keypair);

        return $signature;
    }

    /**
     * Encode signed transaction for submission
     */
    protected function encodeSignedTransaction(array $transaction, string $signature, string $privateKey): string
    {
        // Get public key from private key (last 32 bytes)
        $publicKey = substr($privateKey, 32, 32);

        // Create signed transaction structure
        $signedTx = [
            'signatures' => [base64_encode($signature)],
            'message' => [
                'header' => [
                    'numRequiredSignatures' => 1,
                    'numReadonlySignedAccounts' => 0,
                    'numReadonlyUnsignedAccounts' => 1,
                ],
                'accountKeys' => [
                    base64_encode($this->base58Decode($transaction['feePayer'])),
                    base64_encode($this->base58Decode($transaction['instructions'][0]['keys'][1]['pubkey'])),
                    base64_encode($this->base58Decode($transaction['instructions'][0]['programId'])),
                ],
                'recentBlockhash' => $transaction['recentBlockhash'],
                'instructions' => [
                    [
                        'programIdIndex' => 2,
                        'accounts' => [0, 1],
                        'data' => $transaction['instructions'][0]['data'],
                    ],
                ],
            ],
        ];

        return base64_encode(json_encode($signedTx));
    }

    /**
     * Send raw signed transaction
     */
    protected function sendRawTransaction(string $signedTransaction): string
    {
        $result = $this->rpcCall('sendTransaction', [
            $signedTransaction,
            ['encoding' => 'base64']
        ]);

        return $result['result'] ?? throw new Exception('Failed to send transaction');
    }

    /**
     * Wait for transaction confirmation
     */
    public function waitForConfirmation(string $signature, int $maxAttempts = 30, int $delaySeconds = 2): array
    {
        for ($i = 0; $i < $maxAttempts; $i++) {
            try {
                $status = $this->getTransactionStatus($signature);
                
                if (isset($status['result']['value']) && $status['result']['value'] !== null) {
                    return $status['result']['value'];
                }
            } catch (Exception $e) {
                Log::debug("Waiting for confirmation attempt {$i}/{$maxAttempts}", [
                    'signature' => $signature,
                ]);
            }

            sleep($delaySeconds);
        }

        throw new Exception("Transaction confirmation timeout for signature: {$signature}");
    }

    /**
     * Get transaction status
     */
    public function getTransactionStatus(string $signature): array
    {
        return $this->rpcCall('getSignatureStatuses', [
            [$signature],
            ['searchTransactionHistory' => true]
        ]);
    }

    /**
     * Get transaction details
     */
    public function getTransaction(string $signature): array
    {
        return $this->rpcCall('getTransaction', [
            $signature,
            ['encoding' => 'json', 'commitment' => self::COMMITMENT_FINALIZED]
        ]);
    }

    /**
     * Get transaction URL (explorer link)
     */
    public function getTransactionUrl(string $signature): string
    {
        $baseUrl = $this->network === 'mainnet' 
            ? 'https://explorer.solana.com/tx/'
            : 'https://explorer.solana.com/tx/?cluster=devnet&';
        
        return $baseUrl . $signature;
    }

    /**
     * Validate Solana address
     */
    protected function validateAddress(string $address): bool
    {
        // Solana addresses are base58 encoded and typically 32-44 characters
        if (strlen($address) < 32 || strlen($address) > 44) {
            throw new Exception("Invalid Solana address length: {$address}");
        }

        // Check if it's valid base58
        try {
            $decoded = $this->base58Decode($address);
            if (strlen($decoded) !== 32) {
                throw new Exception("Invalid Solana address: {$address}");
            }
        } catch (Exception $e) {
            throw new Exception("Invalid Solana address format: {$address}");
        }

        return true;
    }

    /**
     * Convert SOL to lamports
     */
    public function solToLamports(float $sol): int
    {
        return (int) bcmul((string) $sol, (string) self::LAMPORTS_PER_SOL, 0);
    }

    /**
     * Convert lamports to SOL
     */
    public function lamportsToSol(int $lamports): float
    {
        return (float) bcdiv((string) $lamports, (string) self::LAMPORTS_PER_SOL, 9);
    }

    /**
     * Base58 decode
     */
    protected function base58Decode(string $string): string
    {
        $alphabet = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
        $base = strlen($alphabet);
        
        $decoded = gmp_init(0);
        $multi = gmp_init(1);
        
        for ($i = strlen($string) - 1; $i >= 0; $i--) {
            $char = $string[$i];
            $pos = strpos($alphabet, $char);
            
            if ($pos === false) {
                throw new Exception("Invalid base58 character: {$char}");
            }
            
            $decoded = gmp_add($decoded, gmp_mul($multi, $pos));
            $multi = gmp_mul($multi, $base);
        }
        
        $hex = gmp_strval($decoded, 16);
        if (strlen($hex) % 2 !== 0) {
            $hex = '0' . $hex;
        }
        
        return hex2bin($hex);
    }

    /**
     * Base58 encode
     */
    protected function base58Encode(string $data): string
    {
        $alphabet = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
        $base = strlen($alphabet);
        
        $num = gmp_init(bin2hex($data), 16);
        $encoded = '';
        
        while (gmp_cmp($num, 0) > 0) {
            list($num, $remainder) = gmp_div_qr($num, $base);
            $encoded = $alphabet[gmp_intval($remainder)] . $encoded;
        }
        
        // Add leading zeros
        for ($i = 0; $i < strlen($data) && $data[$i] === "\0"; $i++) {
            $encoded = $alphabet[0] . $encoded;
        }
        
        return $encoded;
    }

    /**
     * Generate a new Solana keypair
     */
    public function generateKeypair(): array
    {
        $keypair = sodium_crypto_sign_keypair();
        $publicKey = sodium_crypto_sign_publickey($keypair);
        $privateKey = sodium_crypto_sign_secretkey($keypair);

        return [
            'public_key' => $this->base58Encode($publicKey),
            'private_key' => $this->base58Encode($privateKey),
            'address' => $this->base58Encode($publicKey),
        ];
    }

    /**
     * Get Keypair from wallet model
     */
    public function getKeypairFromWallet($wallet): array
    {
        $decryptedPrivateKey = \Illuminate\Support\Facades\Crypt::decryptString($wallet->private_key);
        $privateKeyBytes = base64_decode($decryptedPrivateKey);

        if (strlen($privateKeyBytes) !== 64) {
            throw new Exception('Invalid private key length');
        }

        $publicKeyBytes = substr($privateKeyBytes, 32, 32);
        $publicKey = $this->base58Encode($publicKeyBytes);

        return [
            'public_key' => $publicKey,
            'private_key_bytes' => $privateKeyBytes,
            'public_key_bytes' => $publicKeyBytes,
        ];
    }

    /**
     * Get Associated Token Address (ATA) for a token
     */
    public function getAssociatedTokenAddress(string $owner, string $mint): string
    {
        // Associated Token Program ID
        $associatedTokenProgramId = 'ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL';

        // Derive PDA for ATA
        $seeds = [
            $this->base58Decode($owner),
            $this->base58Decode('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA'), // Token Program ID
            $this->base58Decode($mint),
        ];

        $pda = $this->findProgramAddress($seeds, $associatedTokenProgramId);
        return $this->base58Encode($pda);
    }

    /**
     * Get token decimals
     */
    public function getTokenDecimals(string $mint): int
    {
        $result = $this->rpcCall('getAccountInfo', [
            $mint,
            [
                'encoding' => 'jsonParsed',
                'commitment' => self::COMMITMENT_FINALIZED
            ]
        ]);

        if (!isset($result['result']['value']['data']['parsed']['info']['decimals'])) {
            throw new Exception('Failed to get token decimals');
        }

        return $result['result']['value']['data']['parsed']['info']['decimals'];
    }

    /**
     * Find Program Derived Address (PDA)
     */
    protected function findProgramAddress(array $seeds, string $programId): string
    {
        $programIdBytes = $this->base58Decode($programId);
        $nonce = 0;

        while ($nonce < 256) {
            $nonceBytes = pack('C', $nonce);
            $hashInput = '';

            foreach ($seeds as $seed) {
                $hashInput .= $seed;
            }
            $hashInput .= $programIdBytes . $nonceBytes;

            $hash = hash('sha256', $hashInput, true);

            // Check if hash is valid public key (first bit is 0)
            if (ord($hash[31]) < 128) {
                return $hash;
            }

            $nonce++;
        }

        throw new Exception('Unable to find a valid program derived address');
    }

    /**
     * Send SPL token transaction
     */
    public function sendSPLTransaction(array $params): string
    {
        foreach (['from', 'to', 'amount', 'token_mint', 'private_key'] as $field) {
            if (!isset($params[$field])) {
                throw new Exception("Missing required parameter: {$field}");
            }
        }

        $fromAddress = $params['from'];
        $toAddress = $params['to'];
        $amount = $params['amount'];
        $tokenMint = $params['token_mint'];
        $privateKey = $params['private_key'];

        $this->validateAddress($fromAddress);
        $this->validateAddress($toAddress);
        $this->validateAddress($tokenMint);

        $decimals = $this->getTokenDecimals($tokenMint);
        $amountInSmallestUnit = bcmul((string)$amount, bcpow('10', (string)$decimals, 0), 0);

        $fromATA = $this->getAssociatedTokenAddress($fromAddress, $tokenMint);
        $toATA = $this->getAssociatedTokenAddress($toAddress, $tokenMint);

        Log::info('Initiating SPL token transaction', [
            'network' => $this->network,
            'from' => $fromAddress,
            'to' => $toAddress,
            'token_mint' => $tokenMint,
            'amount' => $amount,
            'decimals' => $decimals,
            'amount_smallest' => $amountInSmallestUnit,
            'from_ata' => $fromATA,
            'to_ata' => $toATA,
        ]);

        try {
            $recentBlockhash = $this->getRecentBlockhash();

            $instructions = [];

            // Check if destination ATA exists
            if (!$this->accountExists($toATA)) {
                // Add instruction to create ATA
                $instructions[] = $this->createAssociatedTokenAccountInstruction($fromAddress, $toAddress, $tokenMint);
            }

            // Add transfer instruction
            $instructions[] = $this->createTokenTransferInstruction($fromATA, $toATA, $fromAddress, $amountInSmallestUnit);

            $transaction = [
                'recentBlockhash' => $recentBlockhash,
                'feePayer' => $fromAddress,
                'instructions' => $instructions,
            ];

            $signedTransaction = $this->signTransaction($transaction, $privateKey);
            $signature = $this->sendRawTransaction($signedTransaction);

            Log::info('SPL token transaction sent successfully', [
                'signature' => $signature,
                'from' => $fromAddress,
                'to' => $toAddress,
                'token_mint' => $tokenMint,
                'amount' => $amount,
                'explorer_url' => $this->getTransactionUrl($signature),
            ]);

            return $signature;

        } catch (Exception $e) {
            Log::error('SPL token transaction failed', [
                'error' => $e->getMessage(),
                'from' => $fromAddress,
                'to' => $toAddress,
                'token_mint' => $tokenMint,
                'amount' => $amount,
                'trace' => $e->getTraceAsString(),
            ]);
            throw $e;
        }
    }

    /**
     * Check if account exists
     */
    protected function accountExists(string $address): bool
    {
        try {
            $result = $this->rpcCall('getAccountInfo', [
                $address,
                ['commitment' => self::COMMITMENT_FINALIZED]
            ]);

            return isset($result['result']['value']) && $result['result']['value'] !== null;
        } catch (Exception $e) {
            return false;
        }
    }

    /**
     * Create Associated Token Account instruction
     */
    protected function createAssociatedTokenAccountInstruction(string $payer, string $owner, string $mint): array
    {
        $ata = $this->getAssociatedTokenAddress($owner, $mint);

        return [
            'programId' => 'ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL',
            'keys' => [
                ['pubkey' => $payer, 'isSigner' => true, 'isWritable' => true],
                ['pubkey' => $ata, 'isSigner' => false, 'isWritable' => true],
                ['pubkey' => $owner, 'isSigner' => false, 'isWritable' => false],
                ['pubkey' => $mint, 'isSigner' => false, 'isWritable' => false],
                ['pubkey' => '11111111111111111111111111111112', 'isSigner' => false, 'isWritable' => false], // System Program
                ['pubkey' => 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA', 'isSigner' => false, 'isWritable' => false], // Token Program
                ['pubkey' => 'SysvarRent111111111111111111111111111111111', 'isSigner' => false, 'isWritable' => false], // Rent Sysvar
            ],
            'data' => base64_encode(''), // Empty data for create instruction
        ];
    }

    /**
     * Create Token Transfer instruction
     */
    protected function createTokenTransferInstruction(string $fromATA, string $toATA, string $owner, string $amount): array
    {
        // Transfer instruction: [12, amount as 64-bit little-endian]
        $data = pack('C', 12); // Transfer instruction index
        $data .= pack('P', $amount); // 64-bit amount
        $data = base64_encode($data);

        return [
            'programId' => 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA',
            'keys' => [
                ['pubkey' => $fromATA, 'isSigner' => false, 'isWritable' => true],
                ['pubkey' => $toATA, 'isSigner' => false, 'isWritable' => true],
                ['pubkey' => $owner, 'isSigner' => true, 'isWritable' => false],
            ],
            'data' => $data,
        ];
    }
}