@extends('layouts.app')
@section('title', $principal ? 'تقييم المعلمة' : 'معايير تقييمي')
@section('content')
@php
$completedCount = array_sum(array_column($rows, 'completed'));
$grade = $assessment['grade'];
@endphp
<div class="assessment-page">
    <div class="assessment-crumbs">
        @if($principal)
            <a href="{{ route('teacher-evidence.index') }}">المعلمات</a><span> / </span>
        @else
            <a href="{{ route('dashboard') }}">الرئيسية</a><span> / </span>
        @endif
        <span>{{ $teacher->name }}</span>
    </div>
    <section class="assessment-intro">
        <div class="assessment-eyebrow">منصة تقييم الأداء · ١٤٤٨هـ</div>
        <h1>{{ $principal ? 'تقييم المعلمة' : 'معايير التقييم الخاصة بكِ' }}</h1>
        <p class="assessment-teacher-name">{{ $teacher->name }}</p>
        <p>{{ count($rows) }} معيارًا و{{ $totalIndicators }} مؤشرًا وفق الأوزان المحددة في نموذج تقييم أداء المعلم.</p>
        <div class="assessment-summary"><span>شواهد مكتملة: {{ $completedCount }} / {{ $totalIndicators }}</span><span>المعايير: {{ count($rows) }}</span><span>إجمالي الأوزان: 100%</span></div>
    </section>

    <div class="assessment-score-grid">
        <div class="assessment-score-card">
            <span>اكتمال الشواهد الموزون</span>
            <strong>{{ number_format($covered, 1) }}%</strong>
            <div class="assessment-progress"><div style="width:{{ $covered }}%"></div></div>
            <small>يُحسب من عدد المؤشرات التي رُفع لها شاهد، وفق وزن كل معيار.</small>
        </div>
        <div class="assessment-score-card {{ $assessment['is_complete'] ? 'assessment-final-complete' : 'assessment-final-pending' }}">
            <span>نتيجة التقييم النهائي</span>
            @if($assessment['is_complete'])
                <strong>{{ number_format($assessment['final_score'], 1) }}%</strong>
                <div class="assessment-grade-badge">التقدير: {{ $assessment['grade'] }}</div>
                <div class="assessment-progress"><div style="width:{{ $assessment['final_score'] }}%"></div></div>
                <small>تم اعتماد الدرجة بعد تقييم المديرة للمعايير الأحد عشر كاملة.</small>
            @else
                <strong class="assessment-incomplete-title">قيد التقييم</strong>
                <div class="assessment-progress"><div style="width:{{ round(100 * $assessment['rated_count'] / max(1, $assessment['total_count'])) }}%"></div></div>
                <small>قيّمت المديرة {{ $assessment['rated_count'] }} من {{ $assessment['total_count'] }} معيارًا، والمتبقي {{ $assessment['pending_count'] }}. ستظهر النتيجة النهائية بعد اكتمال جميع التقييمات.</small>
            @endif
        </div>
    </div>

    <section class="assessment-breakdown" aria-label="تفصيل درجات التقييم">
        <div class="assessment-breakdown-heading">
            <h2>ملخص درجات المعايير</h2>
            <p>تُحتسب درجة كل معيار من تقييم المديرة من ٥، مضروبًا في وزنه المحدد. رفع الشواهد لا يضيف درجات تلقائيًا.</p>
        </div>
        <div class="assessment-breakdown-rows">
            @foreach($rows as $no => $row)
                <div class="assessment-breakdown-row">
                    <span class="assessment-breakdown-name">{{ $no }}. {{ $row['title'] }}</span>
                    <span class="assessment-breakdown-rating">
                        {{ $row['rating'] === null ? 'لم يُقيّم' : $row['rating'] . ' / 5' }}
                    </span>
                    <strong>{{ $row['ratingPoints'] === null ? '—' : number_format($row['ratingPoints'], 1) . ' / ' . $row['weight'] . '%' }}</strong>
                </div>
            @endforeach
        </div>
        <div class="assessment-breakdown-total">
            <span>النتيجة النهائية</span>
            <strong>{{ $assessment['is_complete'] ? number_format($assessment['final_score'], 1) . '% · ' . $assessment['grade'] : 'قيد التقييم (' . $assessment['rated_count'] . ' / ' . $assessment['total_count'] . ')' }}</strong>
        </div>
    </section>

    @if(!$principal)
        <p class="assessment-note">أرفقي ملف الشاهد مباشرة داخل المؤشر. يتحول لونه إلى البنفسجي الغامق بمجرد رفع ملف، ويمكنك إضافة أكثر من ملف للمؤشر نفسه. التقييم بالنجوم من صلاحية المديرة فقط.</p>
    @else
        <p class="assessment-note">المؤشر الداكن يعني وجود شاهد مرفوع، والفاتح يعني عدم رفعه بعد. درجة التقييم تختلف عن نسبة اكتمال الشواهد؛ اختاري تقييمًا من ١ إلى ٥ لكل معيار لاعتماد الدرجة الموزونة.</p>
    @endif

    @foreach($rows as $no => $row)
        <section class="assessment-criterion" id="criterion-{{ $no }}">
            <div class="assessment-criterion-head">
                <div class="assessment-criterion-title">
                    <span class="assessment-criterion-no">{{ $no }}</span>
                    <div>
                        <h2>{{ $row['title'] }}</h2>
                        <p>{{ $row['description'] }}</p>
                    </div>
                </div>
                <span class="assessment-weight">الوزن {{ $row['weight'] }}%</span>
            </div>
            <div class="assessment-criterion-result">
                <span>{{ $row['completed'] }} / {{ count($row['indicators']) }} مؤشرات مستوفاة</span>
                <span>اكتمال موزون {{ number_format($row['evidencePoints'], 1) }} / {{ $row['weight'] }}%</span>
                @if($row['rating'] !== null)
                    <span>التقييم {{ $row['rating'] }}/5 = {{ number_format($row['ratingPoints'],1) }}%</span>
                @endif
            </div>
            <div class="assessment-progress"><div style="width:{{ round(100 * $row['completed'] / max(1, count($row['indicators']))) }}%"></div></div>
            <div class="assessment-indicators">
                @foreach($row['indicators'] as $ix => $indicator)
                    @php($indicatorNo = $ix + 1)
                    @php($files = $byIndicator[$no][$indicatorNo] ?? [])
                    <div class="assessment-indicator {{ count($files) ? 'is-submitted' : 'is-empty' }}">
                        <div class="assessment-indicator-header">
                            <span class="assessment-indicator-marker">{{ count($files) ? '✓' : $loop->iteration }}</span>
                            <div class="assessment-indicator-name">
                                <strong>{{ $indicator }}</strong>
                                <small>{{ count($files) ? count($files).' شاهد مرفوع' : 'بانتظار رفع الشاهد' }}</small>
                            </div>
                        </div>
                        @foreach($files as $file)
                            <div class="assessment-evidence-entry">
                                <div class="assessment-attachment">
                                    <a href="{{ route('teacher-assessment.download', $file->id) }}" title="تحميل الشاهد">📎 {{ $file->original_name }}</a>
                                    <small>{{ \Carbon\Carbon::parse($file->created_at)->format('Y-m-d') }}</small>
                                    <form method="POST" action="{{ route('teacher-assessment.delete', $file->id) }}" onsubmit="return confirm('هل تريدين حذف هذا الشاهد؟');">
                                        @csrf @method('DELETE')
                                        <button type="submit" class="assessment-delete" aria-label="حذف الشاهد">×</button>
                                    </form>
                                </div>
                            </div>
                        @endforeach
                        @unless($principal)
                            <form class="assessment-upload-form" method="POST" enctype="multipart/form-data" action="{{ route('teacher-assessment.upload', [$no,$indicatorNo]) }}">
                                @csrf
                                <label for="indicator-file-{{ $no }}-{{ $indicatorNo }}">إرفاق ملف الشاهد <span aria-hidden="true">*</span></label>
                                <input type="file" name="file" id="indicator-file-{{ $no }}-{{ $indicatorNo }}" required accept="image/*,video/mp4,.jpg,.jpeg,.png,.webp,.gif,.bmp,.heic,.heif,.mp4,.ppt,.pptx,.doc,.docx,.xls,.xlsx,.pdf">
                                <small class="assessment-file-hint">الأنواع: صور، MP4، PowerPoint، Word، Excel، PDF · حتى 100 ميجابايت</small>
                                <button type="submit">حفظ ورفع الشاهد <span aria-hidden="true">↑</span></button>
                            </form>
                        @endunless
                    </div>
                @endforeach
            </div>
            @if($principal)
                <form class="assessment-rating" method="POST" action="{{ route('teacher-assessment.rate', [$teacher->id,$no]) }}">
                    @csrf
                    <label for="rate-{{ $no }}">تقييم المديرة لهذا المعيار</label>
                    <select id="rate-{{ $no }}" name="rating" required>
                        <option value="">اختاري درجة من 1 إلى 5</option>
                        @foreach([1 => 'ضعيف', 2 => 'مقبول', 3 => 'جيد', 4 => 'جيد جدًا', 5 => 'ممتاز'] as $value => $text)
                            <option value="{{ $value }}" @selected($row['rating'] == $value)>{{ $value }} / 5 — {{ $text }}</option>
                        @endforeach
                    </select>
                    <button type="submit">حفظ تقييم المعيار</button>
                </form>
            @endif
        </section>
    @endforeach
    <div class="assessment-footer">مديرة المدرسة : مشاعل العنبري</div>
</div>
<link rel="stylesheet" href="{{ asset('css/teacher-assessment.css') }}?v=3">
<script>
document.querySelectorAll('.assessment-upload-form').forEach(function(form) {
    form.addEventListener('submit', function(event) {
        var file = form.querySelector('input[type="file"]').files[0];
        if (file && file.size > 100 * 1024 * 1024) {
            event.preventDefault();
            alert('حجم الملف يتجاوز 100 ميجابايت. يرجى تقليل حجم الملف ثم المحاولة.');
            return;
        }
        var button = form.querySelector('button[type="submit"]');
        button.disabled = true;
        button.textContent = 'جارٍ رفع الشاهد...';
    });
});
</script>
@endsection
