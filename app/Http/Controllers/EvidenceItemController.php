<?php

namespace App\Http\Controllers;

use App\Models\EvidenceItem;
use App\Models\EvidenceUpload;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;

class EvidenceItemController extends Controller
{
    private function principalOnly(): void
    {
        abort_unless(Auth::user()->isPrincipal(), 403);
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
        $items = EvidenceItem::withCount('uploads')
            ->where('school_id', Auth::user()->school_id)
            ->get()
            ->sort(function (EvidenceItem $first, EvidenceItem $second): int {
                return $this->evidenceOrderNumber($first) <=> $this->evidenceOrderNumber($second)
                    ?: strnatcasecmp($first->title, $second->title)
                    ?: $first->id <=> $second->id;
            })
            ->values();

        return view('evidence.index', compact('items'));
    }

    public function create()
    {
        $this->principalOnly();

        return view('evidence.create');
    }

    public function store(Request $request)
    {
        $this->principalOnly();

        $data = $request->validate([
            'title' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
        ]);

        EvidenceItem::create([
            'school_id' => Auth::user()->school_id,
            'title' => $data['title'],
            'description' => $data['description'] ?? null,
            'created_by' => Auth::id(),
        ]);

        return redirect()->route('evidence.index')->with('success', 'تم إنشاء معيار التقييم بنجاح');
    }

    public function show(EvidenceItem $evidence)
    {
        $evidence = $this->findEvidence($evidence->id);

        $uploadsQuery = EvidenceUpload::with('uploader')
            ->where('school_id', Auth::user()->school_id)
            ->where('evidence_item_id', $evidence->id);

        if (Auth::user()->isTeacher()) {
            $uploadsQuery->where('uploaded_by', Auth::id());
        }

        $uploads = $uploadsQuery->latest()->get();

        return view('evidence.show', compact('evidence', 'uploads'));
    }

    public function edit(EvidenceItem $evidence)
    {
        $this->principalOnly();

        $evidence = $this->findEvidence($evidence->id);

        return view('evidence.edit', compact('evidence'));
    }

    public function update(Request $request, EvidenceItem $evidence)
    {
        $this->principalOnly();

        $evidence = $this->findEvidence($evidence->id);

        $data = $request->validate([
            'title' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
        ]);

        $evidence->update($data);

        return redirect()->route('evidence.index')->with('success', 'تم تحديث معيار التقييم');
    }

    public function destroy(EvidenceItem $evidence)
    {
        $this->principalOnly();

        $evidence = $this->findEvidence($evidence->id);

        foreach ($evidence->uploads as $upload) {
            Storage::disk('public')->delete($upload->file_path);
        }

        $evidence->delete();

        return redirect()->route('evidence.index')->with('success', 'تم حذف معيار التقييم');
    }
}
