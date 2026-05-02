@extends('layouts.app')

@section('title', 'معايير المعلمة')

@section('content')
<div data-react-app="teacher-evidence-criteria" data-teacher-id="{{ $teacher->id }}"></div>
@endsection
