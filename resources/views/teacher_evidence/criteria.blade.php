@extends('layouts.app')

@section('title', 'معايير المعلمة')

@section('content')
<div class="card">
    <h3 style="margin-top:0;">معايير التقييم للمعلمة: {{ $teacher->name }}</h3>
    <p class="muted">اضغطي على أي معيار لعرض الملفات المرفوعة فيه لهذه المعلمة فقط.</p>
    <a class="btn gray" href="{{ route('teacher-evidence.index') }}">رجوع للمعلمات</a>
</div>

<div class="card">
    <h3>المعايير</h3>

    @if($items->count())
        <table>
            <thead>
                <tr>
                    <th>معيار التقييم</th>
                    <th>الوصف</th>
                    <th>عدد ملفات هذه المعلمة</th>
                    <th></th>
                </tr>
            </thead>
            <tbody>
                @foreach($items as $item)
                    <tr>
                        <td>{{ $item->title }}</td>
                        <td class="muted">{{ $item->description }}</td>
                        <td>{{ $item->teacher_uploads_count }}</td>
                        <td>
                            <a class="btn" href="{{ route('teacher-evidence.uploads', [$teacher, $item]) }}">عرض ملفات المعلمة</a>
                        </td>
                    </tr>
                @endforeach
            </tbody>
        </table>
    @else
        <p class="muted">لا توجد معايير تقييم حتى الآن.</p>
    @endif
</div>
@endsection
