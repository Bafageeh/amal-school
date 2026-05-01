<?php

namespace Database\Seeders;

use App\Models\School;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class TeacherAccountsSeeder extends Seeder
{
    /**
     * Create teacher accounts from the provided names without passwords.
     */
    public function run(): void
    {
        $schoolId = User::query()
            ->where('role', 'principal')
            ->whereNotNull('school_id')
            ->value('school_id');

        if (! $schoolId) {
            $schoolId = School::query()->value('id');
        }

        if (! $schoolId) {
            $schoolId = School::query()->create([
                'name' => 'مدرسة أمل',
                'city' => null,
                'district' => null,
            ])->id;
        }

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

            $user = User::query()->firstOrNew([
                'username' => $name,
            ]);

            $user->school_id = $schoolId;
            $user->name = $name;
            $user->email = $user->exists ? $user->email : $email;
            $user->role = 'teacher';

            if (! $user->exists) {
                $user->password = null;
                $user->remember_token = Str::random(10);
            }

            $user->save();
        }
    }
}
