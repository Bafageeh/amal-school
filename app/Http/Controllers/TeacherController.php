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

    public function index()
    {
        $this->principalOnly();

        $teachers = User::where('school_id', Auth::user()->school_id)
            ->where('role', 'teacher')
            ->latest()
            ->get();

        return view('teachers.index', compact('teachers'));
    }

    public function store(Request $request)
    {
        $this->principalOnly();

        $data = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'max:255', 'unique:users,email'],
            'password' => ['required', 'string', 'min:6'],
        ]);

        User::create([
            'school_id' => Auth::user()->school_id,
            'name' => $data['name'],
            'email' => $data['email'],
            'password' => Hash::make($data['password']),
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
            'email' => [
                'required',
                'email',
                'max:255',
                Rule::unique('users', 'email')->ignore($teacher->id),
            ],
            'password' => ['nullable', 'string', 'min:6'],
        ]);

        $teacher->name = $data['name'];
        $teacher->email = $data['email'];

        if (!empty($data['password'])) {
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
