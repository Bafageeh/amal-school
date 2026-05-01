@extends('layouts.app')

@section('title', 'إضافة معيار تقييم')

@section('content')
<div class="card">
    <h3>إضافة معيار تقييم جديد</h3>

    <form method="POST" action="{{ route('evidence.store') }}">
        @csrf

        <label>
            عنوان معيار التقييم
            <input name="title" value="{{ old('title') }}" required>
        </label>

        <label>
            الوصف
            <textarea name="description" rows="4">{{ old('description') }}</textarea>
        </label>

        <button class="btn green" type="submit">حفظ</button>
        <a class="btn gray" href="{{ route('evidence.index') }}">رجوع</a>
    </form>
</div>
@endsection
