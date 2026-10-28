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
@if(auth()->user()->isPrincipal())
<div class="school-principal-footer" style="text-align:center;padding:28px 10px 24px;color:#7455a1;font-weight:900;font-size:15px">مديرة المدرسة : مشاعل العنبري</div>
@endif
@endsection
