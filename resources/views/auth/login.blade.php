@extends('layouts.app')

@section('content')
<div class="login-shell">
    <div class="card login-card">
        <div class="login-logo">A</div>
        <h2>تسجيل الدخول</h2>
        <p class="muted">أدخلي اسم المستخدم والرقم السري للدخول إلى منصة Amal.</p>

        <form method="POST" action="{{ route('login.post') }}">
            @csrf

            <label>
                اسم المستخدم
                <input type="text" name="username" value="{{ old('username') }}" required autofocus autocomplete="username" placeholder="مثال: amal">
            </label>

            <label>
                الرقم السري
                <input type="password" name="password" autocomplete="current-password" inputmode="numeric" maxlength="4" placeholder="4 خانات">
            </label>

            <label style="display:flex !important;align-items:center;gap:8px;font-weight:900;">
                <input type="checkbox" name="remember" value="1" style="width:auto !important;min-height:auto !important;margin:0 !important;">
                تذكرني
            </label>

            <button class="btn" type="submit">دخول</button>
        </form>
    </div>
</div>
@endsection
