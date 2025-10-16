<?php

use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use App\Http\Controllers\WalletController;

Route::get('/', function () {
    return Inertia::render('welcome');
})->name('home');

Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('dashboard', function () {
        return Inertia::render('dashboard');
    })->name('dashboard');

    // Wallet routes
    Route::get('wallet', [WalletController::class, 'index'])->name('wallet');
    Route::get('topup', [WalletController::class, 'topup'])->name('topup');
    Route::get('withdraw', [WalletController::class, 'withdraw'])->name('withdraw');
    Route::post('wallet/topup/process', [WalletController::class, 'processTopup'])->name('wallet.topup.process');
    Route::post('wallet/withdraw/process', [WalletController::class, 'processWithdrawal'])->name('wallet.withdraw.process');
    Route::post('wallet/solana/request-devnet-tokens', [WalletController::class, 'requestDevnetTokens'])->name('wallet.solana.request-devnet-tokens');
});

require __DIR__.'/settings.php';
require __DIR__.'/auth.php';
