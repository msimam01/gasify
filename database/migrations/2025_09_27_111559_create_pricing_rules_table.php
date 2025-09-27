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
        Schema::create('pricing_rules', function (Blueprint $table) {
            $table->id();
            $table->foreignId('chain_id')->constrained('chains')->cascadeOnDelete();
            $table->decimal('percent_fee', 6, 4)->default(0.0150); // 1.5% -> 0.0150
            $table->bigInteger('flat_fee_minor')->default(0); // fixed NGN in kobo
            $table->boolean('auto_pricing')->default(true);
            $table->jsonb('meta')->nullable();
            $table->timestamps();

            $table->unique(['chain_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('pricing_rules');
    }
};
