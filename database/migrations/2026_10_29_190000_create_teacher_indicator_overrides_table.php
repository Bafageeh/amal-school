<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('teacher_indicator_overrides', function (Blueprint $table) {
            $table->id();
            $table->foreignId('school_id')->constrained('schools')->cascadeOnDelete();
            $table->unsignedTinyInteger('criterion_no');
            $table->unsignedTinyInteger('indicator_no');
            $table->string('title', 180)->nullable();
            $table->boolean('is_deleted')->default(false);
            $table->timestamps();
            $table->unique(['school_id', 'criterion_no', 'indicator_no'], 'teacher_indicator_override_unique');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('teacher_indicator_overrides');
    }
};
