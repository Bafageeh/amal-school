<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class School extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'city',
        'district',
    ];

    public function users()
    {
        return $this->hasMany(User::class);
    }

    public function evidenceItems()
    {
        return $this->hasMany(EvidenceItem::class);
    }

    public function evidenceUploads()
    {
        return $this->hasMany(EvidenceUpload::class);
    }
}
