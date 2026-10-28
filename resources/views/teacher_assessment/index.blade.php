@extends('layouts.app')
@section('title', 'المعلمات')
@section('content')
<div class="assessment-page">
    <section class="assessment-intro">
        <div class="assessment-eyebrow">المتوسطة ١١٢ · متابعة الأداء</div>
        <h1>المعلمات</h1>
        <p>اختاري معلمة لعرض معاييرها الأحد عشر ومؤشرات رفع الشواهد ونتائج التقييم.</p>
        <div class="assessment-summary"><span>{{ $teachers->count() }} معلمة</span><span>١١ معيار تقييم</span><span>{{ collect($teacherScores)->where('is_complete', true)->count() }} تقييمًا نهائيًا مكتملًا</span></div>
    </section>
    <div class="assessment-search">
        <label for="teacher-search">البحث عن معلمة</label>
        <input id="teacher-search" type="search" placeholder="اكتبي اسم المعلمة..." autocomplete="off">
    </div>
    <div class="assessment-teachers-grid" id="assessment-teachers-grid">
        @foreach($teachers as $teacher)
            @php($done = $uploads[$teacher->id] ?? 0)
            @php($score = $teacherScores[$teacher->id])
            <a class="assessment-teacher-card" data-name="{{ $teacher->name }}" href="{{ route('teacher-evidence.teacher', $teacher) }}">
                <div class="assessment-avatar">{{ mb_substr($teacher->name, 0, 1) }}</div>
                <div class="assessment-teacher-main">
                    <strong>{{ $teacher->name }}</strong>
                    <small>{{ $done }} من ٥٥ مؤشرًا مرفوعًا</small>
                    <div class="assessment-progress"><div style="width:{{ round($done / 55 * 100) }}%"></div></div>
                    <div class="assessment-final-result {{ $score['is_complete'] ? 'is-final' : 'is-pending' }}">
                        <span>نتيجة التقييم النهائي</span>
                        @if($score['is_complete'])
                            <strong>{{ number_format($score['final_score'], 1) }}% · {{ $score['grade'] }}</strong>
                            <small>تم تقييم جميع المعايير الـ{{ $score['total_count'] }}</small>
                        @else
                            <strong>قيد التقييم</strong>
                            <small>تم تقييم {{ $score['rated_count'] }} من {{ $score['total_count'] }} معيارًا بواسطة المديرة</small>
                        @endif
                    </div>
                </div>
                <span class="assessment-arrow">←</span>
            </a>
        @endforeach
    </div>
    <p id="no-teacher-results" class="assessment-empty" hidden>لا توجد معلمة مطابقة للاسم.</p>
</div>
<link rel="stylesheet" href="{{ asset('css/teacher-assessment.css') }}?v=2">
<script>
(() => {
 const input = document.getElementById('teacher-search');
 const cards = [...document.querySelectorAll('.assessment-teacher-card')];
 input.addEventListener('input', () => {
   const q = input.value.trim().toLocaleLowerCase('ar');
   let visible=0;
   cards.forEach(c => { const show = c.dataset.name.toLocaleLowerCase('ar').includes(q); c.hidden = !show; if(show) visible++; });
   document.getElementById('no-teacher-results').hidden = visible > 0;
 });
})();
</script>
@endsection
