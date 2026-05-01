@extends('layouts.app')

@section('title', 'تعديل معيار تقييم')

@section('content')
<div class="card">
    <h3>تعديل معيار التقييم</h3>

    <form method="POST" action="{{ route('evidence.update', $evidence) }}">
        @csrf
        @method('PUT')

        <label>
            عنوان معيار التقييم
            <input name="title" value="{{ old('title', $evidence->title) }}" required>
        </label>

        <label>
            الوصف
            <textarea name="description" rows="4">{{ old('description', $evidence->description) }}</textarea>
        </label>

        <button class="btn" type="submit">حفظ</button>
        <a class="btn gray" href="{{ route('evidence.index') }}">رجوع</a>
    </form>
</div>
@endsection
