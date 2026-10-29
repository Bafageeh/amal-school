<?php

namespace App\Support;

use Illuminate\Support\Facades\DB;

final class TeacherAssessmentIndicators
{
    /**
     * Preserve original zero-based keys, even after the principal removes an
     * indicator. Uploaded evidence references these keys (+1) permanently.
     */
    public static function forSchool(int $schoolId): array
    {
        $criteria = config('teacher_assessment', []);

        $overrides = DB::table('teacher_indicator_overrides')
            ->where('school_id', $schoolId)
            ->get(['criterion_no', 'indicator_no', 'title', 'is_deleted']);

        foreach ($overrides as $override) {
            $no = (int) $override->criterion_no;
            $index = (int) $override->indicator_no - 1;
            if (! array_key_exists($no, $criteria)
                || ! array_key_exists($index, $criteria[$no]['indicators'])) {
                continue;
            }

            if ($override->is_deleted) {
                unset($criteria[$no]['indicators'][$index]);
            } elseif ($override->title !== null && trim($override->title) !== '') {
                $criteria[$no]['indicators'][$index] = $override->title;
            }
        }

        return $criteria;
    }

    /**
     * Admin directory includes deleted indicators so they can be restored.
     */
    public static function managementRows(int $schoolId): array
    {
        $criteria = config('teacher_assessment', []);
        $overrides = DB::table('teacher_indicator_overrides')
            ->where('school_id', $schoolId)
            ->get()
            ->keyBy(fn ($row) => $row->criterion_no.':'.$row->indicator_no);

        $evidenceCounts = DB::table('teacher_indicator_evidences')
            ->where('school_id', $schoolId)
            ->select('criterion_no', 'indicator_no')
            ->selectRaw('COUNT(*) as total')
            ->groupBy('criterion_no', 'indicator_no')
            ->get()
            ->keyBy(fn ($row) => $row->criterion_no.':'.$row->indicator_no);

        foreach ($criteria as $criterionNo => &$criterion) {
            $entries = [];
            foreach ($criterion['indicators'] as $key => $original) {
                $number = $key + 1;
                $identity = $criterionNo.':'.$number;
                $override = $overrides->get($identity);
                $entries[] = [
                    'number' => $number,
                    'original' => $original,
                    'title' => ($override && $override->title) ? $override->title : $original,
                    'is_deleted' => (bool) ($override->is_deleted ?? false),
                    'evidence_count' => (int) ($evidenceCounts->get($identity)->total ?? 0),
                ];
            }
            $criterion['entries'] = $entries;
            $criterion['active_count'] = count(array_filter($entries, fn ($e) => ! $e['is_deleted']));
        }
        unset($criterion);

        return $criteria;
    }

    public static function isOriginal(int $criterion, int $indicator): bool
    {
        $base = config('teacher_assessment', []);
        return array_key_exists($criterion, $base)
            && array_key_exists($indicator - 1, $base[$criterion]['indicators']);
    }
}
