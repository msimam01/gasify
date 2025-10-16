# Solana Transaction Signing & Sending - Fix Documentation

## Problem Summary

The application was encountering the following error when attempting to send Solana transactions:

```
failed to deserialize solana_transaction::versioned::VersionedTransaction: io error: failed to fill whole buffer
```

This error indicated that the transaction bytes were not properly serialized before being sent to the Solana RPC endpoint.

## Root Cause

The issue was in the `compileMessage()` method in `App\Services\SolanaService`. The problems were:

1. **Incorrect Account Ordering**: Solana requires accounts in a transaction message to be sorted in a specific order:
   - Signer + Writable accounts first
   - Signer + Readonly accounts second
   - Non-signer + Writable accounts third
   - Non-signer + Readonly accounts last

2. **Incorrect Header Calculation**: The message header wasn't properly calculating:
   - `numRequiredSignatures` (total signers)
   - `numReadonlySignedAccounts` (readonly signers)
   - `numReadonlyUnsignedAccounts` (readonly non-signers)

3. **Account Index Mismatch**: After collecting accounts, the indices weren't being updated to reflect the sorted order, causing instruction compilation to reference wrong account positions.

## Solution

The `compileMessage()` method has been completely rewritten to:

1. **Properly collect and track account metadata** - Each account is tracked with `signer` and `writable` flags
2. **Sort accounts correctly** - Accounts are sorted into 4 groups as required by Solana
3. **Rebuild account indices** - After sorting, the account index map is rebuilt so instructions reference the correct positions
4. **Calculate correct header values** - Header bytes now accurately reflect the account structure

## Changes Made

### File: `app/Services/SolanaService.php`

The `compileMessage()` method (lines 234-342) has been updated with:

- Proper account collection with metadata tracking
- Correct account sorting (signers first, then by writable/readonly)
- Accurate header calculation
- Proper account index rebuilding after sorting

## Testing

Three test suites have been created to verify the fix:

### 1. Transaction Serialization Test
```bash
php artisan test --filter=SolanaTransactionTest::test_solana_transaction_serialization
```

Verifies that:
- Messages are properly compiled
- Signatures are correctly generated (64 bytes)
- Transactions are fully serialized (216+ bytes)

### 2. Balance Check Test
```bash
php artisan test --filter=SolanaTransactionTest::test_solana_balance_check
```

Verifies that:
- RPC connection works
- Balance queries return valid data

### 3. Validation Tests
```bash
php artisan test --filter=SolanaWithdrawalIntegrationTest
```

Verifies that:
- Address validation works correctly
- Lamports conversion is accurate
- Transaction validation catches invalid inputs

## Usage

The `SolanaService` can now be used to send transactions:

```php
use App\Services\SolanaService;

$solanaService = new SolanaService();

// Send a transaction
$signature = $solanaService->sendTransaction([
    'from' => 'DPiCfDcUziAnA6J6pgSyW9yRMpSdh77HjS8NYrf4AXaK',
    'to' => '2AMtMpzjVg2QiBumrmCmYUutVkv7etZar6E2gYWwKXs1',
    'amount' => 500_000_000, // 0.5 SOL in lamports
    'private_key' => $base64EncodedPrivateKey,
    'memo' => 'Optional memo', // Optional
]);

// Wait for confirmation
$status = $solanaService->waitForConfirmation($signature, 60);

// Get transaction URL
$explorerUrl = $solanaService->getTransactionUrl($signature);
```

## Transaction Flow

1. **Validation**: Validates sender/receiver addresses and private key format
2. **Balance Check**: Verifies sender has sufficient balance (including fees)
3. **Blockhash**: Fetches latest blockhash from RPC
4. **Build Instructions**: Creates system transfer instruction (and optional memo)
5. **Compile Message**: Builds and serializes the transaction message
6. **Sign**: Signs the message with Ed25519 private key
7. **Serialize**: Combines signature(s) and message into final transaction
8. **Send**: Submits base64-encoded transaction to RPC
9. **Confirm**: Polls for transaction confirmation status

## Key Features

✅ **Native Ed25519 Signing**: Uses PHP's `sodium_crypto_sign_detached()` for secure signing
✅ **Proper Binary Serialization**: Follows Solana's exact transaction format
✅ **Devnet & Mainnet Compatible**: Works with both networks
✅ **Comprehensive Validation**: Validates addresses, balances, and keys
✅ **Error Handling**: Provides detailed error messages for debugging
✅ **Transaction Tracking**: Returns signature for explorer lookup

## Network Configuration

Configure your Solana network in `config/services.php`:

```php
'solana' => [
    'rpc' => env('SOLANA_RPC_URL', 'https://api.devnet.solana.com'),
    'network' => env('SOLANA_NETWORK', 'devnet'),
],
```

For mainnet:
```env
SOLANA_RPC_URL=https://api.mainnet-beta.solana.com
SOLANA_NETWORK=mainnet-beta
```

## Troubleshooting

### Transaction Still Failing?

1. **Check Account Exists**: Ensure sender account is funded on the network
   ```bash
   solana balance <ADDRESS> --url devnet
   ```

2. **Verify Private Key**: Ensure the base64-encoded private key is 64 bytes (88 chars in base64)

3. **Check RPC Endpoint**: Verify the RPC URL is accessible and responding

4. **Review Logs**: Check `storage/logs/laravel.log` for detailed error messages

### Common Errors

- **"Account does not exist"**: Fund the sender account first
- **"Insufficient funds"**: Account needs more SOL for amount + fees
- **"Blockhash not found"**: Blockhash expired, transaction will auto-retry
- **"Signature verification failed"**: Private key doesn't match sender address

## Testing on Devnet

1. **Get Devnet SOL**:
   ```bash
   solana airdrop 2 <YOUR_ADDRESS> --url devnet
   ```

2. **Run Tests**:
   ```bash
   php artisan test --filter=Solana
   ```

3. **Try a Withdrawal**:
   - Ensure your wallet has devnet SOL
   - Attempt a small withdrawal (0.01 SOL)
   - Check transaction on Solana Explorer

## Production Checklist

Before deploying to mainnet:

- [ ] Update RPC URL to mainnet endpoint
- [ ] Test with small amounts first
- [ ] Implement proper key management (HSM/KMS)
- [ ] Set up transaction monitoring
- [ ] Configure retry logic for failed transactions
- [ ] Implement rate limiting for RPC calls
- [ ] Set up alerts for failed transactions

## Support

For issues or questions:
1. Check the logs in `storage/logs/laravel.log`
2. Review test output for validation errors
3. Verify transaction on Solana Explorer
4. Check RPC endpoint status

## References

- [Solana Transaction Structure](https://docs.solana.com/developing/programming-model/transactions)
- [Solana RPC API](https://docs.solana.com/api/http)
- [Ed25519 Signatures](https://ed25519.cr.yp.to/)
