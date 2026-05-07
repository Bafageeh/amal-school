from pathlib import Path

APP_PATHS = [
    Path('mobile/App.js'),
    Path('/mnt/home-storage/home/pmsa/apps/amal-school/amal-school-api/mobile/App.js'),
    Path('/home/pmsa/apps/amal-school/amal-school-api/mobile/App.js'),
]

p = next((path for path in APP_PATHS if path.exists()), None)
if p is None:
    raise SystemExit('mobile/App.js not found')

text = p.read_text()
p.with_suffix('.js.backup-before-teacher-followup-session').write_text(text)

old = "Alert.alert('تعذر تحميل المعلمات', error.message);"
new = "if (String(error.message || '').includes('جلسة الجوال') || String(error.message || '').includes('غير مصرح')) { setTeachers([]); } else { Alert.alert('تعذر تحميل المعلمات', error.message); }"
text = text.replace(old, new)

p.write_text(text)

if "setTeachers([])" not in text:
    raise SystemExit('teacher follow-up session handling was not applied')

print('teacher follow-up session popup silenced in', p)
