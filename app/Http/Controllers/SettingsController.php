<?php

namespace App\Http\Controllers;

use Illuminate\Support\Facades\Auth;

class SettingsController extends Controller
{
    public function index()
    {
        abort_unless(Auth::user()->isPrincipal(), 403);

        return view('settings.index');
    }
}
