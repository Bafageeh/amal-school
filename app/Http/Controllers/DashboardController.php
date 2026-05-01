<?php

namespace App\Http\Controllers;

use App\Models\EvidenceItem;
use App\Models\EvidenceUpload;
use App\Models\User;
use Illuminate\Support\Facades\Auth;

class DashboardController extends Controller
{
    public function index()
    {
        $user = Auth::user();

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

        $latestUploads = $uploadsQuery
            ->latest()
            ->limit(8)
            ->get();

        return view('dashboard', compact(
            'user',
            'teachersCount',
            'evidenceCount',
            'uploadsCount',
            'latestUploads'
        ));
    }
}
