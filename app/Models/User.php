<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;

class User extends Authenticatable
{
    use HasFactory, Notifiable;

    protected $fillable = [
        'school_id',
        'name',
        'email',
        'password',
        'role',
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
        ];
    }

    public function school()
    {
        return $this->belongsTo(School::class);
    }

    public function evidenceItems()
    {
        return $this->hasMany(EvidenceItem::class, 'created_by');
    }

    public function evidenceUploads()
    {
        return $this->hasMany(EvidenceUpload::class, 'uploaded_by');
    }

    public function isPrincipal(): bool
    {
        return $this->role === 'principal';
    }

    public function isTeacher(): bool
    {
        return $this->role === 'teacher';
    }
}
