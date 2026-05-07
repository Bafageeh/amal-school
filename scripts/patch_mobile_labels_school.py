from pathlib import Path
import os
import runpy

restore_script = Path('scripts/restore_mobile_app_safe.py')
if restore_script.exists():
    runpy.run_path(str(restore_script), run_name='__main__')
else:
    project = os.environ.get('PROJECT_PATH')
    APP_PATHS = [Path('mobile/App.js')]
    if project:
        APP_PATHS.insert(0, Path(project) / 'mobile' / 'App.js')
    APP_PATHS += [
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
