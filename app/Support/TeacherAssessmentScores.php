<?php

namespace App\Support;

final class TeacherAssessmentScores
{
    /**
     * Final weighted result from the principal's ratings only, never from uploads.
     * Do not publish a final score until every configured criterion has a rating.
     */
    public static function calculate(array $criteria, array $ratings): array
    {
        $total = count($criteria);
        $rated = 0;
        $points = 0.0;
        $byCriterion = [];

        foreach ($criteria as $criterionNo => $criterion) {
            $rating = isset($ratings[$criterionNo]) ? (int) $ratings[$criterionNo] : null;
            $weight = (float) $criterion['weight'];
            $valid = $rating !== null && $rating >= 1 && $rating <= 5;
            $earned = $valid ? round($weight * $rating / 5, 2) : null;

            if ($valid) {
                $rated++;
                $points += $earned;
            }

            $byCriterion[$criterionNo] = [
                'rating' => $valid ? $rating : null,
                'earned' => $earned,
                'weight' => $weight,
            ];
        }

        $complete = $total > 0 && $rated === $total;
        $points = round($points, 2);
        $score = $complete ? $points : null;

        return [
            'is_complete' => $complete,
            'rated_count' => $rated,
            'total_count' => $total,
            'pending_count' => $total - $rated,
            'current_points' => $points,
            'final_score' => $score,
            'grade' => $complete ? self::grade($points) : 'قيد التقييم',
            'breakdown' => $byCriterion,
        ];
    }

    private static function grade(float $percentage): string
    {
        return match (true) {
            $percentage >= 90 => 'ممتاز',
            $percentage >= 80 => 'جيد جدًا',
            $percentage >= 70 => 'جيد',
            $percentage >= 60 => 'مقبول',
            default => 'ضعيف',
        };
    }
}
