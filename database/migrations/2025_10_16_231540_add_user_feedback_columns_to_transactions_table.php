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
        Schema::table('transactions', function (Blueprint $table) {
            $table->text('failure_reason')->nullable()->after('status');
            $table->string('tx_hash')->nullable()->after('failure_reason');
            $table->string('explorer_url')->nullable()->after('tx_hash');
            $table->timestamp('completed_at')->nullable()->after('explorer_url');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('transactions', function (Blueprint $table) {
            $table->dropColumn(['failure_reason', 'tx_hash', 'explorer_url', 'completed_at']);
        });
    }
};
