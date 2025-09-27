<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('wallet_balances', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('currency', 10); // 'NGN', 'USD' or token symbol
            $table->bigInteger('balance_minor')->default(0); // fiat in kobo/cents
            $table->bigInteger('reserved_minor')->default(0);
            $table->decimal('token_balance', 38, 18)->default(0); // for token balances if needed
            $table->jsonb('meta')->nullable();
            $table->timestamps();

            $table->unique(['user_id','currency']);
            $table->index(['user_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('wallet_balances');
    }
};
