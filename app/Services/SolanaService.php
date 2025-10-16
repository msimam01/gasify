<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class SolanaService
{
    protected string $rpcUrl;
    protected string $network;

    // Program IDs
    private const SYSTEM_PROGRAM_ID = '11111111111111111111111111111111';
    private const MEMO_PROGRAM_ID = 'MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr';

    public function __construct()
    {
        $this->rpcUrl = config('services.solana.rpc', 'https://api.devnet.solana.com');
        $this->network = config('services.solana.network', env('SOLANA_NETWORK', 'devnet'));
        
        // Verify System Program ID decodes to 32 bytes
        $systemProgramBytes = $this->base58Decode(self::SYSTEM_PROGRAM_ID);
        if (strlen($systemProgramBytes) !== 32) {
            Log::warning('System Program ID decoded to unexpected length', [
                'length' => strlen($systemProgramBytes),
                'hex' => bin2hex($systemProgramBytes),
            ]);
        }
    }

    public function setNetwork(string $network = 'devnet'): void
    {
        $this->network = $network;
    }

    public function validateAddress(string $address): bool
    {
        return (bool)preg_match('/^[1-9A-HJ-NP-Za-km-z]{32,44}$/', $address);
    }

    public function convertToLamports(float $solAmount): int
    {
        return (int)round($solAmount * 1_000_000_000);
    }

    public function convertFromLamports(int $lamports): float
    {
        return $lamports / 1_000_000_000;
    }

    public function getBalance(string $publicKey): int
    {
        $resp = $this->rpc('getBalance', [$publicKey]);
        return (int)($resp['result']['value'] ?? 0);
    }

    public function getAccountInfo(string $publicKey): ?array
    {
        try {
            $resp = $this->rpc('getAccountInfo', [$publicKey, ['encoding' => 'base64']]);
            return $resp['result']['value'] ?? null;
        } catch (\Throwable $e) {
            Log::error('Failed to get account info', [
                'address' => $publicKey,
                'error' => $e->getMessage(),
            ]);
            return null;
        }
    }

    public function getLatestBlockhash(): string
    {
        $resp = $this->rpc('getLatestBlockhash', []);
        return $resp['result']['value']['blockhash'] ?? '';
    }

    public function estimateFee(array $instructions): int
    {
        // Typical fee on devnet/mainnet for simple transfer
        return 5000;
    }

    public function sendTransaction(array $params): string
    {
        $from = $params['from'] ?? '';
        $to = $params['to'] ?? '';
        $amountLamports = $params['amount'] ?? 0;
        $privateKeyBase64 = $params['private_key'] ?? '';
        $memo = $params['memo'] ?? null;

        if (!$this->validateAddress($from) || !$this->validateAddress($to)) {
            throw new \InvalidArgumentException('Invalid Solana address');
        }

        // Validate sender account
        $senderInfo = $this->getAccountInfo($from);
        if ($senderInfo === null) {
            throw new \RuntimeException("Sender account does not exist on {$this->network}. Please fund the account first.");
        }

        $senderBalance = $this->getBalance($from);
        Log::info('Sender balance check', [
            'address' => $from,
            'balance_lamports' => $senderBalance,
            'required_lamports' => $amountLamports
        ]);

        if (!is_int($amountLamports) || $amountLamports <= 0) {
            throw new \InvalidArgumentException('Invalid lamports amount');
        }

        // Decode and validate private key
        $secretKey = base64_decode($privateKeyBase64, true);
        if ($secretKey === false || strlen($secretKey) !== SODIUM_CRYPTO_SIGN_SECRETKEYBYTES) {
            throw new \RuntimeException('Invalid Solana private key format');
        }

        $publicKey = sodium_crypto_sign_publickey_from_secretkey($secretKey);
        $fromPub = $this->base58Encode($publicKey);
        
        if ($fromPub !== $from) {
            throw new \RuntimeException('Private key does not match source address');
        }

        $recentBlockhash = $this->getLatestBlockhash();
        if (!$recentBlockhash) {
            throw new \RuntimeException('Failed to fetch recent blockhash');
        }

        // Build instructions
        $instructions = [
            $this->buildSystemTransferInstruction($from, $to, $amountLamports),
        ];
        
        if (is_string($memo) && $memo !== '') {
            $instructions[] = $this->buildMemoInstruction($from, $memo);
        }

        // Compile and sign transaction
        $message = $this->compileMessage($instructions, $recentBlockhash, $from);
        
        // Debug: Log message length
        Log::debug('Message compiled', [
            'message_length' => strlen($message),
            'message_hex' => bin2hex(substr($message, 0, 100)), // First 100 bytes
        ]);
        
        $signature = sodium_crypto_sign_detached($message, $secretKey);
        
        // Debug: Log signature length
        Log::debug('Signature created', [
            'signature_length' => strlen($signature),
            'signature_hex' => bin2hex($signature),
        ]);
        
        // Serialize the complete transaction
        $transaction = $this->serializeTransaction($signature, $message);
        
        // Debug: Log transaction length
        Log::debug('Transaction serialized', [
            'transaction_length' => strlen($transaction),
            'transaction_hex' => bin2hex(substr($transaction, 0, 150)), // First 150 bytes
        ]);
        
        $b64Tx = base64_encode($transaction);

        // Send transaction
        $resp = $this->rpc('sendTransaction', [
            $b64Tx,
            [
                'encoding' => 'base64',
                'skipPreflight' => false,
                'maxRetries' => 2
            ]
        ]);
        
        Log::info('Solana sendTransaction response', ['response' => $resp]);
        
        $sig = $resp['result'] ?? null;
        if (!is_string($sig) || $sig === '') {
            $errorData = $resp['error'] ?? [];
            $decodedError = $this->decodeSolanaError($errorData);
            
            Log::error('Solana transaction failed', [
                'from' => $from,
                'to' => $to,
                'amount_lamports' => $amountLamports,
                'error' => $decodedError,
                'raw_error' => $errorData,
            ]);
            
            throw new \RuntimeException($decodedError);
        }
        
        Log::info('Solana transaction sent successfully', [
            'signature' => $sig,
            'from' => $from,
            'to' => $to,
            'amount_lamports' => $amountLamports,
            'explorer_url' => $this->getTransactionUrl($sig),
        ]);
        
        return $sig;
    }

    public function waitForConfirmation(string $signature, int $timeoutSeconds = 60, int $pollIntervalSeconds = 2): array
    {
        $deadline = time() + $timeoutSeconds;
        do {
            $resp = $this->rpc('getSignatureStatuses', [[$signature], ['searchTransactionHistory' => true]]);
            $status = $resp['result']['value'][0] ?? null;
            if ($status && isset($status['confirmationStatus'])) {
                if (in_array($status['confirmationStatus'], ['confirmed', 'finalized'])) {
                    return $status;
                }
            }
            usleep($pollIntervalSeconds * 1_000_000);
        } while (time() < $deadline);

        throw new \RuntimeException('Confirmation timeout');
    }

    public function getTransactionDetails(string $signature): array
    {
        $resp = $this->rpc('getTransaction', [$signature, ['encoding' => 'json']]);
        return $resp['result'] ?? [];
    }

    public function getTransactionUrl(string $signature): string
    {
        $base = 'https://explorer.solana.com/tx/' . $signature;
        if ($this->network && $this->network !== 'mainnet-beta') {
            return $base . '?cluster=' . $this->network;
        }
        return $base;
    }

    // --- Instruction Builders & Serialization ---

    private function buildSystemTransferInstruction(string $from, string $to, int $lamports): array
    {
        // System Program Transfer instruction data:
        // - 4 bytes: instruction index (2 = Transfer)
        // - 8 bytes: lamports (little-endian u64)
        $data = pack('V', 2) . $this->packU64LE($lamports);
        
        return [
            'programId' => self::SYSTEM_PROGRAM_ID,
            'accounts' => [
                ['pubkey' => $from, 'isSigner' => true, 'isWritable' => true],
                ['pubkey' => $to, 'isSigner' => false, 'isWritable' => true],
            ],
            'data' => $data,
        ];
    }

    private function buildMemoInstruction(string $signer, string $memo): array
    {
        return [
            'programId' => self::MEMO_PROGRAM_ID,
            'accounts' => [
                ['pubkey' => $signer, 'isSigner' => true, 'isWritable' => false],
            ],
            'data' => $memo,
        ];
    }
    private function compileLegacyMessage(array $instructions, string $recentBlockhash, string $feePayer): string
{
    // Collect unique accounts with metadata
    $accountMetas = [];
    $accountKeysMap = [];
    
    $addAccount = function(string $pubkey, bool $isSigner, bool $isWritable) use (&$accountMetas, &$accountKeysMap) {
        if (!isset($accountKeysMap[$pubkey])) {
            $accountKeysMap[$pubkey] = count($accountMetas);
            $accountMetas[] = [
                'pubkey' => $pubkey,
                'isSigner' => $isSigner,
                'isWritable' => $isWritable,
            ];
        }
    };
    
    // 1. Fee payer FIRST (required)
    $addAccount($feePayer, true, true);
    
    // 2. Add all instruction accounts + programs
    foreach ($instructions as $ix) {
        // Add instruction accounts
        foreach ($ix['accounts'] as $acc) {
            $addAccount($acc['pubkey'], $acc['isSigner'], $acc['isWritable']);
        }
        // Add program ID (readonly, non-signer)
        $addAccount($ix['programId'], false, false);
    }
    
    // 3. CRITICAL: Sort accounts in Solana order
    $sorted = $this->sortAccountsForSolana($accountMetas);
    
    // 4. Build header
    $numReqSigs = count(array_filter($sorted, fn($a) => $a['isSigner']));
    $numReadOnlySigned = count(array_filter($sorted, fn($a) => $a['isSigner'] && !$a['isWritable']));
    $numReadOnlyUnsigned = count(array_filter($sorted, fn($a) => !$a['isSigner'] && !$a['isWritable']));
    
    $header = pack('C3', $numReqSigs, $numReadOnlySigned, $numReadOnlyUnsigned);
    
    // 5. Serialize account keys (compact length + 32-byte keys)
    $accountKeysBin = $this->compactArrayLength(count($sorted));
    foreach ($sorted as $meta) {
        $keyBin = $this->base58Decode($meta['pubkey']);
        if (strlen($keyBin) !== 32) {
            throw new \RuntimeException("Invalid pubkey length: " . strlen($keyBin));
        }
        $accountKeysBin .= $keyBin;
    }
    
    // 6. Recent blockhash (32 bytes)
    $blockhashBin = $this->base58Decode($recentBlockhash);
    if (strlen($blockhashBin) !== 32) {
        throw new \RuntimeException("Invalid blockhash length: " . strlen($blockhashBin));
    }
    
    // 7. Build account index map
    $keyToIndex = [];
    foreach ($sorted as $idx => $meta) {
        $keyToIndex[$meta['pubkey']] = $idx;
    }
    
    // 8. Serialize instructions
    $instructionsBin = $this->compactArrayLength(count($instructions));
    foreach ($instructions as $ix) {
        // Program ID index
        $programIdIndex = $keyToIndex[$ix['programId']];
        $instructionsBin .= pack('C', $programIdIndex);
        
        // Account indices
        $accountIndices = array_map(fn($acc) => $keyToIndex[$acc['pubkey']], $ix['accounts']);
        $instructionsBin .= $this->compactArrayLength(count($accountIndices));
        foreach ($accountIndices as $i) {
            $instructionsBin .= pack('C', $i);
        }
        
        // Instruction data
        $data = $ix['data'];
        $instructionsBin .= $this->compactArrayLength(strlen($data));
        $instructionsBin .= $data;
    }
    
    // 9. FINAL MESSAGE
    $message = $header . $accountKeysBin . $blockhashBin . $instructionsBin;
    
    Log::debug('Legacy message compiled', [
        'length' => strlen($message),
        'header' => bin2hex(substr($message, 0, 3)),
        'num_accounts' => count($sorted),
        'num_instructions' => count($instructions),
        'hex_preview' => bin2hex(substr($message, 0, 100))
    ]);
    
    return $message;
}
private function sortAccountsForSolana(array $accountMetas): array
{
    // Solana REQUIRED ORDER:
    // 1. Signer + Writable
    // 2. Signer + Readonly  
    // 3. Non-signer + Writable
    // 4. Non-signer + Readonly
    $buckets = [
        'signer_writable' => [],
        'signer_readonly' => [],
        'nonsigner_writable' => [],
        'nonsigner_readonly' => []
    ];
    
    foreach ($accountMetas as $meta) {
        $bucket = match (true) {
            $meta['isSigner'] && $meta['isWritable'] => 'signer_writable',
            $meta['isSigner'] && !$meta['isWritable'] => 'signer_readonly',
            !$meta['isSigner'] && $meta['isWritable'] => 'nonsigner_writable',
            default => 'nonsigner_readonly'
        };
        $buckets[$bucket][] = $meta;
    }
    
    return array_merge(
        $buckets['signer_writable'],
        $buckets['signer_readonly'],
        $buckets['nonsigner_writable'],
        $buckets['nonsigner_readonly']
    );
}
    private function compileMessage(array $instructions, string $recentBlockhash, string $feePayer): string
{
    return $this->compileLegacyMessage($instructions, $recentBlockhash, $feePayer);
}

private function serializeTransaction(string $signature, string $messageBinary): string
{
    // FIXED: Proper transaction serialization
    $numSignaturesBin = $this->compactArrayLength(1); // 1 signature
    $signaturesBin = $signature; // 64 bytes
    $messageBin = $messageBinary;
    
    $transaction = $numSignaturesBin . $signaturesBin . $messageBin;
    
    Log::debug('Transaction serialized', [
        'total_length' => strlen($transaction),
        'signatures_length' => strlen($numSignaturesBin) + 64,
        'message_length' => strlen($messageBin),
        'hex_preview' => bin2hex(substr($transaction, 0, 50))
    ]);
    
    return $transaction;
}
// Add to SolanaService for testing
public function debugTransaction(string $from, string $to, int $lamports, string $privateKey): void
{
    $blockhash = $this->getLatestBlockhash();
    $instructions = [$this->buildSystemTransferInstruction($from, $to, $lamports)];
    $message = $this->compileLegacyMessage($instructions, $blockhash, $from);
    $secretKey = base64_decode($privateKey);
    $signature = sodium_crypto_sign_detached($message, $secretKey);
    $tx = $this->serializeTransaction($signature, $message);
    
    Log::info('DEBUG TRANSACTION', [
        'message_length' => strlen($message),
        'expected_message' => 123 + (32 * 3) + 32, // header + 3 accounts + blockhash
        'signature_length' => strlen($signature),
        'total_tx_length' => strlen($tx),
        'expected_tx' => 1 + 64 + (123 + 96 + 32), // compact(1) + sig + message
        'base64_preview' => substr(base64_encode($tx), 0, 100)
    ]);
}
    private function decodeSolanaError(array $errorData): string
    {
        $message = $errorData['message'] ?? 'Unknown error';
        $code = $errorData['code'] ?? null;
        
        $errorPatterns = [
            'AccountNotFound' => 'Account does not exist on the blockchain',
            'InsufficientFunds' => 'Insufficient funds for transaction',
            'InvalidAccountData' => 'Invalid account data',
            'InvalidArgument' => 'Invalid argument provided',
            'InvalidInstruction' => 'Invalid instruction',
            'BlockhashNotFound' => 'Blockhash expired, please retry',
            'SignatureVerificationFailed' => 'Signature verification failed - check private key',
        ];
        
        foreach ($errorPatterns as $pattern => $readable) {
            if (stripos($message, $pattern) !== false) {
                return "$readable: $message";
            }
        }
        
        return "Solana RPC Error (code: $code): $message";
    }

    // --- Helpers ---

    private function rpc(string $method, array $params): array
    {
        $payload = [
            'jsonrpc' => '2.0',
            'id' => 1,
            'method' => $method,
            'params' => $params,
        ];
        
        Log::debug('Solana RPC request', [
            'method' => $method,
            'params' => $params,
            'rpc_url' => $this->rpcUrl
        ]);
        
        $resp = Http::timeout(20)->post($this->rpcUrl, $payload);
        
        if (!$resp->ok()) {
            Log::error('Solana RPC HTTP error', [
                'status' => $resp->status(),
                'body' => $resp->body()
            ]);
            throw new \RuntimeException("RPC error: HTTP {$resp->status()}");
        }
        
        $json = $resp->json();
        
        if (isset($json['error'])) {
            Log::warning('Solana RPC returned error', [
                'method' => $method,
                'error' => $json['error']
            ]);
        }
        
        return $json;
    }

    private function base58Encode(string $data): string
    {
        $alphabet = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
        $num = gmp_init(bin2hex($data), 16);
        $encoded = '';
        
        while (gmp_cmp($num, 0) > 0) {
            [$num, $rem] = gmp_div_qr($num, 58);
            $encoded = $alphabet[gmp_intval($rem)] . $encoded;
        }
        
        // Preserve leading zeros
        foreach (str_split($data) as $c) {
            if ($c === "\x00") {
                $encoded = '1' . $encoded;
            } else {
                break;
            }
        }
        
        return $encoded === '' ? '1' : $encoded;
    }

    private function base58Decode(string $str): string
    {
        $alphabet = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
        $indexes = array_flip(str_split($alphabet));
        
        // Count leading '1's (which represent leading zero bytes)
        $leadingZeros = 0;
        foreach (str_split($str) as $c) {
            if ($c === '1') {
                $leadingZeros++;
            } else {
                break;
            }
        }
        
        // If entire string is '1's, return all zeros
        if ($leadingZeros === strlen($str)) {
            // For Solana addresses/keys, always 32 bytes
            return str_repeat("\x00", 32);
        }
        
        $num = gmp_init(0, 10);
        foreach (str_split($str) as $char) {
            if (!isset($indexes[$char])) {
                throw new \InvalidArgumentException('Invalid base58 character: ' . $char);
            }
            $num = gmp_add(gmp_mul($num, 58), $indexes[$char]);
        }
        
        $hex = gmp_strval($num, 16);
        if (strlen($hex) % 2) {
            $hex = '0' . $hex;
        }
        
        $bin = hex2bin($hex);
        if ($bin === false) {
            $bin = '';
        }
        
        return str_repeat("\x00", $leadingZeros) . $bin;
    }

    private function compactArrayLength(int $len): string
    {
        // FIXED: Proper Solana compact-u16 (short-vec) encoding
        $bytes = '';
        do {
            $elem = $len & 0x7F;
            $len >>= 7;
            if ($len !== 0) {
                $elem |= 0x80;
            }
            $bytes .= chr($elem);
        } while ($len > 0);
        return $bytes;
    }

    private function packU64LE(int $value): string
    {
        // Use 'P' format code for unsigned long long (64 bit, little endian byte order)
        return pack('P', $value);
    }

    public function getKeypairFromWallet($wallet): array
    {
        $encryptedPk = $wallet->meta['encrypted_pk'] ?? null;
        if (!$encryptedPk) {
            throw new \RuntimeException('Wallet private key not found');
        }

        $privateKeyBase64 = \Illuminate\Support\Facades\Crypt::decryptString($encryptedPk);
        $secretKey = base64_decode($privateKeyBase64, true);
        
        if ($secretKey === false || strlen($secretKey) !== SODIUM_CRYPTO_SIGN_SECRETKEYBYTES) {
            throw new \RuntimeException('Invalid private key format');
        }

        $publicKey = sodium_crypto_sign_publickey_from_secretkey($secretKey);
        
        return [
            'public_key' => $publicKey,
            'private_key_bytes' => $secretKey,
            'address' => $this->base58Encode($publicKey),
        ];
    }
}