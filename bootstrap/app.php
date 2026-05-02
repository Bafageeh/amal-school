<?php

use App\Http\Middleware\EnsurePasswordIsSet;
use App\Http\Middleware\MobileApiAuth;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        $middleware->alias([
            'password.set' => EnsurePasswordIsSet::class,
            'mobile.api.auth' => MobileApiAuth::class,
        ]);

        $middleware->validateCsrfTokens(except: [
            'mobile-api/v1/*',
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        //
    })->create();
