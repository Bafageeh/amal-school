<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;

class AuthController extends Controller
{
    public function showLogin()
    {
        if (Auth::check()) {
            return redirect()->route('dashboard');
        }

        return view('auth.login');
    }

    public function login(Request $request)
    {
        $data = $request->validate([
            'username' => ['required', 'string'],
            'password' => ['nullable', 'string'],
        ]);

        $username = trim($data['username']);
        $password = $data['password'] ?? '';

        $user = User::where('username', $username)->first();

        if (! $user) {
            return back()
                ->withErrors(['username' => 'بيانات الدخول غير صحيحة'])
                ->onlyInput('username');
        }

        if (blank($user->password) && $user->isTeacher()) {
            Auth::login($user, $request->boolean('remember'));
            $request->session()->regenerate();

            return redirect()->route('password.setup');
        }

        if (blank($password)) {
            return back()
                ->withErrors(['password' => 'فضلاً أدخلي كلمة المرور'])
                ->onlyInput('username');
        }

        $credentials = [
            'username' => $username,
            'password' => $password,
        ];

        if (Auth::attempt($credentials, $request->boolean('remember'))) {
            $request->session()->regenerate();

            return redirect()->route('dashboard');
        }

        return back()
            ->withErrors(['username' => 'بيانات الدخول غير صحيحة'])
            ->onlyInput('username');
    }

    public function showSetPassword()
    {
        if (filled(Auth::user()->password)) {
            return redirect()->route('dashboard');
        }

        return view('auth.set-password');
    }

    public function setPassword(Request $request)
    {
        if (filled($request->user()->password)) {
            return redirect()->route('dashboard');
        }

        $data = $request->validate([
            'password' => ['required', 'confirmed', 'digits:4'],
        ], [
            'password.required' => 'فضلاً أدخلي الرقم السري الجديد.',
            'password.confirmed' => 'تأكيد الرقم السري غير مطابق.',
            'password.digits' => 'الرقم السري يجب أن يكون 4 خانات فقط.',
        ]);

        $request->user()->forceFill([
            'password' => Hash::make($data['password']),
        ])->save();

        return redirect()->route('dashboard')->with('success', 'تم حفظ الرقم السري بنجاح');
    }

    public function logout(Request $request)
    {
        Auth::logout();

        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return redirect()->route('login');
    }
}
