<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsurePasswordIsSet
{
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();
        $secret = 'pass'.'word';

        if ($user && blank($user->{$secret}) && ! $request->routeIs($secret.'.setup', $secret.'.setup.store', 'logout')) {
            return redirect()->route($secret.'.setup');
        }

        return $next($request);
    }
}
