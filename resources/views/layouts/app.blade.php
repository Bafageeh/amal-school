<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
    <meta charset="UTF-8">
    <title>{{ config('app.name', 'إدارة مدرسية') }}</title>
    <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
    <meta name="theme-color" content="#2563eb">
    <link rel="manifest" href="{{ route('pwa.manifest') }}">
    <link rel="apple-touch-icon" href="{{ route('pwa.icon') }}">
    @vite(['resources/css/app.css', 'resources/js/app.jsx'])

    <style>
        :root {
            --bg: #eef4ff;
            --surface: rgba(255,255,255,.88);
            --surface-solid: #ffffff;
            --text: #0f172a;
            --muted: #64748b;
            --primary: #2563eb;
            --primary-dark: #1d4ed8;
            --green: #16a34a;
            --red: #dc2626;
            --border: rgba(148,163,184,.28);
            --shadow: 0 18px 45px rgba(15,23,42,.10);
            --radius: 24px;
        }
        * { box-sizing: border-box; }
        html { min-height: 100%; }
        body {
            margin: 0;
            font-family: Tahoma, Arial, sans-serif;
            background:
                radial-gradient(circle at top right, rgba(37,99,235,.18), transparent 32rem),
                radial-gradient(circle at bottom left, rgba(14,165,233,.14), transparent 28rem),
                var(--bg);
            color: var(--text);
            min-height: 100vh;
        }
        a { text-decoration: none; color: inherit; }
        .page {
            min-height: 100vh;
            max-width: 1280px;
            margin: 0 auto;
            padding: 18px;
            display: grid;
            grid-template-columns: 290px minmax(0, 1fr);
            gap: 18px;
        }
        .sidebar {
            position: sticky;
            top: 18px;
            height: calc(100vh - 36px);
            background: linear-gradient(180deg, #0f172a 0%, #172554 100%);
            color: #fff;
            padding: 20px;
            border-radius: 32px;
            box-shadow: var(--shadow);
            overflow: auto;
        }
        .brand {
            display: flex;
            align-items: center;
            gap: 10px;
            font-size: 22px;
            font-weight: 800;
            margin-bottom: 14px;
        }
        .brand::before {
            content: 'A';
            width: 44px;
            height: 44px;
            display: grid;
            place-items: center;
            border-radius: 16px;
            background: rgba(255,255,255,.14);
            color: #fff;
            font-weight: 900;
            border: 1px solid rgba(255,255,255,.18);
        }
        .school {
            padding: 14px;
            border-radius: 22px;
            background: rgba(255,255,255,.10);
            border: 1px solid rgba(255,255,255,.12);
            color: #dbeafe;
            margin-bottom: 18px;
            line-height: 1.9;
        }
        .nav {
            display: grid;
            gap: 10px;
        }
        .nav a, .logout-btn {
            display: flex;
            align-items: center;
            justify-content: space-between;
            width: 100%;
            min-height: 52px;
            padding: 13px 15px;
            border-radius: 18px;
            margin: 0;
            background: rgba(255,255,255,.08);
            color: #f8fafc;
            border: 1px solid rgba(255,255,255,.10);
            text-align: right;
            font-size: 15px;
            cursor: pointer;
            transition: .18s ease;
        }
        .nav a::after, .logout-btn::after { content: '›'; opacity: .65; }
        .nav a:hover, .logout-btn:hover {
            background: rgba(255,255,255,.16);
            transform: translateY(-1px);
        }
        .logout-btn {
            font-family: inherit;
        }
        .content {
            min-width: 0;
            padding: 0;
        }
        .topbar {
            position: sticky;
            top: 18px;
            z-index: 5;
            background: rgba(255,255,255,.78);
            backdrop-filter: blur(18px);
            padding: 16px 18px;
            border-radius: 26px;
            margin-bottom: 18px;
            box-shadow: var(--shadow);
            border: 1px solid rgba(255,255,255,.72);
            display: flex;
            justify-content: space-between;
            gap: 12px;
            align-items: center;
        }
        .topbar strong {
            font-size: 20px;
        }
        .card {
            background: var(--surface);
            backdrop-filter: blur(14px);
            border: 1px solid rgba(255,255,255,.72);
            border-radius: var(--radius);
            padding: 20px;
            box-shadow: var(--shadow);
            margin-bottom: 18px;
        }
        .hero-card {
            display: flex;
            justify-content: space-between;
            gap: 18px;
            align-items: center;
            padding: 28px;
            border-radius: 32px;
            color: #fff;
            background: linear-gradient(135deg, #2563eb, #0f172a);
            box-shadow: var(--shadow);
            margin-bottom: 18px;
            overflow: hidden;
            position: relative;
        }
        .hero-card::after {
            content: '';
            position: absolute;
            width: 220px;
            height: 220px;
            border-radius: 999px;
            background: rgba(255,255,255,.12);
            left: -70px;
            top: -70px;
        }
        .hero-card h1 {
            margin: 6px 0 8px;
            font-size: clamp(28px, 5vw, 42px);
        }
        .hero-card p { margin: 0; color: #dbeafe; }
        .hero-kicker {
            display: inline-flex;
            padding: 7px 12px;
            border-radius: 999px;
            background: rgba(255,255,255,.14);
            border: 1px solid rgba(255,255,255,.18);
            color: #eff6ff;
            font-size: 13px;
        }
        .hero-badge {
            position: relative;
            z-index: 1;
            min-width: 92px;
            min-height: 92px;
            border-radius: 28px;
            display: grid;
            place-items: center;
            background: rgba(255,255,255,.15);
            border: 1px solid rgba(255,255,255,.18);
            font-weight: 800;
        }
        .grid, .app-stats-grid {
            display: grid;
            grid-template-columns: repeat(3, minmax(0, 1fr));
            gap: 16px;
            margin-bottom: 18px;
        }
        .stat, .app-stat {
            background: var(--surface-solid);
            border-radius: 24px;
            padding: 20px;
            box-shadow: var(--shadow);
            border: 1px solid var(--border);
        }
        .app-stat {
            display: flex;
            gap: 14px;
            align-items: center;
        }
        .app-stat-icon {
            width: 54px;
            height: 54px;
            display: grid;
            place-items: center;
            border-radius: 20px;
            font-size: 26px;
        }
        .app-stat-blue .app-stat-icon { background: #dbeafe; }
        .app-stat-green .app-stat-icon { background: #dcfce7; }
        .app-stat-purple .app-stat-icon { background: #f3e8ff; }
        .app-stat-label, .stat { color: var(--muted); }
        .stat .num, .app-stat-value {
            font-size: 34px;
            font-weight: 900;
            margin-top: 3px;
            color: var(--text);
        }
        .section-heading {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 12px;
            margin-bottom: 14px;
        }
        .section-heading h3, .card h3 { margin-top: 0; }
        .app-actions-grid {
            display: grid;
            grid-template-columns: repeat(3, minmax(0, 1fr));
            gap: 12px;
        }
        .app-action-card {
            display: flex;
            gap: 12px;
            align-items: center;
            padding: 15px;
            border-radius: 22px;
            background: #f8fafc;
            border: 1px solid var(--border);
            transition: .18s ease;
        }
        .app-action-card:hover {
            transform: translateY(-2px);
            box-shadow: 0 14px 32px rgba(15,23,42,.10);
        }
        .app-action-icon {
            width: 48px;
            height: 48px;
            display: grid;
            place-items: center;
            border-radius: 18px;
            background: #e0f2fe;
            font-size: 24px;
        }
        .app-action-text { display: grid; gap: 4px; }
        .app-action-text small { color: var(--muted); line-height: 1.5; }
        .uploads-list {
            display: grid;
            gap: 12px;
        }
        .upload-card {
            padding: 14px;
            border-radius: 22px;
            background: #f8fafc;
            border: 1px solid var(--border);
        }
        .upload-card-main {
            display: flex;
            align-items: center;
            gap: 12px;
        }
        .upload-file-icon {
            width: 46px;
            height: 46px;
            display: grid;
            place-items: center;
            border-radius: 17px;
            background: #dbeafe;
        }
        .upload-card-footer {
            margin-top: 12px;
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 10px;
            color: var(--muted);
            font-size: 13px;
        }
        .teacher-chip {
            display: inline-flex;
            margin-top: 8px;
            padding: 5px 10px;
            border-radius: 999px;
            background: #eef2ff;
            color: #3730a3;
            font-size: 12px;
        }
        .empty-state {
            display: grid;
            place-items: center;
            gap: 8px;
            text-align: center;
            padding: 34px 18px;
            border-radius: 24px;
            background: #f8fafc;
            border: 1px dashed #cbd5e1;
            color: var(--muted);
        }
        .empty-state strong { color: var(--text); }
        .empty-icon { font-size: 34px; }
        .btn {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            gap: 7px;
            border: 0;
            border-radius: 16px;
            padding: 11px 16px;
            cursor: pointer;
            font-size: 14px;
            font-weight: 700;
            background: var(--primary);
            color: #fff;
            min-height: 44px;
        }
        .btn.gray { background: #64748b; }
        .btn.red { background: var(--red); }
        .btn.green { background: var(--green); }
        .btn.light {
            background: #e2e8f0;
            color: #0f172a;
        }
        input, textarea, select {
            width: 100%;
            padding: 13px 14px;
            border: 1px solid #cbd5e1;
            border-radius: 16px;
            margin-top: 8px;
            font-family: inherit;
            background: #fff;
            outline: none;
        }
        input:focus, textarea:focus, select:focus {
            border-color: var(--primary);
            box-shadow: 0 0 0 4px rgba(37,99,235,.12);
        }
        label {
            display: block;
            margin-bottom: 14px;
            font-weight: 800;
        }
        table {
            width: 100%;
            border-collapse: separate;
            border-spacing: 0 10px;
            background: transparent;
        }
        th, td {
            padding: 14px;
            text-align: right;
            vertical-align: middle;
        }
        th {
            color: var(--muted);
            font-size: 13px;
            font-weight: 800;
        }
        tbody tr {
            background: #fff;
            box-shadow: 0 10px 24px rgba(15,23,42,.06);
        }
        tbody td:first-child { border-radius: 0 18px 18px 0; }
        tbody td:last-child { border-radius: 18px 0 0 18px; }
        .alert {
            padding: 14px 16px;
            border-radius: 18px;
            margin-bottom: 15px;
            box-shadow: var(--shadow);
        }
        .alert.success { background: #dcfce7; color: #166534; }
        .alert.error { background: #fee2e2; color: #991b1b; }
        .actions {
            display: flex;
            gap: 8px;
            flex-wrap: wrap;
        }
        .muted { color: var(--muted); font-size: 13px; }
        @media (max-width: 980px) {
            .page {
                display: block;
                padding: 12px;
                padding-bottom: 96px;
            }
            .sidebar {
                position: static;
                height: auto;
                border-radius: 26px;
                margin-bottom: 14px;
            }
            .nav {
                grid-template-columns: repeat(2, minmax(0, 1fr));
            }
            .topbar {
                position: static;
                border-radius: 22px;
            }
            .grid, .app-stats-grid, .app-actions-grid {
                grid-template-columns: 1fr;
            }
        }
        @media (max-width: 680px) {
            .brand { font-size: 20px; }
            .school { margin-bottom: 12px; }
            .nav {
                display: flex;
                gap: 8px;
                overflow-x: auto;
                padding-bottom: 3px;
            }
            .nav a, .logout-btn {
                white-space: nowrap;
                min-width: max-content;
                min-height: 46px;
                padding: 10px 13px;
            }
            .nav a::after, .logout-btn::after { content: none; }
            .content { padding: 0; }
            .hero-card {
                display: block;
                padding: 22px;
                border-radius: 26px;
            }
            .hero-badge {
                width: fit-content;
                min-width: 0;
                min-height: 0;
                padding: 10px 14px;
                margin-top: 16px;
                border-radius: 999px;
            }
            .card { padding: 16px; border-radius: 22px; }
            table, thead, tbody, tr, th, td { display: block; }
            thead { display: none; }
            tbody tr {
                margin-bottom: 12px;
                padding: 12px;
                border-radius: 20px;
            }
            tbody td {
                padding: 8px 4px;
                border-radius: 0 !important;
            }
            .actions .btn, td .btn { width: 100%; }
        }
    </style>
</head>
<body>
<div class="page">
    @auth
        <aside class="sidebar">
            <div class="brand">Amal</div>
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
                    <a href="{{ route('teacher-evidence.index') }}">متابعة الملفات</a>
                    <a href="{{ route('teachers.index') }}">المعلمات</a>
                @endif

                <form method="POST" action="{{ route('logout') }}">
                    @csrf
                    <button class="logout-btn" type="submit">خروج</button>
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
