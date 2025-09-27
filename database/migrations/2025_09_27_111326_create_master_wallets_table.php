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
        Schema::create('master_wallets', function (Blueprint $table) {
            $table->id();
            $table->foreignId('chain_id')->constrained('chains')->cascadeOnDelete();
            $table->string('address')->unique();
            $table->string('label')->nullable();
            $table->jsonb('meta')->nullable();
            $table->decimal('estimated_balance', 38, 18)->default(0); // human friendly
            $table->unsignedBigInteger('estimated_balance_native')->nullable(); // e.g. lamports/wei
            $table->index(['chain_id']);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('master_wallets');
    }
};
