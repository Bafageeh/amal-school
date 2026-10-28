<?php

namespace App\Console\Commands;

use App\Models\School;
use App\Models\User;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use JsonException;

class SyncTeachers1448 extends Command
{
    protected $signature = 'teachers:sync-1448
        {--principal=admin@amal.pm.sa : Principal email used to locate the school}
        {--school-id= : Explicit school ID instead of principal email}
        {--apply : Save changes; otherwise preview only}';

    protected $description = 'Synchronize the final 30-teacher 1448 roster safely, preserving existing accounts and evidence';

    public function handle(): int
    {
        $file = database_path('data/teachers_1448.json');

        try {
            $payload = json_decode(file_get_contents($file), true, 512, JSON_THROW_ON_ERROR);
        } catch (JsonException $e) {
            $this->error('تعذر قراءة ملف أسماء المعلمات: '.$e->getMessage());
            return self::FAILURE;
        }

        $names = $payload['teachers'] ?? [];

        if (!is_array($names) || count($names) !== 30 ||
            count(array_filter($names, fn ($n) => is_string($n) && trim($n) !== '')) !== 30) {
            $this->error('القائمة غير مكتملة؛ المتوقع 30 اسمًا.');
            return self::FAILURE;
        }

        $keys = array_map(fn ($name) => $this->normalize($name), $names);
        if (count(array_unique($keys)) !== count($names)) {
            $this->error('هناك أسماء مكررة بعد توحيد الحروف العربية؛ لم تُنفّذ أي تغييرات.');
            return self::FAILURE;
        }

        $school = $this->option('school-id')
            ? School::find($this->option('school-id'))
            : User::where('email', $this->option('principal'))
                ->where('role', 'principal')
                ->first()?->school;

        if (!$school) {
            $this->error('لم تُحدد مدرسة صالحة. استخدم --school-id=رقم_المدرسة.');
            return self::FAILURE;
        }

        $existing = User::withTrashed()
            ->where('school_id', $school->id)
            ->where('role', 'teacher')
            ->get();

        $byName = $existing->groupBy(fn ($user) => $this->normalize($user->name));

        $matched = [];
        $toCreate = [];
        $matchedIds = [];
        $reviveCount = 0;
        $renameCount = 0;

        foreach ($names as $name) {
            $matches = $byName->get($this->normalize($name), collect());

            if ($matches->count() > 1) {
                $this->error('توجد حسابات متطابقة بالاسم: '.$name.'. يرجى معالجتها يدويًا أولًا.');
                return self::FAILURE;
            }

            if ($matches->isEmpty()) {
                $toCreate[] = $name;
                continue;
            }

            $user = $matches->first();
            $matched[] = [$user, $name];
            $matchedIds[] = $user->id;
            if ($user->trashed()) $reviveCount++;
            if ($user->name !== $name) $renameCount++;
        }

        $toArchive = $existing->filter(fn ($user) =>
            !$user->trashed() && !in_array($user->id, $matchedIds, true)
        );

        $this->info('المدرسة: '.$school->name.' (ID: '.$school->id.')');
        $this->line('العدد المطلوب: '.count($names));
        $this->line('حسابات مطابقة محفوظة: '.count($matched));
        $this->line('حسابات جديدة: '.count($toCreate));
        $this->line('حسابات تُستعاد من الأرشيف: '.$reviveCount);
        $this->line('تصحيحات إملائية: '.$renameCount);
        $this->line('حسابات قديمة ستُؤرشف: '.$toArchive->count());

        if ($toArchive->isNotEmpty()) {
            $this->warn('أسماء الحسابات التي ستُؤرشف:');
            foreach ($toArchive as $user) {
                $this->line(' - '.$user->name.' ('.$user->username.')');
            }
        }

        if (!$this->option('apply')) {
            $this->comment('معاينة فقط؛ لم تُغيّر قاعدة البيانات. للتنفيذ أعد الأمر مع --apply.');
            return self::SUCCESS;
        }

        DB::transaction(function () use ($school, $matched, $toCreate, $toArchive) {
            $sequence = 1;

            foreach ($matched as [$user, $name]) {
                if ($user->trashed()) {
                    $user->restore();
                }
                $user->name = $name;
                if (blank($user->username)) {
                    $user->username = $this->nextUsername($school->id, $sequence);
                    $user->email = $user->username.'@teachers.local';
                }
                $user->save();
            }

            foreach ($toCreate as $name) {
                $username = $this->nextUsername($school->id, $sequence);
                User::create([
                    'school_id' => $school->id,
                    'role' => 'teacher',
                    'name' => $name,
                    'username' => $username,
                    'email' => $username.'@teachers.local',
                    'password' => Hash::make(Str::random(48)),
                ]);
            }

            foreach ($toArchive as $user) {
                $user->delete();
            }
        });

        $active = User::where('school_id', $school->id)->where('role', 'teacher')->count();
        $this->info('تمت المزامنة. عدد حسابات المعلمات النشطة: '.$active);
        $this->warn('الحسابات الجديدة تحتاج أن تضبط المديرة رقمًا سريًا من 4 خانات لكل حساب.');
        $this->info('لم تُحذف ملفات الشواهد أو سجلاتها.');

        return self::SUCCESS;
    }

    private function nextUsername(int $schoolId, int &$sequence): string
    {
        do {
            $username = 's'.$schoolId.'_1448_'.str_pad((string) $sequence++, 3, '0', STR_PAD_LEFT);
            $taken = User::withTrashed()
                ->where('username', $username)
                ->orWhere('email', $username.'@teachers.local')
                ->exists();
        } while ($taken);

        return $username;
    }

    private function normalize(string $name): string
    {
        $name = preg_replace('/[\x{064B}-\x{065F}\x{0670}\x{0640}]/u', '', $name);
        $name = str_replace(['أ', 'إ', 'آ', 'ٱ', 'ى', 'ة'], ['ا', 'ا', 'ا', 'ا', 'ي', 'ه'], $name);
        return trim(preg_replace('/\s+/u', ' ', $name));
    }
}
