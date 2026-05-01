<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('users')) {
            return;
        }

        if (! Schema::hasColumn('users', 'username')) {
            DB::statement('ALTER TABLE users ADD username VARCHAR(255) NULL UNIQUE AFTER name');
        }

        if (! Schema::hasColumn('users', 'role')) {
            DB::statement("ALTER TABLE users ADD role VARCHAR(50) NOT NULL DEFAULT 'teacher' AFTER password");
        }

        if (! Schema::hasColumn('users', 'school_id')) {
            DB::statement('ALTER TABLE users ADD school_id BIGINT UNSIGNED NULL AFTER id');
        }

        DB::statement('ALTER TABLE users MODIFY password VARCHAR(255) NULL');

        $schoolId = $this->getSchoolId();

        for ($i = 1; $i <= 30; $i++) {
            $number = str_pad((string) $i, 2, '0', STR_PAD_LEFT);
            $username = 'teacher' . $number;
            $email = $username . '@teachers.local';

            $payload = [
                'name' => 'معلمة ' . $number,
                'username' => $username,
                'email' => $email,
                'password' => null,
                'role' => 'teacher',
                'updated_at' => now(),
            ];

            if (Schema::hasColumn('users', 'school_id')) {
                $payload['school_id'] = $schoolId;
            }

            $existing = DB::table('users')
                ->where('username', $username)
                ->orWhere('email', $email)
                ->first();

            if ($existing) {
                DB::table('users')->where('id', $existing->id)->update($payload);
                continue;
            }

            $payload['created_at'] = now();
            DB::table('users')->insert($payload);
        }
    }

    private function getSchoolId(): ?int
    {
        if (! Schema::hasTable('schools')) {
            return DB::table('users')->where('role', 'principal')->value('school_id');
        }

        $principalSchoolId = DB::table('users')
            ->where('role', 'principal')
            ->whereNotNull('school_id')
            ->value('school_id');

        if ($principalSchoolId) {
            return (int) $principalSchoolId;
        }

        $schoolId = DB::table('schools')->value('id');

        if ($schoolId) {
            return (int) $schoolId;
        }

        return (int) DB::table('schools')->insertGetId([
            'name' => 'مدرسة آمال',
            'city' => null,
            'district' => null,
            'created_at' => now(),
            'updated_at' => now(),
        ]);
    }

    public function down(): void
    {
        if (! Schema::hasTable('users')) {
            return;
        }

        DB::table('users')
            ->where('role', 'teacher')
            ->where(function ($query) {
                for ($i = 1; $i <= 30; $i++) {
                    $query->orWhere('username', 'teacher' . str_pad((string) $i, 2, '0', STR_PAD_LEFT));
                }
            })
            ->delete();
    }
};
