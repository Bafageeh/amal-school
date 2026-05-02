@extends('layouts.app')

@section('title', 'ملفات المعلمة')

@section('content')
<div data-react-app="teacher-evidence-uploads" data-teacher-id="{{ $teacher->id }}" data-evidence-id="{{ $evidence->id }}"></div>
@endsection
