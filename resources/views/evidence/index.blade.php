@extends('layouts.app')

@section('title', 'معايير التقييم')

@section('content')
<div class="card">
    <div style="display:flex;justify-content:space-between;gap:12px;align-items:center;">
        <div>
            <h3 style="margin:0;">معايير التقييم</h3>
            <div class="muted">معايير تقييم ترفع عليها المعلمات الملفات المطلوبة</div>
        </div>

        @if(auth()->user()->isPrincipal())
            <a class="btn green" href="{{ route('evidence.create') }}">إضافة معيار تقييم</a>
        @endif
    </div>
</div>

<div class="card">
    @if($items->count())
        <table>
            <thead>
                <tr>
                    <th>معيار التقييم</th>
                    <th>الوصف</th>
                    <th>عدد الملفات</th>
                    <th></th>
                </tr>
            </thead>
            <tbody>
                @foreach($items as $item)
                    <tr>
                        <td>{{ $item->title }}</td>
                        <td class="muted">{{ $item->description }}</td>
                        <td>{{ $item->uploads_count }}</td>
                        <td>
                            <div class="actions">
                                <a class="btn" href="{{ route('evidence.show', $item) }}">فتح</a>

                                @if(auth()->user()->isPrincipal())
                                    <a class="btn light" href="{{ route('evidence.edit', $item) }}">تعديل</a>

                                    <form method="POST" action="{{ route('evidence.destroy', $item) }}" onsubmit="return confirm('حذف معيار التقييم وجميع ملفاته؟')">
                                        @csrf
                                        @method('DELETE')
                                        <button class="btn red" type="submit">حذف</button>
                                    </form>
                                @endif
                            </div>
                        </td>
                    </tr>
                @endforeach
            </tbody>
        </table>
    @else
        <p class="muted">لا توجد معايير التقييم حتى الآن.</p>
    @endif
</div>
@endsection
