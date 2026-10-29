<?php

// Standalone production smoke test; does not touch the database or accounts.
require __DIR__.'/../../app/Support/TeacherAssessmentScores.php';
$criteria = require __DIR__.'/../../config/teacher_assessment.php';

$verify = static function (bool $condition, string $message): void {
    if (! $condition) {
        throw new RuntimeException($message);
    }
};

$verify(count($criteria) === 11, 'Expected 11 assessment criteria');
$verify(array_sum(array_column($criteria, 'weight')) === 100, 'Weights must total 100%');

// Evidence IDs must survive removing indicators, so existing uploads are not
// reassigned to another label and retired indicators cannot receive new files.
$verify(array_sum(array_map(fn ($criterion) => count($criterion['indicators']), $criteria)) === 49, 'Expected 49 active indicators');
$verify($criteria[2]['indicators'] === [0 => 'المشاركة في الاجتماعات المهنية', 3 => 'الانخراط في التطوير المهني', 4 => 'قيادة مجموعات العمل'], 'Criterion 2 evidence identities changed');
$verify($criteria[3]['indicators'] === [0 => 'التواصل الدوري مع الأسر', 1 => 'إبلاغ أولياء الأمور بالتقدم', 3 => 'عقد اجتماعات دورية', 4 => 'توظيف قنوات التواصل الرقمي'], 'Criterion 3 evidence identities changed');
$verify($criteria[6]['indicators'] === [2 => 'التوزيع الزمني المناسب', 4 => 'التنفيذ الفعلي للخطة'], 'Criterion 6 evidence identities changed');

$empty = \App\Support\TeacherAssessmentScores::calculate($criteria, []);
$verify($empty['final_score'] === null && ! $empty['is_complete'], 'Unrated scores must be pending');

$partial = \App\Support\TeacherAssessmentScores::calculate($criteria, [1 => 5]);
$verify($partial['final_score'] === null && $partial['rated_count'] === 1, 'Partial score must not be final');

$ratings = array_fill_keys(array_keys($criteria), 5);
$excellent = \App\Support\TeacherAssessmentScores::calculate($criteria, $ratings);
$verify($excellent['final_score'] === 100.0 && $excellent['grade'] === 'ممتاز', 'Excellent score incorrect');

$ratings = array_fill_keys(array_keys($criteria), 4);
$veryGood = \App\Support\TeacherAssessmentScores::calculate($criteria, $ratings);
$verify($veryGood['final_score'] === 80.0 && $veryGood['grade'] === 'جيد جدًا', 'Very good score incorrect');

$ratings = array_fill_keys(array_keys($criteria), 5);
$ratings[8] = 1;
$weighted = \App\Support\TeacherAssessmentScores::calculate($criteria, $ratings);
$verify($weighted['final_score'] === 96.0, 'Criterion weighting incorrect');

echo "OK: 11 criteria, 49 indicators, stable evidence IDs, 100% weighting, partial result suppressed, 100%, 80%, 96% verified.", PHP_EOL;
