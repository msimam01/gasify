# Wallet System Documentation

## Overview
A complete wallet management system for the Laravel + React (Inertia.js) application with the following features:

## Features Implemented

### 1. Wallet Balance Display
- Shows user's wallet balances for different currencies (NGN, USD)
- Balance visibility toggle (hide/show balance)
- Displays total balance, reserved amount, and available balance
- Supports both fiat currencies (stored in minor units) and tokens

### 2. Recent Transactions
- Displays the last 10 transactions
- Shows transaction type, amount, currency, and timestamp
- Color-coded transaction types (green for deposits, red for withdrawals, etc.)
- Transaction reference numbers for tracking

### 3. Top Up Functionality
- Multiple payment methods (Opay, Paystack, Flutterwave)
- Stripe integration (coming soon - disabled with proper labeling)
- Quick amount selection buttons (₦1,000 to ₦50,000)
- Transaction summary before processing
- Form validation and error handling
- Disabled state for unavailable payment methods

### 4. Navigation Integration
- Added "My Wallet" link to the sidebar navigation
- Proper breadcrumb navigation
- Seamless integration with existing app layout

## Database Structure

### Tables Created
1. **wallet_balances** - Stores user wallet balances
2. **transactions** - Records all wallet transactions
3. **user_wallets** - Manages user wallet addresses (for crypto wallets)

### Models
- `WalletBalances` - Handles wallet balance operations
- `Transactions` - Manages transaction records
- `UserWallets` - Manages wallet addresses

## Files Created/Modified

### Backend (Laravel)
- `app/Http/Controllers/WalletController.php` - Main wallet controller
- `app/Models/WalletBalances.php` - Wallet balance model
- `app/Models/Transactions.php` - Transaction model
- `app/Models/UserWallets.php` - User wallets model
- `app/Models/User.php` - Added wallet relationships
- `routes/web.php` - Added wallet routes
- `database/seeders/WalletSeeder.php` - Sample data seeder

### Frontend (React)
- `resources/js/pages/Wallet/Index.tsx` - Main wallet page
- `resources/js/pages/Wallet/Topup.tsx` - Top up page

### Routes
- `GET /wallet` - Main wallet page
- `GET /topup` - Top up page
- `POST /wallet/topup/process` - Process top up form

## Usage

### Accessing the Wallet
1. Navigate to the sidebar and click "My Wallet"
2. View your current balances and recent transactions
3. Use the eye icon to toggle balance visibility

### Topping Up
1. Click the "Top Up Wallet" button
2. Enter the amount you want to add
3. Select a payment method
4. Review the transaction summary
5. Click "Proceed to Payment"

### Sample Data
Run the seeder to add sample wallet data:
```bash
php artisan db:seed --class=WalletSeeder
```

## Security Features
- Authentication required for all wallet operations
- Input validation on all forms
- CSRF protection on form submissions
- Balance amounts stored in minor units to prevent floating point issues

## Payment Methods

### Available Payment Methods
1. **Opay** - Pay with your Opay wallet
2. **Paystack** - Pay with cards via Paystack
3. **Flutterwave** - Pay with cards via Flutterwave

### Coming Soon
- **Stripe** - Disabled with "Coming Soon" label

## Future Enhancements
- Complete payment gateway integration for all methods
- Withdrawal functionality
- Transaction filtering and search
- Export transaction history
- Multi-currency conversion
- Real-time balance updates
- Transaction notifications
- Stripe payment integration

## Technical Notes
- Amounts are stored in minor units (kobo for NGN, cents for USD) to avoid floating point precision issues
- The system supports both fiat currencies and token balances
- All transactions are logged with before/after balance snapshots
- The UI is fully responsive and follows the existing design system