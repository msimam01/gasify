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
        Schema::create('kyc_records', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->enum('status', ['pending','approved','rejected'])->default('pending');
            $table->string('provider')->nullable();
            $table->string('provider_reference')->nullable();
            $table->jsonb('response')->nullable();
            $table->jsonb('documents')->nullable(); // store file refs / paths
            $table->timestamps();

            $table->index(['user_id','status']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('kyc_records');
    }
};
