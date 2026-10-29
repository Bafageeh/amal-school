<?php

/**
 * Run manually on the deployed server:
 * php tests/Manual/teacher_indicator_management_smoke.php
 *
 * All sample overrides are created in an SQL transaction and rolled back.
 */
require __DIR__.'/../../vendor/autoload.php';

$app = require __DIR__.'/../../bootstrap/app.php';
$app->make(\Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use App\Support\TeacherAssessmentIndicators;
use Illuminate\Support\Facades\DB;

$base = config('teacher_assessment', []);
$assert = static function (bool $condition, string $message): void {
    if (! $condition) {
        throw new RuntimeException($message);
    }
};

$assert(count($base) === 11, 'Expected 11 configured criteria');
$assert(array_sum(array_map(fn ($row) => count($row['indicators']), $base)) === 49, 'Expected 49 indicators');
$assert(TeacherAssessmentIndicators::isOriginal(2, 4), 'Sparse indicator ID 2:4 not recognized');
$assert(! TeacherAssessmentIndicators::isOriginal(2, 2), 'Removed indicator 2:2 should not be restored');

$schoolId = 1;
DB::beginTransaction();

try {
    $before = DB::table('teacher_indicator_evidences')->where('school_id', $schoolId)->count();
    $identity = ['school_id' => $schoolId, 'criterion_no' => 2, 'indicator_no' => 4];

    DB::table('teacher_indicator_overrides')->updateOrInsert($identity, [
        'title' => 'مسمى تجريبي مؤقت',
        'is_deleted' => false,
        'updated_at' => now(),
    ]);
    $renamed = TeacherAssessmentIndicators::forSchool($schoolId);
    $assert($renamed[2]['indicators'][3] === 'مسمى تجريبي مؤقت', 'Rename not applied');
    $assert($renamed[2]['indicators'][4] === $base[2]['indicators'][4], 'Neighbor identity shifted');

    DB::table('teacher_indicator_overrides')->where($identity)
        ->update(['is_deleted' => true, 'updated_at' => now()]);
    $deleted = TeacherAssessmentIndicators::forSchool($schoolId);
    $assert(! isset($deleted[2]['indicators'][3]), 'Deleted indicator still active');
    $assert(isset($deleted[2]['indicators'][4]), 'Neighbor indicator disappeared');
    $manager = TeacherAssessmentIndicators::managementRows($schoolId);
    $assert($manager[2]['active_count'] === 2, 'Management active count incorrect');

    DB::table('teacher_indicator_overrides')->where($identity)
        ->update(['is_deleted' => false, 'updated_at' => now()]);
    $restored = TeacherAssessmentIndicators::forSchool($schoolId);
    $assert($restored[2]['indicators'][3] === 'مسمى تجريبي مؤقت', 'Restore failed');
    $assert(DB::table('teacher_indicator_evidences')->where('school_id', $schoolId)->count() === $before,
        'Evidence count changed');

    DB::rollBack();
    echo 'PASS: 11 criteria, 49 indicators, rename/hide/restore, stable IDs, evidence preserved; transaction rolled back.', PHP_EOL;
} catch (Throwable $exception) {
    DB::rollBack();
    throw $exception;
}
