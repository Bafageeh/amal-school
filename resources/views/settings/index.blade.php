@extends('layouts.app')

@section('title', 'الإعدادات')

@section('content')
<div class="hero-card">
    <div>
        <span class="hero-kicker">إعدادات المديرة</span>
        <h1>الإعدادات</h1>
        <p>تم نقل أزرار المعلمات ومتابعة ملفات المعلمات إلى هذه الشاشة.</p>
    </div>
    <div class="hero-badge">⚙️</div>
</div>

<div class="card">
    <h3>إدارة المعلمات</h3>
    <p class="muted">كل ما يخص حسابات المعلمات ومتابعة ملفاتهن من هنا.</p>

    <div class="app-actions-grid">
        <a class="app-action-card" href="{{ route('teachers.index') }}">
            <span class="app-action-icon">👥</span>
            <span class="app-action-text">
                <strong>المعلمات</strong>
                <small>إضافة وتعديل وحذف حسابات المعلمات.</small>
            </span>
        </a>

        <a class="app-action-card" href="{{ route('teacher-evidence.index') }}">
            <span class="app-action-icon">📂</span>
            <span class="app-action-text">
                <strong>متابعة ملفات المعلمات</strong>
                <small>اختيار معلمة ثم معيار ثم عرض الملفات.</small>
            </span>
        </a>
    </div>
</div>
@endsection
