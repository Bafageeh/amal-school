<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
    <meta charset="UTF-8">
    <title>{{ config('app.name', 'إدارة مدرسية') }}</title>
    <meta name="viewport" content="width=device-width, initial-scale=1">

    <style>
        * { box-sizing: border-box; }
        body {
            margin: 0;
            font-family: Tahoma, Arial, sans-serif;
            background: #f4f6f8;
            color: #1f2937;
        }
        a { text-decoration: none; color: inherit; }
        .page { display: flex; min-height: 100vh; }
        .sidebar {
            width: 260px;
            background: #111827;
            color: #fff;
            padding: 22px;
        }
        .brand {
            font-size: 22px;
            font-weight: bold;
            margin-bottom: 8px;
        }
        .school {
            font-size: 13px;
            color: #cbd5e1;
            margin-bottom: 22px;
        }
        .nav a, .logout-btn {
            display: block;
            width: 100%;
            padding: 12px 14px;
            border-radius: 12px;
            margin-bottom: 8px;
            background: transparent;
            color: #e5e7eb;
            border: 0;
            text-align: right;
            font-size: 15px;
            cursor: pointer;
        }
        .nav a:hover, .logout-btn:hover {
            background: #1f2937;
        }
        .content {
            flex: 1;
            padding: 28px;
        }
        .topbar {
            background: #fff;
            padding: 18px 22px;
            border-radius: 18px;
            margin-bottom: 22px;
            box-shadow: 0 8px 25px rgba(15,23,42,.06);
            display: flex;
            justify-content: space-between;
            gap: 12px;
            align-items: center;
        }
        .card {
            background: #fff;
            border-radius: 18px;
            padding: 20px;
            box-shadow: 0 8px 25px rgba(15,23,42,.06);
            margin-bottom: 18px;
        }
        .grid {
            display: grid;
            grid-template-columns: repeat(3, minmax(0, 1fr));
            gap: 16px;
        }
        .stat {
            background: #fff;
            border-radius: 18px;
            padding: 22px;
            box-shadow: 0 8px 25px rgba(15,23,42,.06);
        }
        .stat .num {
            font-size: 34px;
            font-weight: bold;
            margin-top: 8px;
        }
        .btn {
            display: inline-block;
            border: 0;
            border-radius: 12px;
            padding: 10px 15px;
            cursor: pointer;
            font-size: 14px;
            background: #2563eb;
            color: #fff;
        }
        .btn.gray { background: #6b7280; }
        .btn.red { background: #dc2626; }
        .btn.green { background: #16a34a; }
        .btn.light {
            background: #e5e7eb;
            color: #111827;
        }
        input, textarea, select {
            width: 100%;
            padding: 12px;
            border: 1px solid #d1d5db;
            border-radius: 12px;
            margin-top: 6px;
            font-family: inherit;
        }
        label {
            display: block;
            margin-bottom: 14px;
            font-weight: bold;
        }
        table {
            width: 100%;
            border-collapse: collapse;
            background: #fff;
            overflow: hidden;
            border-radius: 16px;
        }
        th, td {
            padding: 13px;
            border-bottom: 1px solid #e5e7eb;
            text-align: right;
            vertical-align: middle;
        }
        th {
            background: #f9fafb;
        }
        .alert {
            padding: 13px 15px;
            border-radius: 12px;
            margin-bottom: 15px;
        }
        .alert.success { background: #dcfce7; color: #166534; }
        .alert.error { background: #fee2e2; color: #991b1b; }
        .actions {
            display: flex;
            gap: 8px;
            flex-wrap: wrap;
        }
        .muted { color: #6b7280; font-size: 13px; }
        @media (max-width: 800px) {
            .page { display: block; }
            .sidebar { width: 100%; }
            .grid { grid-template-columns: 1fr; }
            .topbar { display: block; }
            .content { padding: 16px; }
        }
    </style>
</head>
<body>
<div class="page">
    @auth
        <aside class="sidebar">
            <div class="brand">إدارة مدرسية</div>
            <div class="school">
                {{ auth()->user()->school?->name ?? 'مدرسة' }}<br>
                {{ auth()->user()->name }}
                —
                {{ auth()->user()->role === 'principal' ? 'مديرة' : 'معلمة' }}
            </div>

            <nav class="nav">
                <a href="{{ route('dashboard') }}">الرئيسية</a>
                <a href="{{ route('evidence.index') }}">معايير التقييم</a>

                @if(auth()->user()->isPrincipal())
                    <a href="{{ route('teacher-evidence.index') }}">متابعة ملفات المعلمات</a>
                    <a href="{{ route('teachers.index') }}">المعلمات</a>
                @endif

                <form method="POST" action="{{ route('logout') }}">
                    @csrf
                    <button class="logout-btn" type="submit">تسجيل الخروج</button>
                </form>
            </nav>
        </aside>
    @endauth

    <main class="content">
        @auth
            <div class="topbar">
                <div>
                    <strong>@yield('title', 'لوحة التحكم')</strong>
                    <div class="muted">مرحبًا {{ auth()->user()->name }}</div>
                </div>
            </div>
        @endauth

        @if(session('success'))
            <div class="alert success">{{ session('success') }}</div>
        @endif

        @if($errors->any())
            <div class="alert error">
                @foreach($errors->all() as $error)
                    <div>{{ $error }}</div>
                @endforeach
            </div>
        @endif

        @yield('content')
    </main>
</div>
</body>
</html>
