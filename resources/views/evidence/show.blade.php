@extends('layouts.app')

@section('title', $evidence->title)

@section('content')
<div class="card">
    <h2 style="margin-top:0;">{{ $evidence->title }}</h2>
    <p class="muted">{{ $evidence->description }}</p>
</div>

<div class="card">
    <h3>رفع ملفات على معيار التقييم هذا</h3>

    <form method="POST" action="{{ route('evidence.uploads.store', $evidence) }}" enctype="multipart/form-data">
        @csrf

        <label>
            عنوان الملفات
            <input name="title" placeholder="اختياري">
        </label>

        <label>
            ملاحظات
            <textarea name="notes" rows="3" placeholder="اختياري"></textarea>
        </label>

        <label>
            الملفات
            <input type="file" name="files[]" multiple required>
            <small class="muted">يمكن اختيار أكثر من ملف دفعة واحدة.</small>
        </label>

        <button class="btn green" type="submit">رفع الملفات</button>
        <a class="btn gray" href="{{ route('evidence.index') }}">رجوع</a>
    </form>
</div>

<div class="card">
    <h3>{{ auth()->user()->isPrincipal() ? 'الملفات المرفوعة' : 'ملفاتي على معيار التقييم هذا' }}</h3>

    @if($uploads->count())
        <table>
            <thead>
                <tr>
                    <th>العنوان</th>
                    @if(auth()->user()->isPrincipal())
                        <th>المعلمة</th>
                    @endif
                    <th>ملاحظات</th>
                    <th>تاريخ الرفع</th>
                    <th></th>
                </tr>
            </thead>
            <tbody>
                @foreach($uploads as $upload)
                    <tr>
                        <td>{{ $upload->title }}</td>

                        @if(auth()->user()->isPrincipal())
                            <td>{{ $upload->uploader?->name }}</td>
                        @endif

                        <td class="muted">{{ $upload->notes }}</td>
                        <td>{{ $upload->created_at->format('Y-m-d H:i') }}</td>
                        <td>
                            <div class="actions">
                                <a class="btn light" href="{{ route('uploads.download', $upload) }}">تحميل</a>

                                <form method="POST" action="{{ route('uploads.destroy', $upload) }}" onsubmit="return confirm('حذف الملف؟')">
                                    @csrf
                                    @method('DELETE')
                                    <button class="btn red" type="submit">حذف</button>
                                </form>
                            </div>
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
