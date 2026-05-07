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

        $replacements = [
            'title="إضافة معلمة"' => 'title="إدارة المعلمات"',
            'title="المعلمات" subtitle="إضافة وتعديل وحذف حسابات المعلمات"' => 'title="إدارة المعلمات" subtitle="إضافة وتعديل وحذف المعلمات"',
            'title="إدارة" subtitle="إنشاء وتعديل وحذف"' => 'title="إدارة المعايير" subtitle="إنشاء وتعديل وحذف المعايير"',
            'title="متابعة ملفات المعلمات" subtitle="استعراض ملفات كل معلمة حسب المعيار"' => 'title="إدارة المعايير" subtitle="إنشاء وتعديل وحذف المعايير"',
            "user?.school?.name || 'مدرسة'" => "user?.school?.name || 'مدرسة المراسلات'",
        ];

        $text = str_replace(array_keys($replacements), array_values($replacements), $text);
        file_put_contents($appPath, $text);
    }

    public function down(): void
    {
        // نصوص واجهة فقط؛ لا نرجع اسم المدرسة لتجنب تغيير بيانات فعلية بدون قصد.
    }
};
