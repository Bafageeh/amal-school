@extends('layouts.app')
@section('title', 'إضافة معيار تقييم')
@section('content')
<div class="react-evidence-show">
<x-page-heading title="إضافة معيار تقييم" description="معيار واضح يوجّه الجهود ويجمع شواهد الإنجاز في مكان واحد." />
<section class="card">
<form method="POST" action="{{ route('evidence.store') }}">
    @csrf
    <label>عنوان معيار التقييم<input name="title" value="{{ old('title') }}" required placeholder="اكتبي عنوانًا واضحًا للمعيار"></label>
    <label>وصف المعيار<textarea name="description" rows="4" placeholder="وضّحي الهدف من المعيار والشواهد المرتبطة به">{{ old('description') }}</textarea></label>
    <div class="actions"><button class="btn" type="submit">حفظ المعيار</button><a class="btn light" href="{{ route('evidence.index') }}">إلغاء والعودة</a></div>
</form>
</section>
</div>
@endsection
