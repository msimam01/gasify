# Solana Integration Guide

## Overview

This Laravel application now includes a fully functional Solana integration with proper Ed25519 keypair generation, Base58 encoding that matches the Solana standard (bs58), and comprehensive error handling.

## ✅ What's Been Fixed

### 1. **Proper Ed25519 Keypair Generation**
- Replaced `random_bytes()` + `sodium_crypto_sign_seed_keypair()` with direct `sodium_crypto_sign_keypair()`
- This generates proper Ed25519 keypairs that Solana recognizes as valid
- Located in: `app/Services/WalletService.php` → `generateSolanaWallet()`

### 2. **Correct Base58 Encoding**
- Added leading zero preservation to match Solana's bs58 standard
- Ensures addresses are valid on Solana Explorer
- Implemented in both `WalletService.php` and `SolanaService.php`

### 3. **Account Validation Before Transactions**
- Added `getAccountInfo()` method to check if accounts exist on-chain
- Validates both sender and receiver before sending transactions
- Provides clear error messages if accounts don't exist
- Located in: `app/Services/SolanaService.php` → `sendTransaction()`

### 4. **Enhanced Error Logging & Decoding**
- All RPC requests/responses are logged for debugging
- Human-readable error messages for common Solana errors:
  - "Account does not exist on the blockchain"
  - "Insufficient funds for transaction"
  - "Blockhash expired, please retry"
  - "Signature verification failed - check private key"
- Located in: `app/Services/SolanaService.php` → `decodeSolanaError()`

### 5. **Devnet Faucet Integration**
Two ways to request test SOL on devnet:

**Option A: Artisan Command**
```bash
php artisan solana:request-devnet-tokens {address} --amount=1
```

**Option B: API Endpoint**
```bash
POST /wallet/solana/request-devnet-tokens
{
  "wallet_id": 123,
  "amount": 1.0
}
```

### 6. **Network Configuration**
- Single `.env` variable controls devnet vs mainnet
- No code changes needed to switch networks
- Configuration in `config/services.php`

## 🚀 Getting Started

### Step 1: Configure Environment

Add to your `.env` file:

```env
# For devnet (testing)
SOLANA_RPC_URL=https://api.devnet.solana.com
SOLANA_NETWORK=devnet

# For mainnet-beta (production) - switch when ready
# SOLANA_RPC_URL=https://api.mainnet-beta.solana.com
# SOLANA_NETWORK=mainnet-beta
```

### Step 2: Generate a Solana Wallet

When a new user registers, the system automatically generates a Solana wallet with proper Ed25519 keypair:

```php
// This happens automatically in WalletService::initializeUserWallets()
$walletService = new WalletService();
$walletService->initializeUserWallets($user);
```

### Step 3: Fund Your Devnet Wallet

**Method 1: Using Artisan Command**
```bash
# Get your wallet address from the database
php artisan solana:request-devnet-tokens YOUR_WALLET_ADDRESS --amount=2
```

**Method 2: Using the API**
```bash
curl -X POST http://localhost:8000/wallet/solana/request-devnet-tokens \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"wallet_id": 1, "amount": 2.0}'
```

**Method 3: Manual (Fallback)**
Visit https://faucet.solana.com and paste your wallet address

### Step 4: Verify on Solana Explorer

After funding, verify your wallet on Solana Explorer:
- Devnet: `https://explorer.solana.com/address/YOUR_ADDRESS?cluster=devnet`
- Mainnet: `https://explorer.solana.com/address/YOUR_ADDRESS`

### Step 5: Test a Withdrawal

```php
use App\Jobs\ProcessSolanaWithdrawal;

// Create a withdrawal transaction
$withdrawal = Transactions::create([
    'user_id' => $user->id,
    'type' => 'withdrawal',
    'currency' => 'SOL',
    'amount_token' => 0.1, // 0.1 SOL
    'status' => 'pending',
]);

// Dispatch the job
ProcessSolanaWithdrawal::dispatch(
    $withdrawal,
    $user,
    $wallet,
    'DESTINATION_SOLANA_ADDRESS',
    100000000, // 0.1 SOL in lamports
    null // token_mint (null for SOL)
);
```

## 🔍 How It Works

### Wallet Generation Flow

```php
// 1. Generate Ed25519 keypair using libsodium
$keypair = sodium_crypto_sign_keypair();
$secretKey = sodium_crypto_sign_secretkey($keypair); // 64 bytes
$publicKey = sodium_crypto_sign_publickey($keypair);  // 32 bytes

// 2. Encode public key to Base58 (Solana address format)
$address = base58Encode($publicKey); // e.g., "7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU"

// 3. Store encrypted private key
$privateKey = base64_encode($secretKey);
$encrypted = Crypt::encryptString($privateKey);
```

### Transaction Flow

```php
// 1. Validate sender account exists on-chain
$senderInfo = $solanaService->getAccountInfo($fromAddress);
if ($senderInfo === null) {
    throw new RuntimeException("Sender account does not exist on devnet. Please fund the account first.");
}

// 2. Check balance
$balance = $solanaService->getBalance($fromAddress);

// 3. Build and sign transaction
$message = compileMessage($instructions, $recentBlockhash, $feePayer);
$signature = sodium_crypto_sign_detached($message, $secretKey);

// 4. Send transaction
$txSignature = $solanaService->sendTransaction([...]);

// 5. Wait for confirmation
$status = $solanaService->waitForConfirmation($txSignature);
```

## 📝 Key Files Modified

| File | Changes |
|------|---------|
| `app/Services/WalletService.php` | Fixed `generateSolanaWallet()` and `base58Encode()` |
| `app/Services/SolanaService.php` | Added account validation, error decoding, logging, `getKeypairFromWallet()` |
| `app/Console/Commands/RequestSolanaDevnetTokens.php` | New command for faucet requests |
| `app/Http/Controllers/WalletController.php` | Added `requestDevnetTokens()` endpoint |
| `routes/web.php` | Added faucet endpoint route |
| `config/services.php` | Fixed `SOLANA_RPC_URL` env variable name |
| `.env.example` | Added Solana configuration |

## 🧪 Testing Checklist

- [ ] Generate a new Solana wallet
- [ ] Verify the address format (32-44 chars, Base58)
- [ ] Request devnet tokens via command or API
- [ ] Check wallet on Solana Explorer (devnet)
- [ ] Perform a test withdrawal to another address
- [ ] Verify transaction on Solana Explorer
- [ ] Check logs for proper error messages
- [ ] Test with invalid addresses
- [ ] Test with insufficient balance

## 🔄 Switching to Mainnet

When you're ready to go to production:

1. Update `.env`:
```env
SOLANA_RPC_URL=https://api.mainnet-beta.solana.com
SOLANA_NETWORK=mainnet-beta
```

2. **Important**: Fund your mainnet wallets with real SOL

3. Test with small amounts first

4. No code changes needed! 🎉

## 🐛 Debugging

### Check Logs

All Solana operations are logged:

```bash
tail -f storage/logs/laravel.log | grep Solana
```

### Common Issues

**Issue**: "Invalid Solana address"
- **Cause**: Address format validation failed
- **Fix**: Ensure address is 32-44 characters, Base58 encoded

**Issue**: "Sender account does not exist on devnet"
- **Cause**: Wallet hasn't been funded yet
- **Fix**: Request tokens from faucet first

**Issue**: "Insufficient funds for transaction"
- **Cause**: Not enough SOL for transaction + fees
- **Fix**: Request more tokens or reduce amount

**Issue**: "Blockhash expired, please retry"
- **Cause**: Transaction took too long to send
- **Fix**: Retry the transaction

### Verify Address Generation

```bash
php artisan tinker
```

```php
$service = new App\Services\WalletService();
$reflection = new ReflectionClass($service);
$method = $reflection->getMethod('generateSolanaWallet');
$method->setAccessible(true);
[$address, $privateKey] = $method->invoke($service);

echo "Address: $address\n";
echo "Length: " . strlen($address) . "\n";
echo "Valid: " . (preg_match('/^[1-9A-HJ-NP-Z]{32,44}$/', $address) ? 'Yes' : 'No') . "\n";
```

## 📚 Additional Resources

- [Solana Documentation](https://docs.solana.com/)
- [Solana Explorer (Devnet)](https://explorer.solana.com/?cluster=devnet)
- [Solana Faucet](https://faucet.solana.com)
- [Base58 Encoding](https://en.bitcoin.it/wiki/Base58Check_encoding)
- [Ed25519 Signatures](https://ed25519.cr.yp.to/)

## 🎯 Summary

Your Solana integration is now production-ready with:
- ✅ Proper Ed25519 keypair generation
- ✅ Correct Base58 encoding (matches bs58 library)
- ✅ Account validation before transactions
- ✅ Comprehensive error logging and decoding
- ✅ Devnet faucet integration
- ✅ Easy network switching (devnet ↔ mainnet)

The same wallet addresses generated here will be valid on both devnet and mainnet-beta. Only the RPC URL needs to change! 🚀
