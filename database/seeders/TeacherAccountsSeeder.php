<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;

class TeacherAccountsSeeder extends Seeder
{
    /**
     * Create teacher accounts from the provided names without passwords.
     */
    public function run(): void
    {
        if (! Schema::hasTable('users')) {
            return;
        }

        $schoolId = $this->getSchoolId();

        $teachers = [
            'أسماء ماجد المطيري',
            'أماني شاكر الشيخ',
            'انتصار عوض العرام',
            'ايمان حذيفه الصبحي',
            'بدريه سعيد العمري',
            'حنان سالم الغامدي',
            'رجاء عبد العزيز سرحان',
            'رنده محمود المنصوري',
            'رينه عبد العزيز شيخ',
            'شريفة علي الغامدي',
            'عبير صالح الزهراني',
            'عبير محمد ولي خان',
            'عليا سند المطيري',
        ];

        foreach ($teachers as $index => $name) {
            $email = 'teacher'.str_pad((string) ($index + 1), 3, '0', STR_PAD_LEFT).'@teachers.local';

            $payload = [
                'name' => $name,
                'username' => $name,
                'email' => $email,
                'password' => '',
                'role' => 'teacher',
                'updated_at' => now(),
            ];

            if (Schema::hasColumn('users', 'school_id')) {
                $payload['school_id'] = $schoolId;
            }

            $existing = DB::table('users')
                ->where('username', $name)
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

        $schoolId = DB::table('users')
            ->where('role', 'principal')
            ->whereNotNull('school_id')
            ->value('school_id');

        if ($schoolId) {
            return (int) $schoolId;
        }

        $schoolId = DB::table('schools')->value('id');

        if ($schoolId) {
            return (int) $schoolId;
        }

        return (int) DB::table('schools')->insertGetId([
            'name' => 'مدرسة أمل',
            'city' => null,
            'district' => null,
            'created_at' => now(),
            'updated_at' => now(),
        ]);
    }
}
