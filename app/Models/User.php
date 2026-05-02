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
        'username',
        'email',
        'password',
        'role',
        'mobile_api_token_hash',
        'mobile_api_token_created_at',
    ];

    protected $hidden = [
        'password',
        'remember_token',
        'mobile_api_token_hash',
    ];

    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'mobile_api_token_created_at' => 'datetime',
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
