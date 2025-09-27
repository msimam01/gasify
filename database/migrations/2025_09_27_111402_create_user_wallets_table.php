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
        Schema::create('user_wallets', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('address');
            $table->foreignId('chain_id')->constrained('chains')->cascadeOnDelete();
            $table->string('label')->nullable();
            $table->boolean('is_primary')->default(false);
            $table->jsonb('meta')->nullable();
            $table->timestamps();

            $table->unique(['user_id','address','chain_id']);
            $table->index(['user_id','chain_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('user_wallets');
    }
};
