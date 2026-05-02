<?php

use Database\Seeders\TeacherAccountsSeeder;
use Illuminate\Database\Migrations\Migration;

return new class extends Migration
{
    public function up(): void
    {
        app(TeacherAccountsSeeder::class)->run();
    }

    public function down(): void
    {
        // Keep generated accounts.
    }
};
