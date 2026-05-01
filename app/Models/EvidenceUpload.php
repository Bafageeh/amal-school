<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class EvidenceUpload extends Model
{
    use HasFactory;

    protected $fillable = [
        'school_id',
        'evidence_item_id',
        'uploaded_by',
        'title',
        'notes',
        'file_path',
        'file_type',
    ];

    public function school()
    {
        return $this->belongsTo(School::class);
    }

    public function evidenceItem()
    {
        return $this->belongsTo(EvidenceItem::class);
    }

    public function uploader()
    {
        return $this->belongsTo(User::class, 'uploaded_by');
    }
}
