@extends('layouts.app')

@section('title', 'ملفات المعلمة')

@section('content')
<div class="card">
    <h3 style="margin-top:0;">ملفات المعلمة: {{ $teacher->name }}</h3>
    <p class="muted">المعيار: {{ $evidence->title }}</p>
    <div class="actions">
        <a class="btn gray" href="{{ route('teacher-evidence.teacher', $teacher) }}">رجوع للمعايير</a>
        <a class="btn light" href="{{ route('teacher-evidence.index') }}">رجوع للمعلمات</a>
    </div>
</div>

<div class="card">
    <h3>الملفات المرفوعة في هذا المعيار لهذه المعلمة فقط</h3>

    @if($uploads->count())
        <table>
            <thead>
                <tr>
                    <th>العنوان</th>
                    <th>ملاحظات</th>
                    <th>نوع الملف</th>
                    <th>تاريخ الرفع</th>
                    <th></th>
                </tr>
            </thead>
            <tbody>
                @foreach($uploads as $upload)
                    <tr>
                        <td>{{ $upload->title }}</td>
                        <td class="muted">{{ $upload->notes }}</td>
                        <td class="muted">{{ $upload->file_type }}</td>
                        <td>{{ $upload->created_at->format('Y-m-d H:i') }}</td>
                        <td>
                            <a class="btn light" href="{{ route('uploads.download', $upload) }}">تحميل</a>
                        </td>
                    </tr>
                @endforeach
            </tbody>
        </table>
    @else
        <p class="muted">لا توجد ملفات مرفوعة من هذه المعلمة على هذا المعيار.</p>
    @endif
</div>
@endsection
