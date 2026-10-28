@extends('layouts.app')
@section('title', 'الرئيسية')
@section('content')
<section class="school-welcome-banner" aria-label="مرحبًا في منصة المدرسة">
    <div class="welcome-copy">
        <span class="hero-eyebrow"><span class="status-dot"></span> مساحة الإنجاز والتوثيق</span>
        <p class="welcome-hello">أهلًا {{ auth()->user()->name }}،</p>
        <h1>كل إنجاز يبدأ بخطوة،<br><em>وكل تميّز يستحق أن يُرى.</em></h1>
        <p class="welcome-description">معايير التقييم، شواهد الإنجاز، ومتابعة المعلمات في مساحة واحدة منظّمة.</p>
        <a class="btn welcome-action" href="{{ auth()->user()->isPrincipal() ? route('evidence.index') : route('teacher-assessment.mine') }}">استكشفي معايير التقييم <x-ui-icon name="arrow" size="18" /></a>
    </div>
    <div class="school-identity">
        <span class="identity-orbit orbit-one"></span><span class="identity-orbit orbit-two"></span>
        <div class="school-logo-frame"><img src="{{ asset('images/school-logo.svg') }}" alt="الشعار الرسمي للمتوسطة الثانية عشر بعد المئة" width="145" height="160"></div>
        <span class="identity-caption">نتعلّم. ننجز. نتميّز.</span>
    </div>
</section>
<div data-react-app="dashboard"></div>
@if(auth()->user()->isPrincipal())
<div class="school-principal-footer">مديرة المدرسة : مشاعل العنبري</div>
@endif
@endsection
