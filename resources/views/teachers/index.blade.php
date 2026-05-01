@extends('layouts.app')

@section('title', 'المعلمات')

@section('content')
<div class="card">
    <h3>إضافة معلمة</h3>
    <p class="muted">يمكن ترك الرقم السري فارغًا. عند أول دخول للمعلمة بدون رقم سري سيطلب منها النظام تعيين رقم سري جديد من 4 خانات.</p>

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
                الرقم السري - اختياري
                <input type="text" name="password" minlength="4" maxlength="4" inputmode="numeric" pattern="[0-9]{4}" placeholder="اتركيه فارغًا لأول دخول">
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
                    <th>حالة الرقم السري</th>
                    <th>تاريخ الإضافة</th>
                    <th></th>
                </tr>
            </thead>
            <tbody>
                @foreach($teachers as $teacher)
                    <tr>
                        <td>{{ $teacher->name }}</td>
                        <td>{{ $teacher->username }}</td>
                        <td>
                            @if(blank($teacher->password))
                                <span class="muted">لم يتم تعيينه</span>
                            @else
                                <span style="color:#166534;font-weight:bold;">تم تعيينه</span>
                            @endif
                        </td>
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
