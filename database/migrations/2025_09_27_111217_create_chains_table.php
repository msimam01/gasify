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
        Schema::create('chains', function (Blueprint $table) {
            $table->id();
            $table->string('slug')->unique(); // e.g. solana, ethereum
            $table->string('name');
            $table->string('symbol')->nullable(); // SOL, ETH
            $table->unsignedTinyInteger('decimals')->default(18);
            $table->string('logo')->nullable();
            $table->jsonb('metadata')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('chains');
    }
};
