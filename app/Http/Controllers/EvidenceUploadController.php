<?php

namespace App\Http\Controllers;

use App\Models\EvidenceItem;
use App\Models\EvidenceUpload;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;

class EvidenceUploadController extends Controller
{
    public function store(Request $request, EvidenceItem $evidence)
    {
        $evidence = EvidenceItem::where('school_id', Auth::user()->school_id)->findOrFail($evidence->id);

        $data = $request->validate([
            'title' => ['nullable', 'string', 'max:255'],
            'notes' => ['nullable', 'string'],
            'files' => ['required', 'array', 'min:1'],
            'files.*' => [
                'required',
                'file',
                'max:51200',
                'mimes:pdf,jpg,jpeg,png,gif,webp,heic,heif,doc,docx,xls,xlsx,ppt,pptx,txt,csv,zip,rar,mp4,mov,avi,wmv,mkv,mp3,wav,m4a',
            ],
        ], [
            'files.required' => 'يرجى اختيار ملف واحد على الأقل.',
            'files.array' => 'يرجى اختيار الملفات بطريقة صحيحة.',
            'files.min' => 'يرجى اختيار ملف واحد على الأقل.',
            'files.*.required' => 'يرجى اختيار ملف واحد على الأقل.',
            'files.*.file' => 'يرجى رفع ملف صحيح.',
            'files.*.max' => 'حجم كل ملف يجب ألا يتجاوز 50 ميجابايت.',
            'files.*.mimes' => 'نوع أحد الملفات غير مسموح. الأنواع المسموحة: PDF، الصور، Word، Excel، PowerPoint، النصوص، الملفات المضغوطة، الصوت، والفيديو.',
        ]);

        $files = $request->file('files', []);
        $filesCount = count($files);

        foreach ($files as $file) {
            $path = $file->store(
                'evidence/' . Auth::user()->school_id . '/' . $evidence->id,
                'public'
            );

            EvidenceUpload::create([
                'school_id' => Auth::user()->school_id,
                'evidence_item_id' => $evidence->id,
                'uploaded_by' => Auth::id(),
                'title' => $this->resolveUploadTitle($data['title'] ?? null, $file->getClientOriginalName(), $filesCount),
                'notes' => $data['notes'] ?? null,
                'file_path' => $path,
                'file_type' => $file->getClientMimeType(),
            ]);
        }

        return redirect()
            ->route('evidence.show', $evidence)
            ->with('success', $filesCount > 1 ? 'تم رفع الملفات بنجاح' : 'تم رفع الملف بنجاح');
    }

    private function resolveUploadTitle(?string $title, string $originalName, int $filesCount): string
    {
        if (blank($title)) {
            return $originalName;
        }

        return $filesCount > 1 ? $title . ' - ' . $originalName : $title;
    }

    private function authorizeUpload(EvidenceUpload $upload): void
    {
        $user = Auth::user();

        abort_unless($upload->school_id === $user->school_id, 404);

        if ($user->isTeacher()) {
            abort_unless($upload->uploaded_by === $user->id, 403);
        }
    }

    private function inlineFileResponse(EvidenceUpload $upload)
    {
        abort_unless(Storage::disk('public')->exists($upload->file_path), 404);

        $absolutePath = Storage::disk('public')->path($upload->file_path);
        $fileName = basename($upload->file_path);
        $mimeType = $upload->file_type ?: (mime_content_type($absolutePath) ?: 'application/octet-stream');

        return response()->file($absolutePath, [
            'Content-Type' => $mimeType,
            'Content-Disposition' => 'inline; filename="' . addslashes($fileName) . '"',
            'X-Content-Type-Options' => 'nosniff',
            'Access-Control-Allow-Origin' => '*',
            'Access-Control-Allow-Methods' => 'GET, OPTIONS',
            'Access-Control-Allow-Headers' => 'Content-Type, Range',
        ]);
    }

    public function preview(EvidenceUpload $upload)
    {
        $this->authorizeUpload($upload);
        return $this->inlineFileResponse($upload);
    }

    public function mobilePreview(EvidenceUpload $upload, ?string $name = null)
    {
        return $this->inlineFileResponse($upload);
    }

    public function download(EvidenceUpload $upload)
    {
        $this->authorizeUpload($upload);

        return Storage::disk('public')->download($upload->file_path);
    }

    public function mobileDownload(EvidenceUpload $upload, ?string $name = null)
    {
        return Storage::disk('public')->download($upload->file_path);
    }

    public function destroy(EvidenceUpload $upload)
    {
        $this->authorizeUpload($upload);

        Storage::disk('public')->delete($upload->file_path);
        $upload->delete();

        return back()->with('success', 'تم حذف الملف');
    }
}
