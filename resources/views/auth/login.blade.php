@extends('layouts.app')
@section('title', 'تسجيل الدخول')
@section('content')
<div class="login-shell">
    <section class="login-story" aria-label="منصة التميز المدرسي">
        <a class="login-brand" href="{{ route('login') }}"><img src="{{ asset('images/school-logo.svg') }}" alt="شعار المتوسطة ١١٢" width="60" height="66"><span>المتوسطة ١١٢<small>المتوسطة الثانية عشر بعد المئة</small></span></a>
        <div class="login-story-copy"><span class="hero-eyebrow">مساحة للإنجاز، ووجهة للتميّز</span><h1>جهودك تصنع الفرق.<br><em>وشواهدك تحكي الأثر.</em></h1><p>منصتك المدرسية لتنظيم معايير التقييم، وتوثيق الإنجاز، ومتابعة رحلة التميز بكل وضوح.</p>
        <div class="login-features">
            <div><span><x-ui-icon name="check" /></span><strong>معايير واضحة</strong><small>كل معيار في مكانه</small></div>
            <div><span><x-ui-icon name="folder" /></span><strong>شواهد منظّمة</strong><small>وصول أسهل لملفاتك</small></div>
            <div><span><x-ui-icon name="users" /></span><strong>متابعة متكاملة</strong><small>مساحة تجمع الفريق</small></div>
        </div></div>
        <span class="login-story-footer">ننجز بإبداع، ونوثّق بتميّز <x-ui-icon name="sparkles" size="18" /></span>
    </section>
    <section class="login-card">
        <span class="login-form-kicker">مرحبًا بعودتكِ</span><h2>تسجيل الدخول</h2>
        <p class="muted">أدخلي بياناتك للوصول إلى مساحتك المدرسية.</p>
        <form method="POST" action="{{ route('login.post') }}">
            @csrf
            <label for="login-username">اسم المستخدم</label>
            <input id="login-username" type="text" name="username" value="{{ old('username') }}" required autofocus autocomplete="username" placeholder="أدخلي اسم المستخدم" dir="auto">
            <label for="login-password">الرقم السري</label>
            <input id="login-password" type="password" name="password" autocomplete="current-password" inputmode="numeric" maxlength="4" placeholder="الرقم السري من ٤ خانات">
            <label class="remember-control"><input type="checkbox" name="remember" value="1"> تذكرني على هذا الجهاز</label>
            <button class="btn login-submit" type="submit">الدخول إلى المنصة <x-ui-icon name="arrow" size="19" /></button>
        </form>
        <div class="login-help"><span class="status-dot"></span>حسابات المعلمات تُدار بواسطة مديرة المدرسة.</div>
        <p class="login-school-name">المتوسطة الثانية عشر بعد المئة</p>
    </section>
</div>
@endsection
