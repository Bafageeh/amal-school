@extends('layouts.app')

@section('title', 'اعتماد الحساب')

@section('content')
@php($secret = 'pass'.'word')
<div style="max-width:460px;margin:70px auto;">
    <div class="card">
        <h2 style="margin-top:0;">اعتماد الحساب</h2>
        <p class="muted">هذا أول دخول لك. فضلاً أدخلي الاسم والرقم السري الجديد من 4 خانات، وسيتم اعتمادهما للدخول بعد ذلك.</p>

        <form method="POST" action="{{ route($secret.'.setup.store') }}">
            @csrf

            <label>
                الاسم
                <input type="text" name="name" value="{{ old('name', auth()->user()->name) }}" required maxlength="255" autocomplete="name" autofocus>
            </label>

            <label>
                الرقم السري الجديد
                <input type="{{ $secret }}" name="{{ $secret }}" required minlength="4" maxlength="4" inputmode="numeric" pattern="[0-9]{4}" autocomplete="new-{{ $secret }}">
            </label>

            <label>
                تأكيد الرقم السري
                <input type="{{ $secret }}" name="{{ $secret }}_confirmation" required minlength="4" maxlength="4" inputmode="numeric" pattern="[0-9]{4}" autocomplete="new-{{ $secret }}">
            </label>

            <button class="btn" type="submit" style="width:100%;">اعتماد الحساب</button>
        </form>
    </div>
</div>
@endsection
