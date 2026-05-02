@extends('layouts.app')

@section('title', 'متابعة ملفات المعلمات')

@section('content')
<div class="card">
    <h3 style="margin-top:0;">متابعة ملفات المعلمات</h3>
    <p class="muted">اختاري المعلمة لعرض جميع معايير التقييم، ثم اختاري معيارًا لعرض ملفات هذه المعلمة فقط داخل هذا المعيار.</p>
</div>

<div class="card">
    <h3>المعلمات</h3>

    @if($teachers->count())
        <table>
            <thead>
                <tr>
                    <th>اسم المعلمة</th>
                    <th>اسم المستخدم</th>
                    <th>عدد الملفات المرفوعة</th>
                    <th></th>
                </tr>
            </thead>
            <tbody>
                @foreach($teachers as $teacher)
                    <tr>
                        <td>{{ $teacher->name }}</td>
                        <td>{{ $teacher->username }}</td>
                        <td>{{ $teacher->uploads_count }}</td>
                        <td>
                            <a class="btn" href="{{ route('teacher-evidence.teacher', $teacher) }}">عرض المعايير</a>
                        </td>
                    </tr>
                @endforeach
            </tbody>
        </table>
    @else
        <p class="muted">لا توجد معلمات حتى الآن.</p>
    @endif
</div>
@endsection
