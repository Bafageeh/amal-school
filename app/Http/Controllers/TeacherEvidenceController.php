<?php

namespace App\Http\Controllers;

use App\Models\EvidenceItem;
use App\Models\EvidenceUpload;
use App\Models\User;
use Illuminate\Support\Facades\Auth;

class TeacherEvidenceController extends Controller
{
    private function principalOnly(): void
    {
        abort_unless(Auth::user()->isPrincipal(), 403);
    }

    private function findTeacher(int $id): User
    {
        return User::where('school_id', Auth::user()->school_id)
            ->where('role', 'teacher')
            ->findOrFail($id);
    }

    private function findEvidence(int $id): EvidenceItem
    {
        return EvidenceItem::where('school_id', Auth::user()->school_id)->findOrFail($id);
    }

    private function evidenceOrderNumber(EvidenceItem $item): int
    {
        $title = strtr($item->title, [
            '٠' => '0',
            '١' => '1',
            '٢' => '2',
            '٣' => '3',
            '٤' => '4',
            '٥' => '5',
            '٦' => '6',
            '٧' => '7',
            '٨' => '8',
            '٩' => '9',
            '۰' => '0',
            '۱' => '1',
            '۲' => '2',
            '۳' => '3',
            '۴' => '4',
            '۵' => '5',
            '۶' => '6',
            '۷' => '7',
            '۸' => '8',
            '۹' => '9',
        ]);

        if (preg_match('/\d+/u', $title, $matches)) {
            return (int) $matches[0];
        }

        return PHP_INT_MAX;
    }

    public function index()
    {
        $this->principalOnly();

        $teachers = User::withCount([
                'evidenceUploads as uploads_count' => fn ($query) => $query->where('school_id', Auth::user()->school_id),
            ])
            ->where('school_id', Auth::user()->school_id)
            ->where('role', 'teacher')
            ->orderBy('name')
            ->orderBy('username')
            ->get();

        return view('teacher_evidence.index', compact('teachers'));
    }

    public function teacher(User $teacher)
    {
        $this->principalOnly();

        $teacher = $this->findTeacher($teacher->id);

        $items = EvidenceItem::withCount([
                'uploads as teacher_uploads_count' => fn ($query) => $query->where('uploaded_by', $teacher->id),
            ])
            ->where('school_id', Auth::user()->school_id)
            ->get()
            ->sort(function (EvidenceItem $first, EvidenceItem $second): int {
                return $this->evidenceOrderNumber($first) <=> $this->evidenceOrderNumber($second)
                    ?: strnatcasecmp($first->title, $second->title)
                    ?: $first->id <=> $second->id;
            })
            ->values();

        return view('teacher_evidence.criteria', compact('teacher', 'items'));
    }

    public function uploads(User $teacher, EvidenceItem $evidence)
    {
        $this->principalOnly();

        $teacher = $this->findTeacher($teacher->id);
        $evidence = $this->findEvidence($evidence->id);

        $uploads = EvidenceUpload::where('school_id', Auth::user()->school_id)
            ->where('uploaded_by', $teacher->id)
            ->where('evidence_item_id', $evidence->id)
            ->latest()
            ->get();

        return view('teacher_evidence.uploads', compact('teacher', 'evidence', 'uploads'));
    }
}
