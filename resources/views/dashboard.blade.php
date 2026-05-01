@extends('layouts.app')

@section('title', 'الرئيسية')

@section('content')
<div class="grid">
    @if(auth()->user()->isPrincipal())
        <div class="stat">
            <div>عدد المعلمات</div>
            <div class="num">{{ $teachersCount }}</div>
        </div>
    @endif

    <div class="stat">
        <div>عدد معايير التقييم</div>
        <div class="num">{{ $evidenceCount }}</div>
    </div>

    <div class="stat">
        <div>{{ auth()->user()->isPrincipal() ? 'إجمالي الملفات المرفوعة' : 'ملفاتي المرفوعة' }}</div>
        <div class="num">{{ $uploadsCount }}</div>
    </div>
</div>

<div class="card">
    <h3>آخر الملفات المرفوعة</h3>

    @if($latestUploads->count())
        <table>
            <thead>
                <tr>
                    <th>الملف</th>
                    <th>معيار التقييم</th>
                    @if(auth()->user()->isPrincipal())
                        <th>المعلمة</th>
                    @endif
                    <th>التاريخ</th>
                    <th></th>
                </tr>
            </thead>
            <tbody>
                @foreach($latestUploads as $upload)
                    <tr>
                        <td>{{ $upload->title }}</td>
                        <td>{{ $upload->evidenceItem?->title }}</td>
                        @if(auth()->user()->isPrincipal())
                            <td>{{ $upload->uploader?->name }}</td>
                        @endif
                        <td>{{ $upload->created_at->format('Y-m-d H:i') }}</td>
                        <td>
                            <a class="btn light" href="{{ route('uploads.download', $upload) }}">تحميل</a>
                        </td>
                    </tr>
                @endforeach
            </tbody>
        </table>
    @else
        <p class="muted">لا توجد ملفات مرفوعة حتى الآن.</p>
    @endif
</div>
@endsection
