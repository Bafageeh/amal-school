<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
        Schema::create('teacher_indicator_evidences', function (Blueprint $table) {
            $table->id();
            $table->foreignId('school_id')->constrained('schools')->cascadeOnDelete();
            $table->foreignId('teacher_id')->constrained('users')->cascadeOnDelete();
            $table->unsignedTinyInteger('criterion_no');
            $table->unsignedTinyInteger('indicator_no');
            $table->string('original_name');
            $table->string('file_path');
            $table->string('mime_type', 130)->nullable();
            $table->timestamps();
            $table->index(['school_id', 'teacher_id', 'criterion_no', 'indicator_no'], 'teacher_indicator_lookup');
        });

        Schema::create('teacher_criterion_ratings', function (Blueprint $table) {
            $table->id();
            $table->foreignId('school_id')->constrained('schools')->cascadeOnDelete();
            $table->foreignId('teacher_id')->constrained('users')->cascadeOnDelete();
            $table->unsignedTinyInteger('criterion_no');
            $table->unsignedTinyInteger('rating');
            $table->foreignId('rated_by')->constrained('users')->restrictOnDelete();
            $table->timestamps();
            $table->unique(['teacher_id', 'criterion_no'], 'teacher_criterion_unique');
        });
    }
    public function down(): void {
        Schema::dropIfExists('teacher_criterion_ratings');
        Schema::dropIfExists('teacher_indicator_evidences');
    }
};
