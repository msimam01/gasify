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
        Schema::create('transactions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->nullable()->constrained()->nullOnDelete();
            $table->enum('type', ['deposit','withdrawal','purchase','fee','refund','admin_adjustment']);
            $table->string('currency', 10); // NGN or token symbol
            $table->bigInteger('amount_minor')->nullable(); // for fiat
            $table->decimal('amount_token', 38, 18)->nullable();
            $table->bigInteger('balance_before_minor')->nullable();
            $table->bigInteger('balance_after_minor')->nullable();
            $table->string('reference')->nullable()->index(); // link to deposits/purchases
            $table->jsonb('meta')->nullable();
            $table->timestamps();

            $table->index(['user_id','type','created_at']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('transactions');
    }
};
