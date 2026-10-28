<?php

namespace Tests\Unit;

use App\Support\TeacherAssessmentScores;
use PHPUnit\Framework\TestCase;

class TeacherAssessmentScoresTest extends TestCase
{
    private function criteria(): array
    {
        return require __DIR__.'/../../config/teacher_assessment.php';
    }

    public function test_no_final_score_before_all_principal_ratings_are_saved(): void
    {
        $criteria = $this->criteria();
        $summary = TeacherAssessmentScores::calculate($criteria, []);
        $this->assertFalse($summary['is_complete']);
        $this->assertNull($summary['final_score']);
        $this->assertSame('قيد التقييم', $summary['grade']);
        $this->assertSame(11, $summary['pending_count']);

        $summary = TeacherAssessmentScores::calculate($criteria, [1 => 5]);
        $this->assertFalse($summary['is_complete']);
        $this->assertSame(1, $summary['rated_count']);
        $this->assertNull($summary['final_score']);
    }

    public function test_complete_principal_ratings_produce_weighted_final_result(): void
    {
        $criteria = $this->criteria();
        $this->assertSame(11, count($criteria));
        $this->assertSame(100, array_sum(array_column($criteria, 'weight')));

        $excellent = TeacherAssessmentScores::calculate($criteria, array_fill_keys(array_keys($criteria), 5));
        $this->assertTrue($excellent['is_complete']);
        $this->assertSame(100.0, $excellent['final_score']);
        $this->assertSame('ممتاز', $excellent['grade']);

        $veryGood = TeacherAssessmentScores::calculate($criteria, array_fill_keys(array_keys($criteria), 4));
        $this->assertSame(80.0, $veryGood['final_score']);
        $this->assertSame('جيد جدًا', $veryGood['grade']);
    }

    public function test_rating_not_evidence_is_the_only_input_to_final_score(): void
    {
        $criteria = $this->criteria();
        $ratings = array_fill_keys(array_keys($criteria), 5);
        $ratings[8] = 1; // Criterion eight has a weight of 5%.
        $summary = TeacherAssessmentScores::calculate($criteria, $ratings);
        $this->assertTrue($summary['is_complete']);
        $this->assertSame(96.0, $summary['final_score']);
        $this->assertSame(1.0, $summary['breakdown'][8]['earned']);
    }
}
