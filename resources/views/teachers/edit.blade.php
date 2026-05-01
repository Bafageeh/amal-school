@extends('layouts.app')

@section('title', 'تعديل معلمة')

@section('content')
<div class="card">
    <h3>تعديل بيانات المعلمة</h3>
    <p class="muted">
        حالة الرقم السري:
        @if(blank($teacher->password))
            لم يتم تعيينه بعد.
        @else
            تم تعيينه.
        @endif
    </p>

    <form method="POST" action="{{ route('teachers.update', $teacher) }}">
        @csrf
        @method('PUT')

        <label>
            اسم المعلمة
            <input name="name" value="{{ old('name', $teacher->name) }}" required>
        </label>

        <label>
            اسم المستخدم
            <input type="text" name="username" value="{{ old('username', $teacher->username) }}" required>
        </label>

        <label>
            رقم سري جديد - 4 خانات
            <input type="text" name="password" placeholder="اتركيه فارغًا إذا لا تريدين تغييرها" minlength="4" maxlength="4" inputmode="numeric" pattern="[0-9]{4}">
        </label>

        <button class="btn" type="submit">حفظ</button>
        <a class="btn gray" href="{{ route('teachers.index') }}">رجوع</a>
    </form>
</div>
@endsection
