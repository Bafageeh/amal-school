@extends('layouts.app')

@section('content')
<div style="max-width:460px;margin:70px auto;">
    <div class="card">
        <h2 style="margin-top:0;">تسجيل الدخول</h2>
        <p class="muted">أدخلي اسم المستخدم. إذا كان الحساب جديدًا بدون رقم سري فاتركي خانة الرقم السري فارغة.</p>

        <form method="POST" action="{{ route('login.post') }}">
            @csrf

            <label>
                اسم المستخدم
                <input type="text" name="username" value="{{ old('username') }}" required autofocus autocomplete="username">
            </label>

            <label>
                الرقم السري
                <input type="password" name="password" autocomplete="current-password" inputmode="numeric" maxlength="4">
            </label>

            <label style="font-weight:normal;">
                <input type="checkbox" name="remember" value="1" style="width:auto;">
                تذكرني
            </label>

            <button class="btn" type="submit" style="width:100%;">دخول</button>
        </form>
    </div>
</div>
@endsection
