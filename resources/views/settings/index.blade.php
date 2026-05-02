@extends('layouts.app')

@section('title', 'الإعدادات')

@section('content')
<section class="card app-section-card">
    <div class="section-heading">
        <div>
            <h3>إدارة المعايير</h3>
            <p class="muted">إدخال وتعديل معايير التقييم الخاصة بالمدرسة.</p>
        </div>
    </div>

    <div class="app-actions-grid">
        <a class="app-action-card" href="{{ route('evidence.create') }}">
            <span class="app-action-icon">✅</span>
            <span class="app-action-text">
                <strong>إدخال المعايير</strong>
                <small>إضافة معيار تقييم جديد للمعلمات.</small>
            </span>
        </a>
        <a class="app-action-card" href="{{ route('evidence.index') }}">
            <span class="app-action-icon">📋</span>
            <span class="app-action-text">
                <strong>قائمة المعايير</strong>
                <small>عرض المعايير وتعديلها أو فتح ملفاتها.</small>
            </span>
        </a>
    </div>
</section>

<div data-react-app="settings-index"></div>
@endsection
