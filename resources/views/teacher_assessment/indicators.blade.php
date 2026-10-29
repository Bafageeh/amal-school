@extends('layouts.app')
@section('title', 'إدارة مؤشرات التقييم')
@section('content')
<div class="assessment-page assessment-indicator-management">
    <div class="assessment-crumbs">
        <a href="{{ route('teacher-evidence.index') }}">متابعة المعلمات</a>
        <span aria-hidden="true">/</span>
        <span>إدارة المؤشرات</span>
    </div>

    <section class="assessment-intro">
        <div class="assessment-eyebrow">صلاحيات مديرة المدرسة · المتوسطة ١١٢</div>
        <h1>إدارة مؤشرات معايير التقييم</h1>
        <p>جميع المؤشرات مرتبة حسب المعيار. يمكنكِ تغيير مسمى أي مؤشر أو إزالته من التقييم، وستنعكس التعديلات على جميع حسابات المعلمات.</p>
        <div class="assessment-summary">
            <span>{{ count($criteria) }} معيارًا</span>
            <span>{{ $totalActive }} مؤشرًا فعّالًا</span>
            <span>حفظ الشواهد السابقة عند حذف مؤشر</span>
        </div>
    </section>

    <p class="assessment-note">
        <strong>تنبيه:</strong> الحذف هنا يعني إخفاء المؤشر من حسابات المعلمات دون حذف الملفات القديمة.
        لا تتغير أرقام المؤشرات أو ارتباط شواهد المعلمات بها، ويمكن استعادة أي مؤشر محذوف.
        لا يغير تعديل المؤشرات الدرجات التي قيّمتها المديرة للمعايير.
    </p>

    <div class="assessment-admin-criteria">
        @foreach($criteria as $no => $criterion)
            <details class="assessment-admin-criterion" id="criterion-{{ $no }}" open>
                <summary>
                    <span class="assessment-admin-criterion-title">
                        <span class="assessment-criterion-no">{{ $no }}</span>
                        <span class="assessment-admin-criterion-text">
                            <strong>{{ $criterion['title'] }}</strong>
                            <small>{{ $criterion['active_count'] }} مؤشر فعّال من {{ count($criterion['entries']) }} · الوزن {{ $criterion['weight'] }}%</small>
                        </span>
                    </span>
                    <span class="assessment-admin-chevron" aria-hidden="true">⌄</span>
                </summary>

                <div class="assessment-admin-indicators">
                    @foreach($criterion['entries'] as $indicator)
                        <div class="assessment-admin-indicator-row {{ $indicator['is_deleted'] ? 'is-hidden' : '' }}">
                            <div class="assessment-admin-indicator-meta">
                                <span class="assessment-admin-indicator-number">{{ $no }}-{{ $indicator['number'] }}</span>
                                <small>{{ $indicator['evidence_count'] }} شاهد مرفوع</small>
                                @if($indicator['is_deleted'])
                                    <span class="assessment-admin-status">محذوف</span>
                                @endif
                            </div>

                            @if(!$indicator['is_deleted'])
                                <form class="assessment-admin-edit-form" method="POST"
                                    action="{{ route('teacher-assessment.indicators.update', [$no, $indicator['number']]) }}">
                                    @csrf
                                    @method('PUT')
                                    <label for="indicator-title-{{ $no }}-{{ $indicator['number'] }}">مسمى المؤشر</label>
                                    <input id="indicator-title-{{ $no }}-{{ $indicator['number'] }}"
                                        name="title" type="text" maxlength="180" required
                                        value="{{ $indicator['title'] }}"
                                        autocomplete="off">
                                    <button class="assessment-admin-save" type="submit">حفظ التعديل</button>
                                </form>
                                <form method="POST" class="assessment-admin-remove-form"
                                    action="{{ route('teacher-assessment.indicators.delete', [$no, $indicator['number']]) }}"
                                    onsubmit="return confirm('هل تريدين حذف هذا المؤشر من حسابات المعلمات؟ ستُحفظ شواهده السابقة، ويمكن استعادته لاحقًا.');">
                                    @csrf
                                    @method('DELETE')
                                    <button class="assessment-admin-delete" type="submit">حذف المؤشر</button>
                                </form>
                            @else
                                <div class="assessment-admin-deleted-title">{{ $indicator['title'] }}</div>
                                <form method="POST"
                                    action="{{ route('teacher-assessment.indicators.restore', [$no, $indicator['number']]) }}">
                                    @csrf
                                    <button type="submit" class="assessment-admin-restore">استعادة المؤشر</button>
                                </form>
                            @endif
                        </div>
                    @endforeach
                </div>
            </details>
        @endforeach
    </div>
    <div class="assessment-footer">مديرة المدرسة : مشاعل العنبري</div>
</div>
<link rel="stylesheet" href="{{ asset('css/teacher-assessment.css') }}?v=4">
@endsection
