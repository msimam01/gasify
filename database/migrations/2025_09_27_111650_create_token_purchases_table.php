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
        Schema::create('token_purchases', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('chain_id')->constrained('chains')->cascadeOnDelete();
            $table->decimal('token_amount', 38, 18); // amount of token user receives
            $table->unsignedBigInteger('token_amount_native')->nullable(); // amount in smallest unit
            $table->bigInteger('amount_paid_minor'); // NGN in kobo (total charged)
            $table->decimal('unit_price_usd', 24, 12); // price per token in USD at purchase time
            $table->bigInteger('system_fee_minor')->default(0); // fee in kobo
            $table->enum('status', ['pending','processing','completed','failed','refunded'])->default('pending');
            $table->string('destination_address');
            $table->string('tx_hash')->nullable()->index();
            $table->jsonb('meta')->nullable();
            $table->timestamps();

            $table->index(['user_id','status','created_at']);
            // $table->index(['tx_hash']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('token_purchases');
    }
};
