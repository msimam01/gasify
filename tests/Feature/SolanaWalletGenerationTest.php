<?php

namespace Tests\Feature;

use App\Services\WalletService;
use App\Services\SolanaService;
use Tests\TestCase;
use Illuminate\Foundation\Testing\RefreshDatabase;

class SolanaWalletGenerationTest extends TestCase
{
    /**
     * Test that generated Solana wallets have valid address format
     */
    public function test_solana_wallet_generation_produces_valid_addresses(): void
    {
        $walletService = new WalletService();
        $reflection = new \ReflectionClass($walletService);
        $method = $reflection->getMethod('generateSolanaWallet');
        $method->setAccessible(true);

        // Generate 10 wallets and verify they're all valid
        for ($i = 0; $i < 10; $i++) {
            [$address, $privateKey] = $method->invoke($walletService);

            // Check address format (Base58, 32-44 characters)
            // Base58 alphabet: 123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz
            $this->assertMatchesRegularExpression(
                '/^[1-9A-HJ-NP-Za-km-z]{32,44}$/',
                $address,
                "Generated address '$address' does not match Solana Base58 format"
            );

            // Check address length is typically 32-44 chars
            $this->assertGreaterThanOrEqual(32, strlen($address));
            $this->assertLessThanOrEqual(44, strlen($address));

            // Check private key is base64 encoded
            $decoded = base64_decode($privateKey, true);
            $this->assertNotFalse($decoded, 'Private key should be valid base64');
            
            // Check private key length (64 bytes for Ed25519)
            $this->assertEquals(
                SODIUM_CRYPTO_SIGN_SECRETKEYBYTES,
                strlen($decoded),
                'Private key should be 64 bytes for Ed25519'
            );
        }
    }

    /**
     * Test that the same private key always produces the same address
     */
    public function test_private_key_to_address_is_deterministic(): void
    {
        $walletService = new WalletService();
        $reflection = new \ReflectionClass($walletService);
        $method = $reflection->getMethod('generateSolanaWallet');
        $method->setAccessible(true);

        [$address1, $privateKey] = $method->invoke($walletService);

        // Derive address from private key
        $secretKey = base64_decode($privateKey, true);
        $publicKey = sodium_crypto_sign_publickey_from_secretkey($secretKey);
        
        $solanaService = new SolanaService();
        $reflectionSolana = new \ReflectionClass($solanaService);
        $base58Method = $reflectionSolana->getMethod('base58Encode');
        $base58Method->setAccessible(true);
        $address2 = $base58Method->invoke($solanaService, $publicKey);

        $this->assertEquals($address1, $address2, 'Address should be deterministic from private key');
    }

    /**
     * Test that Solana address validation works correctly
     */
    public function test_solana_address_validation(): void
    {
        $solanaService = new SolanaService();

        // Valid addresses
        $this->assertTrue($solanaService->validateAddress('7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU'));
        $this->assertTrue($solanaService->validateAddress('11111111111111111111111111111111'));

        // Invalid addresses
        $this->assertFalse($solanaService->validateAddress('invalid'));
        $this->assertFalse($solanaService->validateAddress('0x1234567890abcdef')); // Ethereum format
        $this->assertFalse($solanaService->validateAddress('too-short'));
        $this->assertFalse($solanaService->validateAddress('contains-invalid-chars-0OIl'));
    }

    /**
     * Test Base58 encoding preserves leading zeros
     */
    public function test_base58_encoding_preserves_leading_zeros(): void
    {
        $solanaService = new SolanaService();
        $reflection = new \ReflectionClass($solanaService);
        $method = $reflection->getMethod('base58Encode');
        $method->setAccessible(true);

        // Test with leading zeros
        $dataWithZeros = "\x00\x00\x01\x02\x03";
        $encoded = $method->invoke($solanaService, $dataWithZeros);
        
        // Should start with '11' (two '1's for two leading zero bytes)
        $this->assertStringStartsWith('11', $encoded);

        // Test without leading zeros
        $dataNoZeros = "\x01\x02\x03";
        $encodedNoZeros = $method->invoke($solanaService, $dataNoZeros);
        
        // Should NOT start with '1'
        $this->assertStringStartsWith('Ldp', $encodedNoZeros);
    }

    /**
     * Test lamports conversion
     */
    public function test_lamports_conversion(): void
    {
        $solanaService = new SolanaService();

        // 1 SOL = 1,000,000,000 lamports
        $this->assertEquals(1_000_000_000, $solanaService->convertToLamports(1.0));
        $this->assertEquals(500_000_000, $solanaService->convertToLamports(0.5));
        $this->assertEquals(100_000, $solanaService->convertToLamports(0.0001));

        // Reverse conversion
        $this->assertEquals(1.0, $solanaService->convertFromLamports(1_000_000_000));
        $this->assertEquals(0.5, $solanaService->convertFromLamports(500_000_000));
        $this->assertEquals(0.0001, $solanaService->convertFromLamports(100_000));
    }
}
