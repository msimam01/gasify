<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Transactions extends Model
{
    protected $fillable = [
        'user_id',
        'type',
        'currency',
        'amount_minor',
        'amount_token',
        'balance_before_minor',
        'balance_after_minor',
        'reference',
        'meta',
    ];

    protected $casts = [
        'meta' => 'array',
        'amount_minor' => 'integer',
        'amount_token' => 'decimal:18',
        'balance_before_minor' => 'integer',
        'balance_after_minor' => 'integer',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    // Helper method for formatted amount
    public function getFormattedAmountAttribute(): float
    {
        return $this->amount_minor ? $this->amount_minor / 100 : (float) $this->amount_token;
    }

    // Get transaction type display name
    public function getTypeDisplayAttribute(): string
    {
        return match($this->type) {
            'deposit' => 'Deposit',
            'withdrawal' => 'Withdrawal',
            'purchase' => 'Purchase',
            'fee' => 'Fee',
            'refund' => 'Refund',
            'admin_adjustment' => 'Admin Adjustment',
            default => ucfirst($this->type),
        };
    }
}
