<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('mobile_api_tokens')) {
            Schema::create('mobile_api_tokens', function (Blueprint $table): void {
                $table->id();
                $table->unsignedBigInteger('user_id')->index();
                $table->string('token_hash', 64)->unique();
                $table->timestamp('last_used_at')->nullable();
                $table->timestamps();
            });
        }

        if (Schema::hasColumn('users', 'mobile_api_token_hash')) {
            $now = now();
            $tokens = DB::table('users')
                ->whereNotNull('mobile_api_token_hash')
                ->get(['id', 'mobile_api_token_hash', 'mobile_api_token_created_at']);

            foreach ($tokens as $token) {
                DB::table('mobile_api_tokens')->insertOrIgnore([
                    'user_id' => $token->id,
                    'token_hash' => $token->mobile_api_token_hash,
                    'created_at' => $token->mobile_api_token_created_at ?? $now,
                    'updated_at' => $now,
                ]);
            }
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('mobile_api_tokens');
    }
};
