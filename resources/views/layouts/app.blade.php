<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
    <meta charset="UTF-8">
    <title>@yield('title', 'منصة التميز المدرسي') | المتوسطة ١١٢</title>
    <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
    <meta name="theme-color" content="#7560a8">
    <meta name="csrf-token" content="{{ csrf_token() }}">
    <link rel="manifest" href="{{ route('pwa.manifest') }}">
    <link rel="apple-touch-icon" href="{{ route('pwa.icon') }}">
    @if(file_exists(public_path('build/manifest.json')) || file_exists(public_path('hot')))
        @vite(['resources/css/app.css', 'resources/js/app.jsx', 'resources/js/evidence-show.jsx', 'resources/js/settings.jsx', 'resources/js/teacher-evidence.jsx'])
    @endif
    <link rel="stylesheet" href="{{ asset('css/school-theme.css') }}?v=1448-2">
    <link rel="stylesheet" href="{{ asset('css/school-back.css') }}?v=2">
</head>
<body class="@auth app-auth @else app-guest @endauth">
<a class="skip-link" href="#main-content">انتقلي إلى المحتوى</a>
@auth
@php
$isPrincipal = auth()->user()->isPrincipal();
$navigation = [
    ['route' => 'dashboard', 'active' => ['dashboard'], 'label' => 'الرئيسية', 'icon' => 'home'],
    ['route' => $isPrincipal ? 'evidence.index' : 'teacher-assessment.mine', 'active' => ['evidence.*', 'teacher-assessment.mine'], 'label' => $isPrincipal ? 'معايير التقييم' : 'معايير تقييمي', 'icon' => 'check'],
];
if ($isPrincipal) {
    $navigation[] = ['route' => 'teacher-evidence.index', 'active' => ['teacher-evidence.*'], 'label' => 'متابعة المعلمات', 'icon' => 'folder'];
    $navigation[] = ['route' => 'teacher-assessment.indicators.index', 'active' => ['teacher-assessment.indicators.*'], 'label' => 'إدارة المؤشرات', 'icon' => 'check'];
    $navigation[] = ['route' => 'teachers.index', 'active' => ['teachers.*'], 'label' => 'إدارة المعلمات', 'icon' => 'users'];
    $navigation[] = ['route' => 'settings.index', 'active' => ['settings.*'], 'label' => 'الإعدادات', 'icon' => 'settings'];
}
@endphp
<header class="mobile-appbar">
    <a class="mobile-app-title" href="{{ route('dashboard') }}" aria-label="المتوسطة ١١٢، الرئيسية">
        <img class="mobile-logo" src="{{ asset('images/school-logo.svg') }}" alt="" width="46" height="46">
        <span class="mobile-title-text"><strong>المتوسطة ١١٢</strong><span>منصة التميز المدرسي</span></span>
    </a>
    <div class="mobile-header-actions">
        <span class="mobile-role">{{ $isPrincipal ? 'مديرة المدرسة' : 'معلمة' }}</span>
        <form class="logout-form" method="POST" action="{{ route('logout') }}">@csrf<button class="icon-button" type="submit" aria-label="تسجيل الخروج" title="تسجيل الخروج"><x-ui-icon name="logout" size="20" /></button></form>
    </div>
</header>
@endauth
<div class="page">
    @auth
    <aside class="sidebar" aria-label="القائمة الرئيسية">
        <a class="brand" href="{{ route('dashboard') }}">
            <img class="sidebar-school-mark" src="{{ asset('images/school-logo.svg') }}" alt="شعار المتوسطة ١١٢" width="56" height="62">
            <span>المتوسطة ١١٢<small>منصة التميز المدرسي</small></span>
        </a>
        <span class="sidebar-label">مساحتك المدرسية</span>
        <nav class="nav">
            @foreach($navigation as $item)
            <a class="{{ request()->routeIs($item['active']) ? 'active' : '' }}" @if(request()->routeIs($item['active'])) aria-current="page" @endif href="{{ route($item['route']) }}"><x-ui-icon :name="$item['icon']" /><span>{{ $item['label'] }}</span></a>
            @endforeach
        </nav>
        <div class="sidebar-note"><x-ui-icon name="sparkles" size="28" /><strong>كل إنجاز يستحق التوثيق</strong><p>مساحة واحدة تجمع الشواهد، وتسهّل المتابعة، وتبرز التميز.</p></div>
        <div class="sidebar-user">
            <span class="user-avatar">{{ mb_substr(auth()->user()->name, 0, 1) }}</span>
            <div><strong>{{ auth()->user()->name }}</strong><small>{{ $isPrincipal ? 'مديرة المدرسة' : 'معلمة' }}</small></div>
            <form class="logout-form" method="POST" action="{{ route('logout') }}">@csrf<button class="icon-button" type="submit" aria-label="تسجيل الخروج" title="تسجيل الخروج"><x-ui-icon name="logout" size="20" /></button></form>
        </div>
    </aside>
    @endauth
    <div class="workspace">
        @auth
        <div class="topbar">
            <div class="breadcrumb"><span>مساحتي المدرسية</span><span aria-hidden="true">/</span><strong>@yield('title', 'لوحة التحكم')</strong></div>
            <div class="topbar-meta"><span class="school-year">العام الدراسي ١٤٤٨ هـ</span><span class="topbar-avatar">{{ mb_substr(auth()->user()->name, 0, 1) }}</span></div>
        </div>
        @endauth
        <main class="content" id="main-content" tabindex="-1">
            @if(session('success'))<div class="alert success" role="status">{{ session('success') }}</div>@endif
            @if($errors->any())<div class="alert error" role="alert">@foreach($errors->all() as $error)<div>{{ $error }}</div>@endforeach</div>@endif
            @yield('content')
            @auth
                @unless(request()->routeIs('dashboard', 'password.setup'))
                    @php
                        $backFallback = match (true) {
                            request()->routeIs('teacher-evidence.teacher', 'teacher-evidence.uploads') => route('teacher-evidence.index'),
                            request()->routeIs('evidence.show', 'evidence.create', 'evidence.edit') => route('evidence.index'),
                            request()->routeIs('teachers.edit') => route('teachers.index'),
                            default => route('dashboard'),
                        };
                    @endphp
                    <nav class="school-back-nav" aria-label="الرجوع للصفحة السابقة">
                        <a class="school-back-link" data-school-back href="{{ $backFallback }}">
                            <span class="school-back-arrow" aria-hidden="true">→</span>
                            <span>رجوع للصفحة السابقة</span>
                        </a>
                    </nav>
                @endunless
            @endauth
        </main>
        @auth<footer class="workspace-footer">المتوسطة الثانية عشر بعد المئة <span>ننجز بإبداع، ونوثّق بتميّز</span></footer>@endauth
    </div>
</div>
@auth
<nav class="bottom-tabs" style="--tabs-count:{{ $isPrincipal ? 4 : 2 }}" aria-label="التنقل السريع">
    @foreach($navigation as $item)
        @if(!in_array($item['route'], ['teachers.index', 'teacher-assessment.indicators.index']))
        <a class="{{ request()->routeIs($item['active']) || ($item['route'] === 'settings.index' && request()->routeIs('teachers.*')) ? 'active' : '' }}" @if(request()->routeIs($item['active'])) aria-current="page" @endif href="{{ route($item['route']) }}"><x-ui-icon :name="$item['icon']" size="22" /><span>{{ $item['label'] }}</span></a>
        @endif
    @endforeach
</nav>
@endauth
    <script src="{{ asset('js/school-back.js') }}?v=1" defer></script>
</body>
</html>
