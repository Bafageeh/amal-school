<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;

class TeacherController extends Controller
{
    private function principalOnly(): void
    {
        abort_unless(Auth::user()->isPrincipal(), 403);
    }

    private function teacherEmailFromUsername(string $username): string
    {
        return $username . '@teachers.local';
    }

    public function index()
    {
        $this->principalOnly();

        $teachers = User::where('school_id', Auth::user()->school_id)
            ->where('role', 'teacher')
            ->orderByRaw("CAST(REGEXP_SUBSTR(username, '[0-9]+$') AS UNSIGNED) IS NULL")
            ->orderByRaw("CAST(REGEXP_SUBSTR(username, '[0-9]+$') AS UNSIGNED)")
            ->orderBy('username')
            ->get();

        return view('teachers.index', compact('teachers'));
    }

    public function store(Request $request)
    {
        $this->principalOnly();

        $data = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'username' => ['required', 'string', 'max:255', 'alpha_dash', 'unique:users,username'],
            'password' => ['nullable', 'digits:4'],
        ], [
            'username.alpha_dash' => 'اسم المستخدم يسمح بالحروف والأرقام والشرطة والشرطة السفلية فقط.',
            'password.digits' => 'كلمة مرور المعلمة يجب أن تكون 4 خانات فقط.',
        ]);

        User::create([
            'school_id' => Auth::user()->school_id,
            'name' => $data['name'],
            'username' => $data['username'],
            'email' => $this->teacherEmailFromUsername($data['username']),
            'password' => filled($data['password'] ?? null) ? Hash::make($data['password']) : null,
            'role' => 'teacher',
        ]);

        return redirect()->route('teachers.index')->with('success', 'تم إنشاء حساب المعلمة بنجاح');
    }

    public function edit(User $teacher)
    {
        $this->principalOnly();

        abort_unless($teacher->school_id === Auth::user()->school_id && $teacher->role === 'teacher', 404);

        return view('teachers.edit', compact('teacher'));
    }

    public function update(Request $request, User $teacher)
    {
        $this->principalOnly();

        abort_unless($teacher->school_id === Auth::user()->school_id && $teacher->role === 'teacher', 404);

        $data = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'username' => [
                'required',
                'string',
                'max:255',
                'alpha_dash',
                Rule::unique('users', 'username')->ignore($teacher->id),
            ],
            'password' => ['nullable', 'digits:4'],
        ], [
            'username.alpha_dash' => 'اسم المستخدم يسمح بالحروف والأرقام والشرطة والشرطة السفلية فقط.',
            'password.digits' => 'كلمة مرور المعلمة يجب أن تكون 4 خانات فقط.',
        ]);

        $teacher->name = $data['name'];
        $teacher->username = $data['username'];
        $teacher->email = $this->teacherEmailFromUsername($data['username']);

        if (filled($data['password'] ?? null)) {
            $teacher->password = Hash::make($data['password']);
        }

        $teacher->save();

        return redirect()->route('teachers.index')->with('success', 'تم تحديث بيانات المعلمة');
    }

    public function destroy(User $teacher)
    {
        $this->principalOnly();

        abort_unless($teacher->school_id === Auth::user()->school_id && $teacher->role === 'teacher', 404);

        $teacher->delete();

        return redirect()->route('teachers.index')->with('success', 'تم حذف حساب المعلمة');
    }
}
