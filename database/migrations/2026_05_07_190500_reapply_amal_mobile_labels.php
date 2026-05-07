<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        DB::table('schools')->update(['name' => 'مدرسة المراسلات']);

        $appPath = base_path('mobile/App.js');
        if (! is_file($appPath)) {
            return;
        }

        $text = file_get_contents($appPath);
        if ($text === false) {
            return;
        }

        $text = str_replace('title="إضافة معلمة"', 'title="إدارة المعلمات"', $text);
        $text = str_replace('title="المعلمات" subtitle="إضافة وتعديل وحذف حسابات المعلمات"', 'title="إدارة المعلمات" subtitle="إضافة وتعديل وحذف المعلمات"', $text);
        $text = str_replace('title="المعلمات" subtitle="إضافة وتعديل وحذف المعلمات"', 'title="إدارة المعلمات" subtitle="إضافة وتعديل وحذف المعلمات"', $text);
        $text = str_replace('title="إدارة" subtitle="إنشاء وتعديل وحذف"', 'title="إدارة المعايير" subtitle="إنشاء وتعديل وحذف المعايير"', $text);
        $text = str_replace('title="متابعة ملفات المعلمات" subtitle="استعراض ملفات كل معلمة حسب المعيار"', 'title="إدارة المعايير" subtitle="إنشاء وتعديل وحذف المعايير"', $text);
        $text = str_replace('>إضافة معلمة<', '>إدارة المعلمات<', $text);
        $text = str_replace('>إدارة<', '>إدارة المعايير<', $text);
        $text = str_replace('مدرسة أمل', 'مدرسة المراسلات', $text);
        $text = str_replace("user?.school?.name || 'مدرسة'", "user?.school?.name || 'مدرسة المراسلات'", $text);

        file_put_contents($appPath, $text);
    }

    public function down(): void
    {
        // keep requested labels
    }
};
