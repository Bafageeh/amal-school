<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('teacher_indicator_evidences', function (Blueprint $table) {
            $table->string('title', 160)->nullable()->after('indicator_no');
            $table->text('description')->nullable()->after('title');
        });
    }

    public function down(): void
    {
        Schema::table('teacher_indicator_evidences', function (Blueprint $table) {
            $table->dropColumn(['title', 'description']);
        });
    }
};
