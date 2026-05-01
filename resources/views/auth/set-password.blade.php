@extends('layouts.app')

@section('title', 'تعيين الرقم السري')

@section('content')
<div style="max-width:460px;margin:70px auto;">
    <div class="card">
        <h2 style="margin-top:0;">تعيين الرقم السري</h2>
        <p class="muted">هذا أول دخول لك. فضلاً أدخلي رقمًا سريًا جديدًا من 4 خانات، وسيتم اعتماده للدخول بعد ذلك.</p>

        <form method="POST" action="{{ route('password.setup.store') }}">
            @csrf

            <label>
                الرقم السري الجديد
                <input type="password" name="password" required minlength="4" maxlength="4" inputmode="numeric" pattern="[0-9]{4}" autocomplete="new-password" autofocus>
            </label>

            <label>
                تأكيد الرقم السري
                <input type="password" name="password_confirmation" required minlength="4" maxlength="4" inputmode="numeric" pattern="[0-9]{4}" autocomplete="new-password">
            </label>

            <button class="btn" type="submit" style="width:100%;">حفظ الرقم السري</button>
        </form>
    </div>
</div>
@endsection
