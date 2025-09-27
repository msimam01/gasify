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
        Schema::create('hot_wallet_reconciliations', function (Blueprint $table) {
            $table->id();
            $table->foreignId('master_wallet_id')->constrained('master_wallets')->cascadeOnDelete();
            $table->decimal('onchain_balance', 38, 18)->default(0);
            $table->unsignedBigInteger('onchain_balance_native')->nullable();
            $table->decimal('book_balance', 38, 18)->default(0);
            $table->unsignedBigInteger('book_balance_native')->nullable();
            $table->enum('status', ['ok','mismatch'])->default('ok');
            $table->jsonb('diff')->nullable();
            $table->timestamps();

            $table->index(['master_wallet_id','status']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('hot_wallet_reconciliations');
    }
};
