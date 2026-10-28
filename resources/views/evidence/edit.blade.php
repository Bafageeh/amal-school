@extends('layouts.app')
@section('title', 'تعديل معيار تقييم')
@section('content')
<div class="react-evidence-show">
<x-page-heading title="تعديل معيار التقييم" description="حدّثي عنوان المعيار ووصفه ليبقى واضحًا لفريق المدرسة." />
<section class="card">
<form method="POST" action="{{ route('evidence.update', $evidence) }}">
    @csrf
    @method('PUT')
    <label>عنوان معيار التقييم<input name="title" value="{{ old('title', $evidence->title) }}" required></label>
    <label>وصف المعيار<textarea name="description" rows="4">{{ old('description', $evidence->description) }}</textarea></label>
    <div class="actions"><button class="btn" type="submit">حفظ التعديلات</button><a class="btn light" href="{{ route('evidence.index') }}">إلغاء والعودة</a></div>
</form>
</section>
</div>
@endsection
