<?php

namespace App\Console\Commands;

use App\Models\User;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use RuntimeException;

class ResetSchoolTeacherPins extends Command
{
    protected $signature = 'teachers:reset-pins {--school-id=1} {--apply}';
    protected $description = 'Set distinct random four-digit PINs on the 30 approved teacher accounts; print once to the secure operator console.';

    public function handle(): int
    {
        $schoolId = (int) $this->option('school-id');
        $expected = array_map(fn (int $n) => sprintf('teacher-%02d', $n), range(1, 30));
        $users = User::where('school_id', $schoolId)
            ->where('role', 'teacher')
            ->whereIn('username', $expected)
            ->orderBy('username')->get();

        if ($users->count() !== 30 || $users->pluck('username')->values()->all() !== $expected) {
            $this->error('Accounts are not exactly teacher-01 through teacher-30. No changes made.');
            return self::FAILURE;
        }

        if (! $this->option('apply')) {
            $this->info('Validated 30 teacher accounts in school '.$schoolId.'. No changes made. Use --apply to reset.');
            return self::SUCCESS;
        }

        $output = DB::transaction(function () use ($schoolId, $expected) {
            $teachers = User::where('school_id', $schoolId)
                ->where('role', 'teacher')
                ->whereIn('username', $expected)
                ->orderBy('username')->lockForUpdate()->get();

            if ($teachers->pluck('username')->values()->all() !== $expected) {
                throw new RuntimeException('Teacher roster changed during the reset.');
            }

            $used = [];
            $rows = [];
            foreach ($teachers as $teacher) {
                do {
                    $pin = (string) random_int(1000, 9999);
                } while (isset($used[$pin]) || in_array($pin, ['1234', '4321', '1111', '2222', '3333', '4444', '5555', '6666', '7777', '8888', '9999'], true));
                $used[$pin] = true;
                $teacher->password = Hash::make($pin);
                $teacher->save();
                if (! Hash::check($pin, $teacher->fresh()->password)) {
                    throw new RuntimeException('PIN verification failed; transaction rolled back.');
                }
                $rows[] = [$teacher->id, $teacher->name, $teacher->username, $pin];
            }
            return $rows;
        });

        $this->info('RESET_COMPLETED='.count($output));
        foreach ($output as $row) {
            $this->line(implode("\t", $row));
        }
        return self::SUCCESS;
    }
}
