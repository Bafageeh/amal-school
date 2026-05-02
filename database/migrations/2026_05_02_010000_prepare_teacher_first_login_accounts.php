<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('users')) {
            return;
        }

        Schema::table('users', function (Blueprint $table) {
            if (! Schema::hasColumn('users', 'username')) {
                $table->string('username')->nullable();
            }

            if (! Schema::hasColumn('users', 'role')) {
                $table->string('role')->default('teacher');
            }

            if (! Schema::hasColumn('users', 'school_id')) {
                $table->unsignedBigInteger('school_id')->nullable();
            }
        });

        DB::table('users')
            ->whereNull('password')
            ->update(['password' => '']);
    }

    public function down(): void
    {
        // Keep user accounts and columns intentionally.
    }
};
