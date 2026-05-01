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

    public function index()
    {
        $items = EvidenceItem::withCount('uploads')
            ->where('school_id', Auth::user()->school_id)
            ->latest()
            ->get();

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
