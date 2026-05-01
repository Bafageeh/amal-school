<?php

namespace Database\Seeders;

use App\Models\School;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class InitialAdminSeeder extends Seeder
{
    public function run(): void
    {
        $school = School::firstOrCreate(
            ['name' => 'مدرسة أمل'],
            [
                'city' => 'جدة',
                'district' => null,
            ]
        );

        User::updateOrCreate(
            ['email' => 'admin@amal.pm.sa'],
            [
                'school_id' => $school->id,
                'name' => 'مديرة المدرسة',
                'password' => Hash::make('123456'),
                'role' => 'principal',
            ]
        );
    }
}
