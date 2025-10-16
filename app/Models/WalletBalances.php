<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class WalletBalances extends Model
{
    protected $fillable = [
        'user_id',
        'currency',
        'balance_minor',
        'reserved_minor',
        'token_balance',
        'reserved_token',
        'meta',
    ];

    protected $casts = [
        'meta' => 'array',
        'balance_minor' => 'integer',
        'reserved_minor' => 'integer',
        'token_balance' => 'decimal:18',
        'reserved_token' => 'decimal:18',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    // Helper methods for balance formatting
    public function getFormattedBalanceAttribute(): float
    {
        return $this->balance_minor / 100;
    }

    public function getAvailableBalanceAttribute(): float
    {
        return ($this->balance_minor - $this->reserved_minor) / 100;
    }

    public function getAvailableTokenAttribute()
    {
        return $this->token_balance - $this->reserved_token;
    }
}
