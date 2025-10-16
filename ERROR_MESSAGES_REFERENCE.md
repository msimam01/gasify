# Withdrawal Error Messages Reference

## Quick Reference: Technical Error → User Message Mapping

### Network & RPC Errors

| Technical Error Pattern | User-Friendly Message |
|------------------------|----------------------|
| `cURL error 28` | "Network temporarily unavailable. Please try again in a few moments." |
| `timeout` / `timed out` | "Network temporarily unavailable. Please try again in a few moments." |
| `RPC error` | "Unable to connect to blockchain network. Please try again later." |
| `connection failed` | "Unable to connect to blockchain network. Please try again later." |

### Balance & Funds Errors

| Technical Error Pattern | User-Friendly Message |
|------------------------|----------------------|
| `Insufficient funds` | "Insufficient funds on the blockchain. Please ensure your wallet has enough balance to cover the transaction and network fees." |
| `InsufficientFundsForFee` | "Not enough SOL to pay for transaction fees. Please add more SOL to your wallet." |
| `insufficient blockchain balance` | "Insufficient blockchain balance to complete this withdrawal." |

### Address & Validation Errors

| Technical Error Pattern | User-Friendly Message |
|------------------------|----------------------|
| `Invalid address` | "Invalid destination address. Please check the address and try again." |
| `invalid Solana address` | "Invalid Solana address format. Please verify the address." |
| `invalid Ethereum address` | "Invalid Ethereum address format. Please verify the address." |

### Transaction Errors

| Technical Error Pattern | User-Friendly Message |
|------------------------|----------------------|
| `blockhash not found` | "Transaction expired. Please try again." |
| `Blockhash expired` | "Transaction expired. Please try again." |
| `confirmation timeout` | "Transaction confirmation timed out. The transaction may still be processing on the blockchain." |
| `Signature verification failed` | "Wallet configuration error. Please contact support." |

### Wallet & Key Errors

| Technical Error Pattern | User-Friendly Message |
|------------------------|----------------------|
| `decrypt` / `DecryptException` | "Wallet configuration error. Please contact support." |
| `private key not found` | "Wallet configuration error. Please contact support." |
| `Invalid private key` | "Wallet configuration error. Please contact support." |

### Gas & Fee Errors (EVM)

| Technical Error Pattern | User-Friendly Message |
|------------------------|----------------------|
| `insufficient gas` | "Insufficient gas for transaction. Please try again with a higher gas limit." |
| `gas too low` | "Insufficient gas for transaction. Please try again with a higher gas limit." |
| `nonce too low` / `nonce too high` | "Transaction nonce error. Please try again." |

### Generic Fallback

| Scenario | User-Friendly Message |
|----------|----------------------|
| Unknown/Unmatched Error | "Unable to process withdrawal at this time. Please try again or contact support if the issue persists." |

## Implementation Locations

### 1. WalletController
**Method**: `mapExceptionToUserMessage()`
**File**: `app/Http/Controllers/WalletController.php`
**Lines**: 617-647

Handles exceptions thrown during withdrawal submission.

### 2. ProcessBlockchainWithdrawal Job
**Method**: `getHumanReadableError()`
**File**: `app/Jobs/ProcessBlockchainWithdrawal.php`
**Lines**: 370-421

Handles exceptions during blockchain transaction processing.

### 3. BlockchainException Class
**File**: `app/Exceptions/BlockchainException.php`

Custom exception class with built-in user message mapping.

## Usage Examples

### Example 1: Network Timeout
```
Technical Log:
"cURL error 28: Resolving timed out after 10000 milliseconds"

User Sees:
"Network temporarily unavailable. Please try again in a few moments."
```

### Example 2: Insufficient Balance
```
Technical Log:
"Insufficient blockchain balance for withdrawal. Have 0.05 SOL, need at least 0.1005 SOL including fees."

User Sees:
"Insufficient funds on the blockchain. Please ensure your wallet has enough balance to cover the transaction and network fees."
```

### Example 3: Invalid Address
```
Technical Log:
"Invalid Solana address format: xyz123"

User Sees:
"Invalid destination address. Please check the address and try again."
```

## Adding New Error Mappings

To add a new error mapping:

1. **Identify the technical error pattern** from logs
2. **Create user-friendly message** (clear, actionable, no jargon)
3. **Add to mapping function**:

```php
// In getHumanReadableError() or mapExceptionToUserMessage()
if (stripos($message, 'your_error_pattern') !== false) {
    return 'Your user-friendly message here.';
}
```

## Best Practices

### ✅ Good User Messages
- "Network temporarily unavailable. Please try again in a few moments."
- "Insufficient blockchain balance to complete this withdrawal."
- "Invalid destination address. Please check and try again."

### ❌ Bad User Messages
- "cURL error 28: Connection timeout"
- "RPC call failed with status 500"
- "Exception in SolanaService::sendTransaction()"

### Guidelines
1. **Be specific but simple**: Tell users what went wrong without technical details
2. **Be actionable**: Suggest what the user can do next
3. **Be reassuring**: For transient errors, mention they can try again
4. **Protect sensitive data**: Never expose private keys, internal paths, or system details
5. **Maintain consistency**: Use similar language patterns across all messages

## Testing Error Messages

### Manual Testing
```bash
# 1. Simulate network timeout (disconnect internet briefly)
# 2. Try withdrawal with insufficient balance
# 3. Try withdrawal with invalid address format
# 4. Check both frontend display and database storage
```

### Verification Checklist
- [ ] User sees friendly message in modal
- [ ] Technical error logged in laravel.log
- [ ] `failure_reason` in database contains user message only
- [ ] No stack traces visible to user
- [ ] Funds reverted on failure
