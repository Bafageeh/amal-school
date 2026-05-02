<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
    <meta charset="UTF-8">
    <title>{{ config('app.name', 'Amal') }}</title>
    <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
    <meta name="theme-color" content="#0f172a">
    <meta name="csrf-token" content="{{ csrf_token() }}">
    <link rel="manifest" href="{{ route('pwa.manifest') }}">
    <link rel="apple-touch-icon" href="{{ route('pwa.icon') }}">
    @if(file_exists(public_path('build/manifest.json')) || file_exists(public_path('hot')))
        @vite(['resources/css/app.css', 'resources/js/app.jsx', 'resources/js/evidence-show.jsx', 'resources/js/settings.jsx', 'resources/js/teacher-evidence.jsx'])
    @endif
    <style>
        :root{--bg:#eef4ff;--text:#0f172a;--muted:#64748b;--primary:#2563eb;--green:#16a34a;--red:#dc2626;--shadow:0 18px 45px rgba(15,23,42,.10);--border:rgba(148,163,184,.28)}
        *{box-sizing:border-box}body{margin:0;font-family:Tahoma,Arial,sans-serif;background:radial-gradient(circle at top right,rgba(37,99,235,.18),transparent 30rem),var(--bg);color:var(--text);padding-bottom:96px}a{text-decoration:none;color:inherit}.mobile-appbar{display:none}.page{min-height:100vh;max-width:1280px;margin:auto;padding:18px;display:grid;grid-template-columns:290px 1fr;gap:18px}.sidebar{position:sticky;top:18px;height:calc(100vh - 36px);background:linear-gradient(180deg,#0f172a,#172554);color:#fff;padding:20px;border-radius:32px;box-shadow:var(--shadow);overflow:auto}.brand{display:flex;align-items:center;gap:10px;font-size:24px;font-weight:900;margin-bottom:14px}.brand:before,.mobile-logo{content:'A';width:44px;height:44px;display:grid;place-items:center;border-radius:16px;background:rgba(255,255,255,.14);font-weight:900}.school{padding:14px;border-radius:22px;background:rgba(255,255,255,.10);color:#dbeafe;margin-bottom:18px;line-height:1.9}.nav{display:grid;gap:10px}.nav a,.logout-btn{display:flex;align-items:center;justify-content:space-between;width:100%;min-height:52px;padding:13px 15px;border-radius:18px;background:rgba(255,255,255,.08);color:#fff;border:1px solid rgba(255,255,255,.10);font:inherit;cursor:pointer}.content{min-width:0}.topbar,.card,.stat,.app-stat{background:rgba(255,255,255,.90);border:1px solid rgba(255,255,255,.72);border-radius:24px;padding:20px;box-shadow:var(--shadow);margin-bottom:18px}.topbar{position:sticky;top:18px;z-index:5;padding:16px 18px}.hero-card{display:flex;justify-content:space-between;gap:18px;align-items:center;padding:28px;border-radius:32px;color:#fff;background:linear-gradient(135deg,#2563eb,#0f172a);box-shadow:var(--shadow);margin-bottom:18px}.hero-card h1{margin:6px 0 8px;font-size:clamp(28px,5vw,42px)}.hero-card p{margin:0;color:#dbeafe}.hero-kicker,.hero-badge{display:inline-flex;padding:8px 12px;border-radius:999px;background:rgba(255,255,255,.15)}.hero-badge{min-width:92px;min-height:92px;align-items:center;justify-content:center;font-weight:800}.grid,.app-stats-grid,.app-actions-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:16px;margin-bottom:18px}.app-stat{display:flex;align-items:center;gap:14px}.app-stat-icon,.app-action-icon,.upload-file-icon{width:52px;height:52px;display:grid;place-items:center;border-radius:18px;background:#dbeafe;font-size:25px}.app-stat-value{font-size:34px;font-weight:900;color:var(--text)}.muted,.app-stat-label{color:var(--muted);font-size:13px}.app-action-card,.upload-card{display:flex;gap:12px;align-items:center;padding:15px;border-radius:22px;background:#f8fafc;border:1px solid var(--border)}.uploads-list{display:grid;gap:12px}.upload-card{display:block}.upload-card-main{display:flex;gap:12px;align-items:center}.upload-card-footer{display:flex;justify-content:space-between;align-items:center;margin-top:12px;color:var(--muted);font-size:13px}.teacher-chip{display:inline-flex;margin-top:8px;padding:5px 10px;border-radius:999px;background:#eef2ff;color:#3730a3;font-size:12px}.empty-state{text-align:center;padding:34px 18px;border-radius:24px;background:#f8fafc;border:1px dashed #cbd5e1;color:var(--muted)}.btn{display:inline-flex;align-items:center;justify-content:center;border:0;border-radius:16px;padding:11px 16px;min-height:44px;background:var(--primary);color:#fff;font-weight:700;cursor:pointer}.btn.gray{background:#64748b}.btn.red{background:var(--red)}.btn.green{background:var(--green)}.btn.light{background:#e2e8f0;color:#0f172a}input,textarea,select{width:100%;padding:13px 14px;border:1px solid #cbd5e1;border-radius:16px;margin-top:8px;font-family:inherit;background:#fff}label{display:block;margin-bottom:14px;font-weight:800}.alert{padding:14px 16px;border-radius:18px;margin-bottom:15px;box-shadow:var(--shadow)}.alert.success{background:#dcfce7;color:#166534}.alert.error{background:#fee2e2;color:#991b1b}.actions{display:flex;gap:8px;flex-wrap:wrap}.web-version-marker{position:fixed;left:10px;top:10px;z-index:100000;background:#16a34a;color:#fff;border-radius:999px;padding:6px 10px;font-size:11px;font-weight:900;box-shadow:0 10px 22px rgba(15,23,42,.18)}.bottom-tabs{position:fixed;left:50%;bottom:max(12px,env(safe-area-inset-bottom));transform:translateX(-50%);z-index:99999;width:min(560px,calc(100% - 24px));min-height:72px;padding:8px;display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:6px;background:rgba(15,23,42,.92);border-radius:26px;box-shadow:0 18px 45px rgba(15,23,42,.24);direction:rtl}.bottom-tabs a{display:grid;place-items:center;gap:4px;padding:8px 6px;border-radius:20px;color:#cbd5e1;font-size:11px;font-weight:800}.bottom-tabs a.active{background:#fff;color:#0f172a}.bottom-tabs span{font-size:21px;line-height:1}@media(max-width:980px){body{background:linear-gradient(180deg,#eaf3ff 0%,#f8fbff 58%,#eef4ff 100%);padding-bottom:104px}.mobile-appbar{position:sticky;top:0;z-index:50;display:flex;align-items:center;justify-content:space-between;gap:12px;padding:12px 14px;background:rgba(248,251,255,.86);backdrop-filter:blur(18px);border-bottom:1px solid rgba(148,163,184,.20)}.mobile-app-title{display:flex;align-items:center;gap:10px;min-width:0}.mobile-logo{width:42px;height:42px;background:linear-gradient(135deg,#2563eb,#0f172a);color:#fff;box-shadow:0 12px 28px rgba(37,99,235,.22)}.mobile-title-text{display:grid;gap:2px;min-width:0}.mobile-title-text strong{font-size:18px}.mobile-title-text span{color:var(--muted);font-size:12px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.mobile-role{padding:8px 12px;border-radius:999px;background:#e0ecff;color:#1d4ed8;font-size:12px;font-weight:900}.page{display:block;padding:12px}.sidebar,.topbar{display:none}.content{padding:0}.grid,.app-stats-grid,.app-actions-grid{grid-template-columns:1fr;gap:12px}.hero-card{display:block;padding:20px;border-radius:28px;margin-bottom:14px}.hero-card h1{font-size:30px;line-height:1.35}.hero-badge{min-width:0;min-height:0;margin-top:14px;padding:10px 14px}.card,.app-stat{border-radius:26px;padding:16px;margin-bottom:14px;box-shadow:0 14px 34px rgba(15,23,42,.08)}.upload-card,.app-action-card{border-radius:24px;padding:16px;background:#fff}.upload-card-footer{align-items:stretch;flex-direction:column}.actions{width:100%;display:grid;grid-template-columns:1fr;gap:8px}.btn{width:100%;min-height:48px}.bottom-tabs{width:calc(100% - 24px);min-height:76px;border-radius:28px;background:rgba(15,23,42,.94)}}@media(min-width:981px){body{padding-bottom:0}.bottom-tabs{display:none}}
    </style>
</head>
<body>
<div class="web-version-marker">WEB RN/API 2026-05-02</div>
@auth
<header class="mobile-appbar">
    <div class="mobile-app-title">
        <div class="mobile-logo">A</div>
        <div class="mobile-title-text">
            <strong>Amal</strong>
            <span>{{ auth()->user()->school?->name ?? 'مدرسة' }} — {{ auth()->user()->name }}</span>
        </div>
    </div>
    <div class="mobile-role">{{ auth()->user()->role === 'principal' ? 'مديرة' : 'معلمة' }}</div>
</header>
@endauth
<div class="page">
    @auth
        <aside class="sidebar">
            <div class="brand">Amal</div>
            <div class="school">{{ auth()->user()->school?->name ?? 'مدرسة' }}<br>{{ auth()->user()->name }} — {{ auth()->user()->role === 'principal' ? 'مديرة' : 'معلمة' }}</div>
            <nav class="nav">
                <a href="{{ route('dashboard') }}">الرئيسية</a>
                <a href="{{ route('evidence.index') }}">معايير التقييم</a>
                @if(auth()->user()->isPrincipal())<a href="{{ route('settings.index') }}">الإعدادات</a>@endif
                <form method="POST" action="{{ route('logout') }}">@csrf<button class="logout-btn" type="submit">خروج</button></form>
            </nav>
        </aside>
    @endauth
    <main class="content">
        @auth<div class="topbar"><strong>@yield('title','لوحة التحكم')</strong><div class="muted">مرحبًا {{ auth()->user()->name }}</div></div>@endauth
        @if(session('success'))<div class="alert success">{{ session('success') }}</div>@endif
        @if($errors->any())<div class="alert error">@foreach($errors->all() as $error)<div>{{ $error }}</div>@endforeach</div>@endif
        @yield('content')
    </main>
</div>
@auth
<nav class="bottom-tabs">
    <a class="{{ request()->routeIs('dashboard') ? 'active' : '' }}" href="{{ route('dashboard') }}"><span>🏠</span><div>الرئيسية</div></a>
    <a class="{{ request()->routeIs('evidence.*') ? 'active' : '' }}" href="{{ route('evidence.index') }}"><span>✅</span><div>معايير التقييم</div></a>
    @if(auth()->user()->isPrincipal())<a class="{{ request()->routeIs('settings.*') || request()->routeIs('teachers.*') || request()->routeIs('teacher-evidence.*') ? 'active' : '' }}" href="{{ route('settings.index') }}"><span>⚙️</span><div>الإعدادات</div></a>@endif
</nav>
@endauth
</body>
</html>
