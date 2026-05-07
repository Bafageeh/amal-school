from pathlib import Path

APP_PATHS = [
    Path('mobile/App.js'),
    Path('/mnt/home-storage/home/pmsa/apps/amal-school/amal-school-api/mobile/App.js'),
    Path('/home/pmsa/apps/amal-school/amal-school-api/mobile/App.js'),
]

p = next((x for x in APP_PATHS if x.exists()), None)
if p is None:
    raise SystemExit('mobile/App.js not found')

text = p.read_text()
replacements = {
    'title="إضافة معلمة"': 'title="إدارة المعلمات"',
    'title="المعلمات" subtitle="إضافة وتعديل وحذف حسابات المعلمات"': 'title="إدارة المعلمات" subtitle="إضافة وتعديل وحذف المعلمات"',
    'title="إدارة" subtitle="إنشاء وتعديل وحذف"': 'title="إدارة المعايير" subtitle="إنشاء وتعديل وحذف المعايير"',
    'title="متابعة ملفات المعلمات" subtitle="استعراض ملفات كل معلمة حسب المعيار"': 'title="إدارة المعايير" subtitle="إنشاء وتعديل وحذف المعايير"',
    "user?.school?.name || 'مدرسة'": "user?.school?.name || 'مدرسة المراسلات'",
}
for old, new in replacements.items():
    text = text.replace(old, new)

p.write_text(text)
print('Patched Amal labels and fallback school name in', p)
