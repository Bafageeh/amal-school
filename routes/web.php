<?php

use App\Http\Controllers\AuthController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\EvidenceItemController;
use App\Http\Controllers\EvidenceUploadController;
use App\Http\Controllers\TeacherController;
use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    return auth()->check()
        ? redirect()->route('dashboard')
        : redirect()->route('login');
});

Route::get('/login', [AuthController::class, 'showLogin'])->name('login');
Route::post('/login', [AuthController::class, 'login'])->name('login.post');
Route::post('/logout', [AuthController::class, 'logout'])->name('logout');

Route::middleware('auth')->group(function () {
    Route::get('/set-password', [AuthController::class, 'showSetPassword'])->name('password.setup');
    Route::post('/set-password', [AuthController::class, 'setPassword'])->name('password.setup.store');
});

Route::middleware(['auth', 'password.set'])->group(function () {
    Route::get('/dashboard', [DashboardController::class, 'index'])->name('dashboard');

    Route::resource('teachers', TeacherController::class)->except(['show', 'create']);

    Route::resource('evidence', EvidenceItemController::class);
    Route::post('/evidence/{evidence}/uploads', [EvidenceUploadController::class, 'store'])->name('evidence.uploads.store');
    Route::get('/uploads/{upload}/download', [EvidenceUploadController::class, 'download'])->name('uploads.download');
    Route::delete('/uploads/{upload}', [EvidenceUploadController::class, 'destroy'])->name('uploads.destroy');
});
