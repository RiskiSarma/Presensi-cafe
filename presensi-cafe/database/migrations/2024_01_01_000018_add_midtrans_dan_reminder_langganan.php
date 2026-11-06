<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('pembayaran_langganans', function (Blueprint $table) {
            $table->string('metode', 20)->default('transfer')->after('siklus'); // transfer | midtrans
            $table->string('midtrans_order_id')->nullable()->unique()->after('status');
            $table->string('snap_token')->nullable()->after('midtrans_order_id');
            $table->string('midtrans_transaction_id')->nullable()->after('snap_token');
            $table->string('midtrans_payment_type', 50)->nullable()->after('midtrans_transaction_id');
        });

        Schema::table('langganans', function (Blueprint $table) {
            $table->timestamp('reminder_3d_sent_at')->nullable();
            $table->timestamp('reminder_1d_sent_at')->nullable();
        });
    }

    public function down(): void
    {
        Schema::table('pembayaran_langganans', function (Blueprint $table) {
            $table->dropColumn(['metode', 'midtrans_order_id', 'snap_token', 'midtrans_transaction_id', 'midtrans_payment_type']);
        });
        Schema::table('langganans', function (Blueprint $table) {
            $table->dropColumn(['reminder_3d_sent_at', 'reminder_1d_sent_at']);
        });
    }
};
