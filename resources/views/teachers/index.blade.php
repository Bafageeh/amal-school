@extends('layouts.app')

@section('title', 'المعلمات')

@section('content')
<div class="card">
    <h3>إضافة معلمة</h3>

    <form method="POST" action="{{ route('teachers.store') }}">
        @csrf

        <div class="grid">
            <label>
                اسم المعلمة
                <input name="name" value="{{ old('name') }}" required>
            </label>

            <label>
                اسم المستخدم
                <input type="text" name="username" value="{{ old('username') }}" required>
            </label>

            <label>
                كلمة المرور - 4 خانات
                <input type="text" name="password" required minlength="4" maxlength="4" inputmode="numeric" pattern="[0-9]{4}">
            </label>
        </div>

        <button class="btn green" type="submit">إنشاء الحساب</button>
    </form>
</div>

<div class="card">
    <h3>قائمة المعلمات</h3>

    @if($teachers->count())
        <table>
            <thead>
                <tr>
                    <th>الاسم</th>
                    <th>اسم المستخدم</th>
                    <th>تاريخ الإضافة</th>
                    <th></th>
                </tr>
            </thead>
            <tbody>
                @foreach($teachers as $teacher)
                    <tr>
                        <td>{{ $teacher->name }}</td>
                        <td>{{ $teacher->username }}</td>
                        <td>{{ $teacher->created_at->format('Y-m-d') }}</td>
                        <td>
                            <div class="actions">
                                <a class="btn light" href="{{ route('teachers.edit', $teacher) }}">تعديل</a>

                                <form method="POST" action="{{ route('teachers.destroy', $teacher) }}" onsubmit="return confirm('حذف حساب المعلمة؟')">
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
        <p class="muted">لا توجد معلمات حتى الآن.</p>
    @endif
</div>
@endsection
