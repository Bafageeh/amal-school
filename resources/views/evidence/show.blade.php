@extends('layouts.app')

@section('title', $evidence->title)

@section('content')
<div data-react-app="evidence-show" data-evidence-id="{{ $evidence->id }}"></div>
@endsection
