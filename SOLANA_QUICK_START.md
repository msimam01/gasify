# Solana Integration - Quick Start Guide

## 🎯 Quick Setup (3 Steps)

### 1. Configure Environment
```bash
# Add to .env
SOLANA_RPC_URL=https://api.devnet.solana.com
SOLANA_NETWORK=devnet
```

### 2. Generate & Fund a Test Wallet
```bash
# Option A: Via Artisan Command
php artisan tinker
>>> $user = User::first();
>>> $wallet = $user->wallets()->where('chain_id', function($q) {
...     $q->select('id')->from('chains')->where('slug', 'solana');
... })->first();
>>> echo $wallet->address;
# Copy the address, then exit tinker

php artisan solana:request-devnet-tokens YOUR_ADDRESS --amount=2

# Option B: Via Web Faucet
# Visit https://faucet.solana.com and paste your address
```

### 3. Verify on Explorer
```
https://explorer.solana.com/address/YOUR_ADDRESS?cluster=devnet
```

## 🧪 Test a Withdrawal

```bash
php artisan tinker
```

```php
use App\Jobs\ProcessSolanaWithdrawal;
use App\Models\{User, Transactions, UserWallets};

$user = User::first();
$wallet = $user->wallets()->whereHas('chain', fn($q) => $q->where('slug', 'solana'))->first();

// Create withdrawal transaction
$withdrawal = Transactions::create([
    'user_id' => $user->id,
    'type' => 'withdrawal',
    'currency' => 'SOL',
    'amount_token' => 0.1,
    'status' => 'pending',
]);

// Process withdrawal (replace with actual destination address)
ProcessSolanaWithdrawal::dispatch(
    $withdrawal,
    $user,
    $wallet,
    'DESTINATION_SOLANA_ADDRESS_HERE',
    100000000, // 0.1 SOL in lamports
    null
);

// Check status
$withdrawal->refresh();
echo "Status: {$withdrawal->status}\n";
echo "TX Hash: {$withdrawal->tx_hash}\n";
```

## 📋 API Endpoints

### Request Devnet Tokens
```bash
POST /wallet/solana/request-devnet-tokens
Authorization: Bearer YOUR_TOKEN
Content-Type: application/json

{
  "wallet_id": 1,
  "amount": 2.0
}
```

**Response:**
```json
{
  "success": true,
  "message": "Successfully requested 2.0 SOL from devnet faucet",
  "signature": "5j7s...",
  "explorer_url": "https://explorer.solana.com/tx/5j7s...?cluster=devnet"
}
```

## 🔍 Debugging Commands

```bash
# Check logs
tail -f storage/logs/laravel.log | grep Solana

# Run tests
php artisan test --filter=SolanaWalletGenerationTest

# Verify wallet generation
php artisan tinker
>>> $service = new App\Services\WalletService();
>>> $reflection = new ReflectionClass($service);
>>> $method = $reflection->getMethod('generateSolanaWallet');
>>> $method->setAccessible(true);
>>> [$address, $pk] = $method->invoke($service);
>>> echo "Address: $address\n";
>>> echo "Valid: " . (preg_match('/^[1-9A-HJ-NP-Za-km-z]{32,44}$/', $address) ? 'Yes' : 'No');
```

## 🚀 Switch to Mainnet

When ready for production:

```bash
# Update .env
SOLANA_RPC_URL=https://api.mainnet-beta.solana.com
SOLANA_NETWORK=mainnet-beta

# Clear config cache
php artisan config:clear
```

**⚠️ Important:** Fund mainnet wallets with real SOL before testing!

## ✅ What's Fixed

- ✅ **Proper Ed25519 keypair generation** using `sodium_crypto_sign_keypair()`
- ✅ **Correct Base58 encoding** with leading zero preservation (matches bs58)
- ✅ **Account validation** before sending transactions via `getAccountInfo()`
- ✅ **Enhanced error logging** with human-readable Solana error messages
- ✅ **Devnet faucet integration** via command and API endpoint
- ✅ **Network switching** via single `.env` variable (no code changes)

## 📊 Test Results

```
✓ solana wallet generation produces valid addresses (10 wallets tested)
✓ private key to address is deterministic
✓ solana address validation
✓ base58 encoding preserves leading zeros
✓ lamports conversion

Tests: 5 passed (85 assertions)
```

## 🔗 Resources

- **Full Documentation:** `SOLANA_INTEGRATION.md`
- **Solana Explorer (Devnet):** https://explorer.solana.com/?cluster=devnet
- **Solana Faucet:** https://faucet.solana.com
- **Solana Docs:** https://docs.solana.com/

---

**Need help?** Check `storage/logs/laravel.log` for detailed error messages and RPC responses.
