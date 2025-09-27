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
        Schema::create('referrals', function (Blueprint $table) {
            $table->id();
            $table->foreignId('referrer_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('referred_id')->constrained('users')->cascadeOnDelete();
            $table->decimal('commission_percent', 5, 2)->default(0.00);
            $table->bigInteger('commission_earned_minor')->default(0);
            $table->enum('status', ['pending','paid','cancelled'])->default('pending');
            $table->jsonb('meta')->nullable();
            $table->timestamps();

            $table->unique(['referrer_id','referred_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('referrals');
    }
};
