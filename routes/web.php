<?php

use App\Http\Controllers\Api\AmalApiController;
use App\Http\Controllers\Api\MobileAuthController;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\EvidenceItemController;
use App\Http\Controllers\EvidenceUploadController;
use App\Http\Controllers\SettingsController;
use App\Http\Controllers\TeacherController;
use App\Http\Controllers\TeacherEvidenceController;
use App\Http\Controllers\TeacherAssessmentController;
use Illuminate\Support\Facades\Route;

Route::get('/manifest.webmanifest', function () {
    return response()->json([
        'name' => 'المتوسطة الثانية عشر بعد المئة',
        'short_name' => 'المتوسطة ١١٢',
        'start_url' => '/dashboard',
        'scope' => '/',
        'display' => 'standalone',
        'background_color' => '#F5EFFC',
        'theme_color' => '#7B6BAA',
        'dir' => 'rtl',
        'lang' => 'ar',
        'icons' => [
            ['src' => '/images/school-logo.svg', 'sizes' => 'any', 'type' => 'image/svg+xml', 'purpose' => 'any'],
        ],
    ])->header('Content-Type', 'application/manifest+json');
})->name('pwa.manifest');

Route::get('/service-worker.js', function () {
    return response('', 200, ['Content-Type' => 'application/javascript']);
});

Route::get('/amal-icon.svg', function () {
    return response('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><rect width="512" height="512" rx="110" fill="#111827"/><text x="256" y="304" text-anchor="middle" font-size="160" font-family="Arial" font-weight="700" fill="#ffffff">A</text></svg>', 200, ['Content-Type' => 'image/svg+xml']);
})->name('pwa.icon');

Route::get('/mobile-public/uploads/{upload}/preview/{name?}', [EvidenceUploadController::class, 'mobilePreview'])->name('mobile.uploads.preview');
Route::get('/mobile-public/uploads/{upload}/download/{name?}', [EvidenceUploadController::class, 'mobileDownload'])->name('mobile.uploads.download');

Route::prefix('mobile-api/v1')->group(function () {
    Route::post('/login', [MobileAuthController::class, 'login']);

    Route::middleware('mobile.api.auth')->group(function () {
        Route::post('/setup-password', [MobileAuthController::class, 'setupPassword']);
        Route::post('/logout', [MobileAuthController::class, 'logout']);

        Route::get('/me', [AmalApiController::class, 'me']);
        Route::get('/dashboard', [AmalApiController::class, 'dashboard']);
        Route::get('/settings', [AmalApiController::class, 'settings']);

        Route::get('/evidence', [AmalApiController::class, 'evidenceIndex']);
        Route::post('/evidence', [AmalApiController::class, 'evidenceStore']);
        Route::get('/evidence/{evidence}', [AmalApiController::class, 'evidenceShow']);
        Route::put('/evidence/{evidence}', [AmalApiController::class, 'evidenceUpdate']);
        Route::patch('/evidence/{evidence}', [AmalApiController::class, 'evidenceUpdate']);
        Route::delete('/evidence/{evidence}', [AmalApiController::class, 'evidenceDestroy']);
        Route::post('/evidence/{evidence}/uploads', [AmalApiController::class, 'uploadEvidence']);
        Route::delete('/uploads/{upload}', [AmalApiController::class, 'uploadDestroy']);

        Route::get('/teachers', [AmalApiController::class, 'teachersIndex']);
        Route::post('/teachers', [AmalApiController::class, 'teacherStore']);
        Route::put('/teachers/{teacher}', [AmalApiController::class, 'teacherUpdate']);
        Route::patch('/teachers/{teacher}', [AmalApiController::class, 'teacherUpdate']);
        Route::delete('/teachers/{teacher}', [AmalApiController::class, 'teacherDestroy']);

        Route::get('/teacher-evidence', [AmalApiController::class, 'teacherEvidenceIndex']);
        Route::get('/teacher-evidence/{teacher}', [AmalApiController::class, 'teacherCriteria']);
        Route::get('/teacher-evidence/{teacher}/evidence/{evidence}', [AmalApiController::class, 'teacherUploads']);
    });
});

Route::get('/', function () {
    return auth()->check() ? redirect()->route('dashboard') : redirect()->route('login');
});

Route::get('/login', [AuthController::class, 'showLogin'])->name('login');
Route::post('/login', [AuthController::class, 'login'])->name('login.post');
Route::post('/logout', [AuthController::class, 'logout'])->name('logout');

Route::middleware('auth')->group(function () {
    Route::get('/set-password', [AuthController::class, 'showSetPassword'])->name('password.setup');
    Route::post('/set-password', [AuthController::class, 'setPassword'])->name('password.setup.store');
});

Route::middleware(['auth', 'password.set'])->group(function () {
    Route::prefix('api/v1')->group(function () {
        Route::get('/me', [AmalApiController::class, 'me']);
        Route::get('/dashboard', [AmalApiController::class, 'dashboard']);
        Route::get('/settings', [AmalApiController::class, 'settings']);

        Route::get('/evidence', [AmalApiController::class, 'evidenceIndex']);
        Route::post('/evidence', [AmalApiController::class, 'evidenceStore']);
        Route::get('/evidence/{evidence}', [AmalApiController::class, 'evidenceShow']);
        Route::put('/evidence/{evidence}', [AmalApiController::class, 'evidenceUpdate']);
        Route::patch('/evidence/{evidence}', [AmalApiController::class, 'evidenceUpdate']);
        Route::delete('/evidence/{evidence}', [AmalApiController::class, 'evidenceDestroy']);
        Route::post('/evidence/{evidence}/uploads', [AmalApiController::class, 'uploadEvidence']);
        Route::delete('/uploads/{upload}', [AmalApiController::class, 'uploadDestroy']);

        Route::get('/teachers', [AmalApiController::class, 'teachersIndex']);
        Route::post('/teachers', [AmalApiController::class, 'teacherStore']);
        Route::put('/teachers/{teacher}', [AmalApiController::class, 'teacherUpdate']);
        Route::patch('/teachers/{teacher}', [AmalApiController::class, 'teacherUpdate']);
        Route::delete('/teachers/{teacher}', [AmalApiController::class, 'teacherDestroy']);

        Route::get('/teacher-evidence', [AmalApiController::class, 'teacherEvidenceIndex']);
        Route::get('/teacher-evidence/{teacher}', [AmalApiController::class, 'teacherCriteria']);
        Route::get('/teacher-evidence/{teacher}/evidence/{evidence}', [AmalApiController::class, 'teacherUploads']);
    });

    Route::get('/dashboard', [DashboardController::class, 'index'])->name('dashboard');
    Route::get('/settings', [SettingsController::class, 'index'])->name('settings.index');
    Route::resource('teachers', TeacherController::class)->except(['show', 'create']);
    Route::get('/teacher-evidence', [TeacherAssessmentController::class, 'index'])->name('teacher-evidence.index');
    Route::get('/teacher-evidence/{teacher}', [TeacherAssessmentController::class, 'teacher'])->name('teacher-evidence.teacher');
    Route::get('/teacher-evidence/{teacher}/evidence/{evidence}', [TeacherEvidenceController::class, 'uploads'])->name('teacher-evidence.uploads');
    Route::get('/my-assessment', [TeacherAssessmentController::class, 'mine'])->name('teacher-assessment.mine');
    Route::post('/my-assessment/criterion/{criterion}/indicator/{indicator}/upload', [TeacherAssessmentController::class, 'upload'])->name('teacher-assessment.upload');
    Route::get('/assessment-uploads/{file}/download', [TeacherAssessmentController::class, 'download'])->name('teacher-assessment.download');
    Route::delete('/assessment-uploads/{file}', [TeacherAssessmentController::class, 'destroy'])->name('teacher-assessment.delete');
    Route::post('/teacher-evidence/{teacher}/criterion/{criterion}/rate', [TeacherAssessmentController::class, 'rate'])->name('teacher-assessment.rate');
    Route::resource('evidence', EvidenceItemController::class);
    Route::post('/evidence/{evidence}/uploads', [EvidenceUploadController::class, 'store'])->name('evidence.uploads.store');
    Route::get('/uploads/{upload}/preview', [EvidenceUploadController::class, 'preview'])->name('uploads.preview');
    Route::get('/uploads/{upload}/download', [EvidenceUploadController::class, 'download'])->name('uploads.download');
    Route::delete('/uploads/{upload}', [EvidenceUploadController::class, 'destroy'])->name('uploads.destroy');
});
