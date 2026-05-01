@extends('layouts.app')

@section('title', 'تعديل معلمة')

@section('content')
<div class="card">
    <h3>تعديل بيانات المعلمة</h3>

    <form method="POST" action="{{ route('teachers.update', $teacher) }}">
        @csrf
        @method('PUT')

        <label>
            اسم المعلمة
            <input name="name" value="{{ old('name', $teacher->name) }}" required>
        </label>

        <label>
            البريد الإلكتروني
            <input type="email" name="email" value="{{ old('email', $teacher->email) }}" required>
        </label>

        <label>
            كلمة مرور جديدة
            <input type="text" name="password" placeholder="اتركيه فارغًا إذا لا تريدين تغييرها">
        </label>

        <button class="btn" type="submit">حفظ</button>
        <a class="btn gray" href="{{ route('teachers.index') }}">رجوع</a>
    </form>
</div>
@endsection
