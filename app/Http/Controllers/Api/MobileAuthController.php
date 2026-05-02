<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class MobileAuthController extends Controller
{
    private function userResource(User $user): array
    {
        $user->loadMissing('school');

        return [
            'id' => $user->id,
            'name' => $user->name,
            'username' => $user->username,
            'role' => $user->role,
            'is_principal' => $user->isPrincipal(),
            'is_teacher' => $user->isTeacher(),
            'requires_password_setup' => blank($user->password),
            'school' => $user->school ? [
                'id' => $user->school->id,
                'name' => $user->school->name,
            ] : null,
        ];
    }

    private function issueToken(User $user): string
    {
        $token = Str::random(80);

        $user->forceFill([
            'mobile_api_token_hash' => hash('sha256', $token),
            'mobile_api_token_created_at' => now(),
        ])->save();

        return $token;
    }

    public function login(Request $request): JsonResponse
    {
        $data = $request->validate([
            'username' => ['required', 'string'],
            'password' => ['nullable', 'string'],
        ]);

        $user = User::where('username', trim($data['username']))->first();

        if (! $user) {
            return response()->json(['message' => 'بيانات الدخول غير صحيحة.'], 422);
        }

        if (blank($user->password)) {
            $token = $this->issueToken($user);

            return response()->json([
                'message' => 'يجب تعيين الرقم السري أولًا.',
                'token' => $token,
                'user' => $this->userResource($user->refresh()),
                'requires_password_setup' => true,
            ]);
        }

        if (blank($data['password'] ?? null) || ! Hash::check($data['password'], $user->password)) {
            return response()->json(['message' => 'بيانات الدخول غير صحيحة.'], 422);
        }

        $token = $this->issueToken($user);

        return response()->json([
            'message' => 'تم تسجيل الدخول بنجاح.',
            'token' => $token,
            'user' => $this->userResource($user->refresh()),
            'requires_password_setup' => false,
        ]);
    }

    public function setupPassword(Request $request): JsonResponse
    {
        $user = $request->user();

        $data = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'password' => ['required', 'confirmed', 'digits:4'],
        ], [
            'name.required' => 'فضلاً أدخلي الاسم للاعتماد.',
            'password.required' => 'فضلاً أدخلي الرقم السري الجديد.',
            'password.confirmed' => 'تأكيد الرقم السري غير مطابق.',
            'password.digits' => 'الرقم السري يجب أن يكون 4 خانات فقط.',
        ]);

        if (filled($user->password)) {
            return response()->json([
                'message' => 'الرقم السري معين مسبقًا.',
                'user' => $this->userResource($user),
            ]);
        }

        $user->forceFill([
            'name' => trim($data['name']),
            'password' => Hash::make($data['password']),
        ])->save();

        return response()->json([
            'message' => 'تم حفظ الاسم والرقم السري واعتماد الحساب بنجاح.',
            'user' => $this->userResource($user->refresh()),
        ]);
    }

    public function logout(Request $request): JsonResponse
    {
        $request->user()->forceFill([
            'mobile_api_token_hash' => null,
            'mobile_api_token_created_at' => null,
        ])->save();

        return response()->json(['message' => 'تم تسجيل الخروج.']);
    }
}
