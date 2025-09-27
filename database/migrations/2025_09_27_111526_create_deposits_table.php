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
        Schema::create('deposits', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('provider'); // paystack, flutterwave, bank
            $table->string('provider_reference')->nullable()->index();
            $table->bigInteger('amount_minor'); // NGN in kobo
            $table->string('currency', 10)->default('NGN');
            $table->enum('status', ['pending','completed','failed','cancelled'])->default('pending');
            $table->jsonb('meta')->nullable();
            $table->timestamps();

            $table->index(['user_id','status']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('deposits');
    }
};
