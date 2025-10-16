<?php

namespace Tests\Feature;

use Tests\TestCase;
use App\Services\SolanaService;
use Illuminate\Support\Facades\Log;

class SolanaTransactionTest extends TestCase
{
    public function test_solana_transaction_serialization()
    {
        $solanaService = new SolanaService();
        
        // Generate a test keypair
        $keypair = sodium_crypto_sign_keypair();
        $secretKey = sodium_crypto_sign_secretkey($keypair);
        $publicKey = sodium_crypto_sign_publickey($keypair);
        
        // Use reflection to access private methods for testing
        $reflection = new \ReflectionClass($solanaService);
        
        $base58Encode = $reflection->getMethod('base58Encode');
        $base58Encode->setAccessible(true);
        
        $compileMessage = $reflection->getMethod('compileMessage');
        $compileMessage->setAccessible(true);
        
        $serializeTransaction = $reflection->getMethod('serializeTransaction');
        $serializeTransaction->setAccessible(true);
        
        $fromAddress = $base58Encode->invoke($solanaService, $publicKey);
        $toAddress = '2AMtMpzjVg2QiBumrmCmYUutVkv7etZar6E2gYWwKXs1'; // Test address
        
        // Build a simple transfer instruction
        $instructions = [
            [
                'programId' => '11111111111111111111111111111111',
                'accounts' => [
                    ['pubkey' => $fromAddress, 'isSigner' => true, 'isWritable' => true],
                    ['pubkey' => $toAddress, 'isSigner' => false, 'isWritable' => true],
                ],
                'data' => pack('V', 2) . pack('P', 100000000), // Transfer 0.1 SOL
            ]
        ];
        
        $blockhash = 'EkSnNWid2cvwEVnVx9aBqawnmiCNiDgp3gUdkDPTKN1N'; // Dummy blockhash
        
        // Compile message
        $message = $compileMessage->invoke($solanaService, $instructions, $blockhash, $fromAddress);
        
        // Sign message
        $signature = sodium_crypto_sign_detached($message, $secretKey);
        
        // Serialize transaction
        $txBinary = $serializeTransaction->invoke($solanaService, $signature, $message);
        
        // Verify transaction structure
        $this->assertGreaterThan(0, strlen($txBinary), 'Transaction binary should not be empty');
        $this->assertEquals(64, strlen($signature), 'Signature should be 64 bytes');
        
        // Check that message starts with proper header
        $header = ord($message[0]);
        $this->assertGreaterThan(0, $header, 'Message should have at least one required signature');
        
        Log::info('Solana transaction test passed', [
            'from' => $fromAddress,
            'to' => $toAddress,
            'message_length' => strlen($message),
            'signature_length' => strlen($signature),
            'transaction_length' => strlen($txBinary),
            'transaction_base64' => base64_encode($txBinary),
        ]);
        
        $this->assertTrue(true);
    }
    
    public function test_solana_balance_check()
    {
        $solanaService = new SolanaService();
        
        // Test with a known devnet address (may or may not exist)
        $testAddress = 'DPiCfDcUziAnA6J6pgSyW9yRMpSdh77HjS8NYrf4AXaK';
        
        try {
            $balance = $solanaService->getBalance($testAddress);
            $this->assertIsInt($balance, 'Balance should be an integer (lamports)');
            $this->assertGreaterThanOrEqual(0, $balance, 'Balance should be non-negative');
            
            Log::info('Balance check passed', [
                'address' => $testAddress,
                'balance_lamports' => $balance,
                'balance_sol' => $balance / 1e9,
            ]);
        } catch (\Exception $e) {
            $this->fail('Balance check failed: ' . $e->getMessage());
        }
    }
}
