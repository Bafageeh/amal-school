@extends('layouts.app')

@section('content')
<div style="max-width:460px;margin:70px auto;">
    <div class="card">
        <h2 style="margin-top:0;">تسجيل الدخول</h2>
        <p class="muted">ادخلي البريد الإلكتروني وكلمة المرور</p>

        <form method="POST" action="{{ route('login.post') }}">
            @csrf

            <label>
                البريد الإلكتروني
                <input type="email" name="email" value="{{ old('email') }}" required autofocus>
            </label>

            <label>
                كلمة المرور
                <input type="password" name="password" required>
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
