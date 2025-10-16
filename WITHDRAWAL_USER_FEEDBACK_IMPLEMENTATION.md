# Withdrawal System User Feedback Implementation

## Overview
This document describes the implementation of real-time user feedback for blockchain withdrawals, providing users with clear status updates and human-readable error messages.

## Architecture

### 1. Response Structure
All withdrawal endpoints now return a standardized JSON response:

```json
{
  "status": "processing|completed|failed",
  "message": "User-friendly status message",
  "transaction_id": 123,
  "explorer_url": "https://explorer.solana.com/tx/...",
  "error": "Human-readable error message (if failed)"
}
```

### 2. Components Created

#### Events
- **`WithdrawalStatusUpdated`** (`app/Events/WithdrawalStatusUpdated.php`)
  - Broadcasts real-time updates to users via WebSocket
  - Triggered when withdrawal status changes (processing → completed/failed)
  - Sends to private channel: `user.{user_id}`

#### Notifications
- **`WithdrawalCompleted`** (`app/Notifications/WithdrawalCompleted.php`)
  - Sent when withdrawal successfully completes
  - Includes explorer URL for blockchain verification
  - Delivered via database and email

- **`WithdrawalFailed`** (`app/Notifications/WithdrawalFailed.php`)
  - Sent when withdrawal fails
  - Includes human-readable error message
  - Funds automatically returned to user balance

#### Controller Updates
- **`WalletController::processWithdrawal()`**
  - Returns structured JSON response immediately
  - Maps exceptions to user-friendly messages
  - Logs technical details for debugging

- **`WalletController::getWithdrawalStatus()`**
  - New API endpoint for polling withdrawal status
  - Route: `GET /api/withdrawal-status/{id}`
  - Returns current status with appropriate message

#### Job Updates
- **`ProcessBlockchainWithdrawal`**
  - Broadcasts events on status changes
  - Sends notifications to users
  - Maps blockchain errors to readable messages
  - Logs full technical details for debugging

### 3. Error Mapping

#### Network Errors
| Technical Error | User Message |
|----------------|--------------|
| cURL timeout | "Network temporarily unavailable. Please try again in a few moments." |
| RPC connection failed | "Unable to connect to blockchain network. Please try again later." |

#### Balance Errors
| Technical Error | User Message |
|----------------|--------------|
| Insufficient funds | "Insufficient blockchain balance to complete this withdrawal." |
| InsufficientFundsForFee | "Not enough SOL to pay for transaction fees. Please add more SOL to your wallet." |

#### Transaction Errors
| Technical Error | User Message |
|----------------|--------------|
| Invalid address | "Invalid destination address. Please check and try again." |
| Blockhash not found | "Transaction expired. Please try again." |
| Signature verification failed | "Wallet configuration error. Please contact support." |

### 4. User Flow

#### Successful Withdrawal
1. User submits withdrawal form
2. Controller responds immediately:
   ```json
   {
     "status": "processing",
     "message": "Withdrawal initiated successfully. Transaction is being processed.",
     "transaction_id": 123
   }
   ```
3. Frontend shows modal with "Processing" state
4. Frontend polls `/api/withdrawal-status/123` every 3 seconds
5. Job processes transaction on blockchain
6. Job broadcasts `WithdrawalStatusUpdated` event
7. Job sends `WithdrawalCompleted` notification
8. Polling detects status change to "completed"
9. Frontend shows success message with explorer link

#### Failed Withdrawal
1. User submits withdrawal form
2. Controller responds immediately (same as above)
3. Frontend shows modal with "Processing" state
4. Job encounters error (e.g., network timeout)
5. Job maps error to user-friendly message
6. Job broadcasts `WithdrawalStatusUpdated` event with error
7. Job sends `WithdrawalFailed` notification
8. Job reverts reserved balance
9. Polling detects status change to "failed"
10. Frontend shows error message
11. User's funds are back in their wallet

### 5. Logging Strategy

#### User-Facing Logs
- Stored in `transactions.failure_reason` column
- Human-readable messages only
- No technical details or stack traces

#### Developer Logs (laravel.log)
- Full exception messages
- Complete stack traces
- RPC request/response details
- Balance calculations
- All technical debugging information

Example log entry:
```
[2025-10-16 22:59:44] local.ERROR: Withdrawal failed: cURL error 28
{
  "user_id": 2,
  "withdrawal_id": 14,
  "human_readable_error": "Network temporarily unavailable. Please try again in a few moments.",
  "raw_error": "cURL error 28: Resolving timed out after 10000 milliseconds",
  "trace": "..."
}
```

### 6. Frontend Implementation

#### Polling Logic
- Polls every 3 seconds after submission
- Stops polling when status is "completed" or "failed"
- Continues polling on network errors (doesn't give up)
- Updates UI in real-time based on status

#### Modal States
- **Processing**: Shows spinner, "Transaction is being processed"
- **Completed**: Shows checkmark, success message, explorer link
- **Failed**: Shows error icon, human-readable error message

### 7. Optional: WebSocket Broadcasting

To enable real-time updates without polling:

1. Configure Laravel Broadcasting in `config/broadcasting.php`
2. Set up Pusher, Ably, or Laravel WebSockets
3. Update `.env` with broadcast credentials
4. Frontend will receive instant updates via WebSocket

Example frontend code:
```typescript
Echo.private(`user.${userId}`)
  .listen('.withdrawal.status.updated', (e) => {
    setTransactionStatus(e.status);
    setStatusMessage(e.message);
    setExplorerUrl(e.explorer_url);
    setErrorMessage(e.error);
  });
```

### 8. Testing Recommendations

#### Test Cases
1. **Successful withdrawal**: Verify explorer URL is shown
2. **Network timeout**: Verify user sees "Network temporarily unavailable"
3. **Insufficient balance**: Verify user sees balance error
4. **Invalid address**: Verify user sees address validation error
5. **Polling**: Verify status updates appear without page refresh
6. **Balance revert**: Verify funds return on failure

#### Manual Testing
```bash
# Start queue worker
php artisan queue:work --queue=withdrawals

# Monitor logs in real-time
tail -f storage/logs/laravel.log

# Test withdrawal via frontend
# Check database for status updates
```

### 9. Database Schema Requirements

Ensure `transactions` table has these columns:
- `status` (enum: pending, processing, completed, failed)
- `failure_reason` (text, nullable) - User-friendly error message
- `tx_hash` (string, nullable) - Blockchain transaction hash
- `explorer_url` (string, nullable) - Blockchain explorer URL
- `completed_at` (timestamp, nullable)

### 10. Security Considerations

- All technical errors are logged server-side only
- User messages never expose sensitive data (private keys, internal paths)
- Stack traces never sent to frontend
- API endpoints require authentication
- Withdrawal status only accessible to transaction owner

## Summary

This implementation provides:
✅ Immediate feedback when withdrawal is initiated
✅ Real-time status updates via polling (or WebSocket)
✅ Human-readable error messages for all failure scenarios
✅ Blockchain explorer links for successful transactions
✅ Complete technical logging for debugging
✅ Automatic balance reversion on failures
✅ Email and database notifications

Users now have full visibility into their withdrawal status without seeing technical jargon, while developers retain all necessary debugging information in the logs.
