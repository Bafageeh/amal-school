from pathlib import Path
import re

APP_PATHS = [
    Path('mobile/App.js'),
    Path('/mnt/home-storage/home/pmsa/apps/amal-school/amal-school-api/mobile/App.js'),
    Path('/home/pmsa/apps/amal-school/amal-school-api/mobile/App.js'),
]

p = next((path for path in APP_PATHS if path.exists()), None)
if p is None:
    raise SystemExit('mobile/App.js not found')

text = p.read_text()
p.with_suffix('.js.backup-before-teacherfiles-route').write_text(text)

# Ensure the bottom tab exists and is named متابعة المعلمات.
if "id: 'teacherFiles'" not in text:
    text = text.replace(
        "{ id: 'evidence', icon: 'list', iconOff: 'list-outline', label: 'حسب المعايير' },",
        "{ id: 'evidence', icon: 'list', iconOff: 'list-outline', label: 'حسب المعايير' },\n    ...(isPrincipal ? [{ id: 'teacherFiles', icon: 'folder-open', iconOff: 'folder-open-outline', label: 'متابعة المعلمات' }] : []),",
        1,
    )

# Ensure changing tabs closes settings sub-screens and evidence details.
text = text.replace(
    "function goTab(next) { setSettingsSub(null); setTab(next); }",
    "function goTab(next) { setSettingsSub(null); setSelectedEvidence(null); setTab(next); }",
)
text = text.replace(
    "function goTab(next) { setSelectedEvidence(null); setTab(next); }",
    "function goTab(next) { setSettingsSub(null); setSelectedEvidence(null); setTab(next); }",
)

# Force bottom tab teacherFiles to open TeacherFilesScreen directly.
route = "else if (tab === 'teacherFiles') screen = <TeacherFilesScreen token={token} onBack={() => goTab('home')} onOpenEvidence={(item) => setSelectedEvidence(item)} />;"
text = re.sub(
    r"else if \(tab === 'teacherFiles'\) screen = <TeacherFilesScreen[^;]*;",
    route,
    text,
    count=1,
)
if route not in text:
    marker = "else if (tab === 'settings'"
    pos = text.find(marker)
    if pos == -1:
        marker = "else if (tab === 'evidence')"
        pos = text.find(marker)
    if pos == -1:
        raise SystemExit('Could not find route insertion point')
    text = text[:pos] + route + "\n  " + text[pos:]

# Do not show the invalid-session popup inside teacher follow-up; keep the screen open.
old = "Alert.alert('تعذر تحميل المعلمات', error.message);"
new = "if (String(error.message || '').includes('جلسة الجوال') || String(error.message || '').includes('غير مصرح')) { setTeachers([]); } else { Alert.alert('تعذر تحميل المعلمات', error.message); }"
text = text.replace(old, new)

p.write_text(text)

required = ["id: 'teacherFiles'", "label: 'متابعة المعلمات'", "tab === 'teacherFiles'", "TeacherFilesScreen"]
missing = [x for x in required if x not in text]
if missing:
    raise SystemExit('teacherFiles bottom tab route patch failed, missing: ' + ', '.join(missing))

print('teacherFiles bottom tab now opens TeacherFilesScreen in', p)
