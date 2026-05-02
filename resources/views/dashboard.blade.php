@extends('layouts.app')

@section('title', 'الرئيسية')

@section('content')
@php
    $dashboardData = [
        'user' => [
            'name' => $user->name,
            'role' => $user->role,
        ],
        'stats' => [
            'teachersCount' => $teachersCount,
            'evidenceCount' => $evidenceCount,
            'uploadsCount' => $uploadsCount,
        ],
        'urls' => [
            'dashboard' => route('dashboard'),
            'evidence' => route('evidence.index'),
            'settings' => auth()->user()->isPrincipal() ? route('settings.index') : null,
            'teacherEvidence' => auth()->user()->isPrincipal() ? route('teacher-evidence.index') : null,
            'teachers' => auth()->user()->isPrincipal() ? route('teachers.index') : null,
        ],
        'latestUploads' => $latestUploads->map(fn ($upload) => [
            'id' => $upload->id,
            'title' => $upload->title,
            'evidence_title' => $upload->evidenceItem?->title,
            'teacher_name' => $upload->uploader?->name,
            'created_at' => $upload->created_at->format('Y-m-d H:i'),
            'download_url' => route('uploads.download', $upload),
        ])->values(),
    ];
@endphp

<div data-react-app="dashboard" data-props='@json($dashboardData)'></div>
@endsection
