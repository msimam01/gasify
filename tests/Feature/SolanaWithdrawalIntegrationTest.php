<?php

namespace Tests\Feature;

use Tests\TestCase;
use App\Services\SolanaService;
use Illuminate\Support\Facades\Log;
use Illuminate\Foundation\Testing\RefreshDatabase;

class SolanaWithdrawalIntegrationTest extends TestCase
{
    /**
     * Test the complete Solana transaction flow
     * This test uses real devnet addresses and will attempt to send a transaction
     */
    public function test_complete_solana_transaction_flow()
    {
        $this->markTestSkipped('This test requires funded devnet accounts. Run manually when needed.');
        
        $solanaService = new SolanaService();
        
        // These should be replaced with actual test wallet credentials
        $fromAddress = 'DPiCfDcUziAnA6J6pgSyW9yRMpSdh77HjS8NYrf4AXaK';
        $toAddress = '2AMtMpzjVg2QiBumrmCmYUutVkv7etZar6E2gYWwKXs1';
        $privateKeyBase64 = 'YOUR_BASE64_ENCODED_PRIVATE_KEY_HERE';
        
        // Check sender balance
        $senderBalance = $solanaService->getBalance($fromAddress);
        Log::info('Sender balance', ['lamports' => $senderBalance, 'sol' => $senderBalance / 1e9]);
        
        $this->assertGreaterThan(0, $senderBalance, 'Sender must have balance');
        
        // Send 0.01 SOL (10,000,000 lamports)
        $amountLamports = 10_000_000;
        
        try {
            $signature = $solanaService->sendTransaction([
                'from' => $fromAddress,
                'to' => $toAddress,
                'amount' => $amountLamports,
                'private_key' => $privateKeyBase64,
                'memo' => 'Test transaction from Laravel',
            ]);
            
            $this->assertNotEmpty($signature, 'Transaction signature should not be empty');
            $this->assertIsString($signature, 'Signature should be a string');
            
            Log::info('Transaction sent successfully', [
                'signature' => $signature,
                'explorer_url' => $solanaService->getTransactionUrl($signature),
            ]);
            
            // Wait for confirmation
            $status = $solanaService->waitForConfirmation($signature, 30);
            $this->assertNotEmpty($status, 'Transaction should be confirmed');
            
            Log::info('Transaction confirmed', ['status' => $status]);
            
        } catch (\Exception $e) {
            $this->fail('Transaction failed: ' . $e->getMessage());
        }
    }
    
    /**
     * Test transaction validation
     */
    public function test_transaction_validation()
    {
        $solanaService = new SolanaService();
        
        // Test invalid address
        $this->expectException(\InvalidArgumentException::class);
        $solanaService->sendTransaction([
            'from' => 'invalid_address',
            'to' => '2AMtMpzjVg2QiBumrmCmYUutVkv7etZar6E2gYWwKXs1',
            'amount' => 1000000,
            'private_key' => base64_encode(random_bytes(64)),
        ]);
    }
    
    /**
     * Test address validation
     */
    public function test_address_validation()
    {
        $solanaService = new SolanaService();
        
        // Valid addresses
        $this->assertTrue($solanaService->validateAddress('DPiCfDcUziAnA6J6pgSyW9yRMpSdh77HjS8NYrf4AXaK'));
        $this->assertTrue($solanaService->validateAddress('2AMtMpzjVg2QiBumrmCmYUutVkv7etZar6E2gYWwKXs1'));
        $this->assertTrue($solanaService->validateAddress('11111111111111111111111111111111'));
        
        // Invalid addresses
        $this->assertFalse($solanaService->validateAddress('invalid'));
        $this->assertFalse($solanaService->validateAddress('0x1234567890abcdef')); // Ethereum address
        $this->assertFalse($solanaService->validateAddress(''));
    }
    
    /**
     * Test lamports conversion
     */
    public function test_lamports_conversion()
    {
        $solanaService = new SolanaService();
        
        // SOL to lamports
        $this->assertEquals(1_000_000_000, $solanaService->convertToLamports(1.0));
        $this->assertEquals(500_000_000, $solanaService->convertToLamports(0.5));
        $this->assertEquals(10_000_000, $solanaService->convertToLamports(0.01));
        
        // Lamports to SOL
        $this->assertEquals(1.0, $solanaService->convertFromLamports(1_000_000_000));
        $this->assertEquals(0.5, $solanaService->convertFromLamports(500_000_000));
        $this->assertEquals(0.01, $solanaService->convertFromLamports(10_000_000));
    }
}
