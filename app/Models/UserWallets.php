<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class UserWallets extends Model
{
    protected $fillable = [
        'user_id',
        'address',
        'chain_id',
        'label',
        'is_primary',
        'meta',
    ];

    protected $casts = [
        'meta' => 'array',
        'is_primary' => 'boolean',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function chain(): BelongsTo
    {
        return $this->belongsTo(Chains::class);
    }
}
