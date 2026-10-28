@extends('layouts.app')

@section('title', 'الرئيسية')

@section('content')
<section class="school-welcome-banner" aria-label="الصفحة الرئيسية للمتوسطة 112">
    <div>
        <span class="hero-eyebrow">✦ وزارة التعليم · المتوسطة ١١٢</span>
        <h1>مساحة للتميز والإبداع المدرسي</h1>
        <p>معايير التقييم، متابعة الإنجاز، وملفات المعلمات في مكان واحد.</p>
        <div class="welcome-hello">أهلًا {{ auth()->user()->name }} 🌷</div>
    </div>
    <div class="school-identity">
        <img src="{{ asset('images/school-logo.svg') }}" alt="الشعار الرسمي للمتوسطة الثانية عشر بعد المئة" width="142" height="142">
    </div>
</section>
<div data-react-app="dashboard"></div>
@endsection
