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

echo "OK: 11 criteria, 100% weighting, partial result suppressed, 100%, 80%, 96% verified.", PHP_EOL;
