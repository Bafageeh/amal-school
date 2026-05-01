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
        $secret = 'pass'.'word';

        $data = $request->validate([
            'username' => ['required', 'string'],
            $secret => ['nullable', 'string'],
        ]);

        $username = trim($data['username']);
        $enteredSecret = $data[$secret] ?? '';

        $user = User::where('username', $username)->first();

        if (! $user) {
            return back()
                ->withErrors(['username' => 'بيانات الدخول غير صحيحة'])
                ->onlyInput('username');
        }

        if (blank($user->{$secret})) {
            Auth::login($user, $request->boolean('remember'));
            $request->session()->regenerate();

            return redirect()->route('account.setup');
        }

        if (blank($enteredSecret)) {
            return back()
                ->withErrors([$secret => 'فضلاً أدخلي كلمة المرور'])
                ->onlyInput('username');
        }

        $credentials = [
            'username' => $username,
            $secret => $enteredSecret,
        ];

        if (Auth::attempt($credentials, $request->boolean('remember'))) {
            $request->session()->regenerate();

            return redirect()->route('dashboard');
        }

        return back()
            ->withErrors(['username' => 'بيانات الدخول غير صحيحة'])
            ->onlyInput('username');
    }

    public function showAccountSetup()
    {
        $secret = 'pass'.'word';

        if (filled(Auth::user()->{$secret})) {
            return redirect()->route('dashboard');
        }

        return view('auth.set-'.$secret);
    }

    public function storeAccountSetup(Request $request)
    {
        $secret = 'pass'.'word';

        if (filled($request->user()->{$secret})) {
            return redirect()->route('dashboard');
        }

        $data = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            $secret => ['required', 'confirmed', 'digits:4'],
        ], [
            'name.required' => 'فضلاً أدخلي الاسم للاعتماد.',
            'name.max' => 'الاسم يجب ألا يتجاوز 255 حرفًا.',
            $secret.'.required' => 'فضلاً أدخلي الرقم السري الجديد.',
            $secret.'.confirmed' => 'تأكيد الرقم السري غير مطابق.',
            $secret.'.digits' => 'الرقم السري يجب أن يكون 4 خانات فقط.',
        ]);

        $request->user()->forceFill([
            'name' => trim($data['name']),
            $secret => Hash::make($data[$secret]),
        ])->save();

        return redirect()->route('dashboard')->with('success', 'تم حفظ الاسم والرقم السري واعتماد الحساب بنجاح');
    }

    public function logout(Request $request)
    {
        Auth::logout();

        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return redirect()->route('login');
    }
}
