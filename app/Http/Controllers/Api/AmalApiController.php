<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\EvidenceItem;
use App\Models\EvidenceUpload;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rule;

class AmalApiController extends Controller
{
    private function user(): User
    {
        return Auth::user();
    }

    private function principalOnly(): void
    {
        abort_unless($this->user()->isPrincipal(), 403);
    }

    private function findTeacher(int $id): User
    {
        return User::where('school_id', $this->user()->school_id)
            ->where('role', 'teacher')
            ->findOrFail($id);
    }

    private function findEvidence(int $id): EvidenceItem
    {
        return EvidenceItem::where('school_id', $this->user()->school_id)->findOrFail($id);
    }

    private function teacherEmailFromUsername(string $username): string
    {
        return $username . '@teachers.local';
    }

    private function evidenceOrderNumber(EvidenceItem $item): int
    {
        $title = strtr($item->title, [
            '٠' => '0', '١' => '1', '٢' => '2', '٣' => '3', '٤' => '4',
            '٥' => '5', '٦' => '6', '٧' => '7', '٨' => '8', '٩' => '9',
            '۰' => '0', '۱' => '1', '۲' => '2', '۳' => '3', '۴' => '4',
            '۵' => '5', '۶' => '6', '۷' => '7', '۸' => '8', '۹' => '9',
        ]);

        if (preg_match('/\d+/u', $title, $matches)) {
            return (int) $matches[0];
        }

        return PHP_INT_MAX;
    }

    private function evidenceItemsQuery()
    {
        return EvidenceItem::where('school_id', $this->user()->school_id);
    }

    private function sortedEvidenceItems()
    {
        return $this->evidenceItemsQuery()
            ->withCount('uploads')
            ->get()
            ->sort(function (EvidenceItem $first, EvidenceItem $second): int {
                return $this->evidenceOrderNumber($first) <=> $this->evidenceOrderNumber($second)
                    ?: strnatcasecmp($first->title, $second->title)
                    ?: $first->id <=> $second->id;
            })
            ->values();
    }

    private function publicUploadUrl(EvidenceUpload $upload): string
    {
        return url(Storage::disk('public')->url($upload->file_path));
    }

    private function uploadResource(EvidenceUpload $upload): array
    {
        $publicUrl = $this->publicUploadUrl($upload);

        return [
            'id' => $upload->id,
            'title' => $upload->title,
            'notes' => $upload->notes,
            'file_type' => $upload->file_type,
            'file_path' => $upload->file_path,
            'file_name' => basename($upload->file_path),
            'public_url' => $publicUrl,
            'preview_url' => $publicUrl,
            'download_url' => $publicUrl,
            'created_at' => $upload->created_at?->format('Y-m-d H:i'),
            'evidence' => $upload->evidenceItem ? [
                'id' => $upload->evidenceItem->id,
                'title' => $upload->evidenceItem->title,
            ] : null,
            'uploader' => $upload->uploader ? [
                'id' => $upload->uploader->id,
                'name' => $upload->uploader->name,
                'username' => $upload->uploader->username,
            ] : null,
        ];
    }

    private function evidenceResource(EvidenceItem $item): array
    {
        return [
            'id' => $item->id,
            'title' => $item->title,
            'description' => $item->description,
            'uploads_count' => $item->uploads_count ?? null,
            'created_at' => $item->created_at?->format('Y-m-d H:i'),
        ];
    }

    private function teacherResource(User $teacher): array
    {
        return [
            'id' => $teacher->id,
            'name' => $teacher->name,
            'username' => $teacher->username,
            'role' => $teacher->role,
            'uploads_count' => $teacher->uploads_count ?? null,
            'created_at' => $teacher->created_at?->format('Y-m-d H:i'),
        ];
    }

    public function me(): JsonResponse
    {
        $user = $this->user()->load('school');

        return response()->json([
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'username' => $user->username,
                'role' => $user->role,
                'is_principal' => $user->isPrincipal(),
                'is_teacher' => $user->isTeacher(),
                'school' => $user->school ? [
                    'id' => $user->school->id,
                    'name' => $user->school->name,
                ] : null,
            ],
        ]);
    }

    public function dashboard(): JsonResponse
    {
        $user = $this->user();

        $teachersCount = User::where('school_id', $user->school_id)
            ->where('role', 'teacher')
            ->count();

        $evidenceCount = EvidenceItem::where('school_id', $user->school_id)->count();

        $uploadsQuery = EvidenceUpload::with(['evidenceItem', 'uploader'])
            ->where('school_id', $user->school_id);

        if ($user->isTeacher()) {
            $uploadsQuery->where('uploaded_by', $user->id);
        }

        $uploadsCount = (clone $uploadsQuery)->count();
        $latestUploads = $uploadsQuery->latest()->limit(8)->get();

        return response()->json([
            'stats' => [
                'teachers_count' => $teachersCount,
                'evidence_count' => $evidenceCount,
                'uploads_count' => $uploadsCount,
            ],
            'latest_uploads' => $latestUploads->map(fn (EvidenceUpload $upload) => $this->uploadResource($upload))->values(),
        ]);
    }

    public function evidenceIndex(): JsonResponse
    {
        return response()->json([
            'items' => $this->sortedEvidenceItems()->map(fn (EvidenceItem $item) => $this->evidenceResource($item))->values(),
        ]);
    }

    public function evidenceShow(EvidenceItem $evidence): JsonResponse
    {
        $evidence = $this->findEvidence($evidence->id);

        $uploadsQuery = EvidenceUpload::with(['uploader', 'evidenceItem'])
            ->where('school_id', $this->user()->school_id)
            ->where('evidence_item_id', $evidence->id);

        if ($this->user()->isTeacher()) {
            $uploadsQuery->where('uploaded_by', $this->user()->id);
        }

        return response()->json([
            'item' => $this->evidenceResource($evidence),
            'uploads' => $uploadsQuery->latest()->get()->map(fn (EvidenceUpload $upload) => $this->uploadResource($upload))->values(),
        ]);
    }

    public function evidenceStore(Request $request): JsonResponse
    {
        $this->principalOnly();

        $data = $request->validate([
            'title' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
        ]);

        $item = EvidenceItem::create([
            'school_id' => $this->user()->school_id,
            'title' => $data['title'],
            'description' => $data['description'] ?? null,
            'created_by' => $this->user()->id,
        ]);

        return response()->json([
            'message' => 'تم إنشاء معيار التقييم بنجاح',
            'item' => $this->evidenceResource($item),
        ], 201);
    }

    public function evidenceUpdate(Request $request, EvidenceItem $evidence): JsonResponse
    {
        $this->principalOnly();
        $evidence = $this->findEvidence($evidence->id);

        $data = $request->validate([
            'title' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
        ]);

        $evidence->update($data);

        return response()->json([
            'message' => 'تم تحديث معيار التقييم',
            'item' => $this->evidenceResource($evidence->refresh()),
        ]);
    }

    public function evidenceDestroy(EvidenceItem $evidence): JsonResponse
    {
        $this->principalOnly();
        $evidence = $this->findEvidence($evidence->id);

        foreach ($evidence->uploads as $upload) {
            Storage::disk('public')->delete($upload->file_path);
        }

        $evidence->delete();

        return response()->json(['message' => 'تم حذف معيار التقييم']);
    }

    public function uploadEvidence(Request $request, EvidenceItem $evidence): JsonResponse
    {
        $evidence = $this->findEvidence($evidence->id);

        $data = $request->validate([
            'title' => ['nullable', 'string', 'max:255'],
            'notes' => ['nullable', 'string'],
            'files' => ['required', 'array', 'min:1'],
            'files.*' => [
                'required', 'file', 'max:51200',
                'mimes:pdf,jpg,jpeg,png,gif,webp,heic,heif,doc,docx,xls,xlsx,ppt,pptx,txt,csv,zip,rar,mp4,mov,avi,wmv,mkv,mp3,wav,m4a',
            ],
        ], [
            'files.required' => 'يرجى اختيار ملف واحد على الأقل.',
            'files.*.max' => 'حجم كل ملف يجب ألا يتجاوز 50 ميجابايت.',
            'files.*.mimes' => 'نوع أحد الملفات غير مسموح.',
        ]);

        $files = $request->file('files', []);
        $filesCount = count($files);
        $uploads = collect();

        foreach ($files as $file) {
            $path = $file->store('evidence/' . $this->user()->school_id . '/' . $evidence->id, 'public');
            $originalName = $file->getClientOriginalName();
            $title = blank($data['title'] ?? null)
                ? $originalName
                : ($filesCount > 1 ? $data['title'] . ' - ' . $originalName : $data['title']);

            $uploads->push(EvidenceUpload::create([
                'school_id' => $this->user()->school_id,
                'evidence_item_id' => $evidence->id,
                'uploaded_by' => $this->user()->id,
                'title' => $title,
                'notes' => $data['notes'] ?? null,
                'file_path' => $path,
                'file_type' => $file->getClientMimeType(),
            ])->load(['evidenceItem', 'uploader']));
        }

        return response()->json([
            'message' => $filesCount > 1 ? 'تم رفع الملفات بنجاح' : 'تم رفع الملف بنجاح',
            'uploads' => $uploads->map(fn (EvidenceUpload $upload) => $this->uploadResource($upload))->values(),
        ], 201);
    }

    public function uploadDestroy(EvidenceUpload $upload): JsonResponse
    {
        abort_unless($upload->school_id === $this->user()->school_id, 404);

        if ($this->user()->isTeacher()) {
            abort_unless($upload->uploaded_by === $this->user()->id, 403);
        }

        Storage::disk('public')->delete($upload->file_path);
        $upload->delete();

        return response()->json(['message' => 'تم حذف الملف']);
    }

    public function teachersIndex(): JsonResponse
    {
        $this->principalOnly();

        $teachers = User::withCount([
                'evidenceUploads as uploads_count' => fn ($query) => $query->where('school_id', $this->user()->school_id),
            ])
            ->where('school_id', $this->user()->school_id)
            ->where('role', 'teacher')
            ->orderBy('name')
            ->orderBy('username')
            ->get();

        return response()->json([
            'teachers' => $teachers->map(fn (User $teacher) => $this->teacherResource($teacher))->values(),
        ]);
    }

    public function teacherStore(Request $request): JsonResponse
    {
        $this->principalOnly();

        $data = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'username' => ['required', 'string', 'max:255', 'alpha_dash', 'unique:users,username'],
            'password' => ['nullable', 'digits:4'],
        ]);

        $teacher = User::create([
            'school_id' => $this->user()->school_id,
            'name' => $data['name'],
            'username' => $data['username'],
            'email' => $this->teacherEmailFromUsername($data['username']),
            'password' => filled($data['password'] ?? null) ? Hash::make($data['password']) : null,
            'role' => 'teacher',
        ]);

        return response()->json([
            'message' => 'تم إنشاء حساب المعلمة بنجاح',
            'teacher' => $this->teacherResource($teacher),
        ], 201);
    }

    public function teacherUpdate(Request $request, User $teacher): JsonResponse
    {
        $this->principalOnly();
        $teacher = $this->findTeacher($teacher->id);

        $data = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'username' => ['required', 'string', 'max:255', 'alpha_dash', Rule::unique('users', 'username')->ignore($teacher->id)],
            'password' => ['nullable', 'digits:4'],
        ]);

        $teacher->name = $data['name'];
        $teacher->username = $data['username'];
        $teacher->email = $this->teacherEmailFromUsername($data['username']);

        if (filled($data['password'] ?? null)) {
            $teacher->password = Hash::make($data['password']);
        }

        $teacher->save();

        return response()->json([
            'message' => 'تم تحديث بيانات المعلمة',
            'teacher' => $this->teacherResource($teacher->refresh()),
        ]);
    }

    public function teacherDestroy(User $teacher): JsonResponse
    {
        $this->principalOnly();
        $teacher = $this->findTeacher($teacher->id);
        $teacher->delete();

        return response()->json(['message' => 'تم حذف حساب المعلمة']);
    }

    public function teacherEvidenceIndex(): JsonResponse
    {
        return $this->teachersIndex();
    }

    public function teacherCriteria(User $teacher): JsonResponse
    {
        $this->principalOnly();
        $teacher = $this->findTeacher($teacher->id);

        $items = EvidenceItem::withCount([
                'uploads as teacher_uploads_count' => fn ($query) => $query->where('uploaded_by', $teacher->id),
            ])
            ->where('school_id', $this->user()->school_id)
            ->get()
            ->sort(function (EvidenceItem $first, EvidenceItem $second): int {
                return $this->evidenceOrderNumber($first) <=> $this->evidenceOrderNumber($second)
                    ?: strnatcasecmp($first->title, $second->title)
                    ?: $first->id <=> $second->id;
            })
            ->values();

        return response()->json([
            'teacher' => $this->teacherResource($teacher),
            'items' => $items->map(fn (EvidenceItem $item) => array_merge($this->evidenceResource($item), [
                'teacher_uploads_count' => $item->teacher_uploads_count,
            ]))->values(),
        ]);
    }

    public function teacherUploads(User $teacher, EvidenceItem $evidence): JsonResponse
    {
        $this->principalOnly();
        $teacher = $this->findTeacher($teacher->id);
        $evidence = $this->findEvidence($evidence->id);

        $uploads = EvidenceUpload::with(['uploader', 'evidenceItem'])
            ->where('school_id', $this->user()->school_id)
            ->where('uploaded_by', $teacher->id)
            ->where('evidence_item_id', $evidence->id)
            ->latest()
            ->get();

        return response()->json([
            'teacher' => $this->teacherResource($teacher),
            'item' => $this->evidenceResource($evidence),
            'uploads' => $uploads->map(fn (EvidenceUpload $upload) => $this->uploadResource($upload))->values(),
        ]);
    }

    public function settings(): JsonResponse
    {
        $this->principalOnly();

        return response()->json([
            'sections' => [
                [
                    'title' => 'إدارة المعلمات',
                    'items' => [
                        ['title' => 'المعلمات', 'url' => route('teachers.index'), 'api_url' => url('/api/v1/teachers')],
                    ],
                ],
            ],
        ]);
    }
}
