@extends('layouts.app')

@section('title', 'تعيين الرقم السري')

@section('content')
<div class="login-shell">
    <div class="card login-card">
        <div class="login-logo">A</div>
        <h2>تعيين الرقم السري</h2>
        <p class="muted">هذا أول دخول لك. أدخلي رقمًا سريًا جديدًا من 4 خانات.</p>

        <form method="POST" action="{{ route('password.setup.store') }}">
            @csrf

            <label>
                الرقم السري الجديد
                <input type="password" name="password" required minlength="4" maxlength="4" inputmode="numeric" pattern="[0-9]{4}" autocomplete="new-password" autofocus placeholder="4 خانات">
            </label>

            <label>
                تأكيد الرقم السري
                <input type="password" name="password_confirmation" required minlength="4" maxlength="4" inputmode="numeric" pattern="[0-9]{4}" autocomplete="new-password" placeholder="أعيدي الرقم السري">
            </label>

            <button class="btn" type="submit">حفظ الرقم السري</button>
        </form>
    </div>
</div>
@endsection
