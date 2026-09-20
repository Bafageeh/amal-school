<?php

namespace App\Http\Middleware;

use App\Models\User;
use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Symfony\Component\HttpFoundation\Response;

class MobileApiAuth
{
    public function handle(Request $request, Closure $next): Response
    {
        $header = $request->header('Authorization', '');

        if (! str_starts_with($header, 'Bearer ')) {
            return response()->json(['message' => 'غير مصرح.'], 401);
        }

        $token = trim(substr($header, 7));

        if ($token === '') {
            return response()->json(['message' => 'غير مصرح.'], 401);
        }

        $tokenHash = hash('sha256', $token);
        $user = null;

        if (Schema::hasTable('mobile_api_tokens')) {
            $session = DB::table('mobile_api_tokens')
                ->where('token_hash', $tokenHash)
                ->first();

            if ($session) {
                $user = User::find($session->user_id);
            }
        }

        // Fallback keeps existing installed clients working during/after migration.
        $user ??= User::where('mobile_api_token_hash', $tokenHash)->first();

        if (! $user) {
            return response()->json(['message' => 'جلسة الجوال غير صالحة.'], 401);
        }

        Auth::setUser($user);
        $request->setUserResolver(fn () => $user);

        return $next($request);
    }
}
