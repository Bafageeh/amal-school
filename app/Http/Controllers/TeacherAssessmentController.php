<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Support\TeacherAssessmentScores;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\ValidationException;

class TeacherAssessmentController extends Controller
{
    private function criteria(): array
    {
        return config('teacher_assessment', []);
    }

    private function principalOnly(): void
    {
        abort_unless(Auth::user()?->isPrincipal(), 403);
    }

    private function teacherInSchool(User $teacher): User
    {
        abort_unless(
            $teacher->school_id === Auth::user()->school_id
            && $teacher->role === 'teacher' && !$teacher->trashed(),
            404
        );
        return $teacher;
    }

    private function validateIndicator(int $criterion, int $indicator): void
    {
        $criteria = $this->criteria();
        abort_unless(
            isset($criteria[$criterion], $criteria[$criterion]['indicators'][$indicator - 1]),
            404
        );
    }

    public function index()
    {
        $this->principalOnly();
        $teachers = User::where('school_id', Auth::user()->school_id)
            ->where('role', 'teacher')->orderBy('name')->get();
        $uploads = DB::table('teacher_indicator_evidences')
            ->where('school_id', Auth::user()->school_id)
            ->get(['teacher_id', 'criterion_no', 'indicator_no'])
            ->groupBy('teacher_id')
            ->map(fn ($rows) => $rows->unique(fn ($r) => $r->criterion_no.':'.$r->indicator_no)->count());

        // Retrieve all teacher ratings in one school-scoped query, then compute
        // complete weighted results for the directory without N+1 queries.
        $ratingGroups = DB::table('teacher_criterion_ratings')
            ->where('school_id', Auth::user()->school_id)
            ->whereIn('teacher_id', $teachers->pluck('id'))
            ->get(['teacher_id', 'criterion_no', 'rating'])
            ->groupBy('teacher_id');
        $criteria = $this->criteria();
        $teacherScores = [];
        foreach ($teachers as $teacher) {
            $ratings = ($ratingGroups->get($teacher->id) ?? collect())
                ->pluck('rating', 'criterion_no')->all();
            $teacherScores[$teacher->id] = TeacherAssessmentScores::calculate($criteria, $ratings);
        }

        return view('teacher_assessment.index', compact('teachers', 'uploads', 'teacherScores'));
    }

    public function teacher(User $teacher)
    {
        $this->principalOnly();
        return $this->render($this->teacherInSchool($teacher), true);
    }

    public function mine()
    {
        abort_unless(Auth::user()?->isTeacher(), 403);
        return $this->render(Auth::user(), false);
    }

    private function render(User $teacher, bool $principal)
    {
        $criteria = $this->criteria();
        $uploads = DB::table('teacher_indicator_evidences')
            ->where('school_id', $teacher->school_id)
            ->where('teacher_id', $teacher->id)
            ->orderByDesc('id')->get();
        $byIndicator = [];
        foreach ($uploads as $file) {
            $byIndicator[$file->criterion_no][$file->indicator_no][] = $file;
        }
        $ratings = DB::table('teacher_criterion_ratings')
            ->where('school_id', $teacher->school_id)
            ->where('teacher_id', $teacher->id)
            ->pluck('rating', 'criterion_no')->all();

        $rows = [];
        $covered = 0;
        $ratedPoints = 0;
        foreach ($criteria as $no => $criterion) {
            $completed = 0;
            foreach ($criterion['indicators'] as $i => $label) {
                if (!empty($byIndicator[$no][$i + 1])) $completed++;
            }
            $evidencePoints = round($criterion['weight'] * $completed / count($criterion['indicators']), 2);
            $covered += $evidencePoints;
            $rating = $ratings[$no] ?? null;
            $ratingPoints = $rating === null ? null : round($criterion['weight'] * $rating / 5, 2);
            $ratedPoints += $ratingPoints ?? 0;
            $rows[$no] = array_merge($criterion, compact('completed', 'evidencePoints', 'rating', 'ratingPoints'));
        }

        $totalIndicators = count($criteria) * 5;
        $covered = round($covered, 2);
        $ratedPoints = round($ratedPoints, 2);
        $assessment = TeacherAssessmentScores::calculate($criteria, $ratings);
        // Present the same weighted score in the teacher view and directory.
        $ratedCount = $assessment['rated_count'];
        return view('teacher_assessment.show', compact(
            'teacher', 'principal', 'rows', 'byIndicator', 'covered',
            'ratedPoints', 'ratedCount', 'totalIndicators', 'assessment'
        ));
    }

    public function upload(Request $request, int $criterion, int $indicator)
    {
        abort_unless(Auth::user()?->isTeacher(), 403);
        $this->validateIndicator($criterion, $indicator);
        $validated = $request->validate([
            'file' => ['required', 'file', 'max:51200',
                'mimes:pdf,jpg,jpeg,png,webp,gif,doc,docx,xls,xlsx,ppt,pptx,mp4,mov'],
        ], ['file.max' => 'الحد الأقصى للملف 50 ميجابايت.']);

        $user = Auth::user();
        $file = $validated['file'];
        $path = $file->store(
            'teacher-assessment/'.$user->school_id.'/'.$user->id.'/'.$criterion.'/'.$indicator, 'local'
        );
        if (!$path) {
            return back()->withErrors(['file' => 'تعذر حفظ الملف.']);
        }

        DB::table('teacher_indicator_evidences')->insert([
            'school_id' => $user->school_id,
            'teacher_id' => $user->id,
            'criterion_no' => $criterion,
            'indicator_no' => $indicator,
            'original_name' => $file->getClientOriginalName(),
            'file_path' => $path,
            'mime_type' => $file->getMimeType(),
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        return back()->with('success', 'تم رفع الشاهد لهذا المؤشر.');
    }

    private function authorizeFile(int $id)
    {
        $file = DB::table('teacher_indicator_evidences')->where('id', $id)->first();
        abort_unless($file && $file->school_id === Auth::user()->school_id, 404);
        abort_unless(
            Auth::user()->isPrincipal() ||
            (Auth::user()->isTeacher() && $file->teacher_id === Auth::id()),
            403
        );
        return $file;
    }

    public function download(int $file)
    {
        $row = $this->authorizeFile($file);
        abort_unless(Storage::disk('local')->exists($row->file_path), 404);
        return Storage::disk('local')->download($row->file_path, basename($row->original_name));
    }

    public function destroy(int $file)
    {
        $row = $this->authorizeFile($file);
        DB::table('teacher_indicator_evidences')->where('id', $row->id)->delete();
        Storage::disk('local')->delete($row->file_path);
        return back()->with('success', 'تم حذف الشاهد.');
    }

    public function rate(Request $request, User $teacher, int $criterion)
    {
        $this->principalOnly();
        $teacher = $this->teacherInSchool($teacher);
        abort_unless(isset($this->criteria()[$criterion]), 404);
        $data = $request->validate(['rating' => ['required', 'integer', 'between:1,5']]);
        DB::table('teacher_criterion_ratings')->updateOrInsert(
            ['teacher_id' => $teacher->id, 'criterion_no' => $criterion],
            [
                'school_id' => $teacher->school_id,
                'rating' => (int)$data['rating'],
                'rated_by' => Auth::id(),
                'updated_at' => now(),
            ]
        );
        return back()->with('success', 'تم حفظ تقييم المعيار.');
    }
}
