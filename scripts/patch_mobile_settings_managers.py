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
p.with_suffix('.js.backup-before-force-teacherfiles-screen').write_text(text)

route = "else if (tab === 'teacherFiles') screen = <TeacherFilesScreen token={token} onBack={() => goTab('home')} onOpenEvidence={(item) => setSelectedEvidence(item)} />;"

# Ensure bottom tab exists.
if "id: 'teacherFiles'" not in text:
    text = text.replace(
        "{ id: 'evidence', icon: 'list', iconOff: 'list-outline', label: 'حسب المعايير' },",
        "{ id: 'evidence', icon: 'list', iconOff: 'list-outline', label: 'حسب المعايير' },\n    ...(isPrincipal ? [{ id: 'teacherFiles', icon: 'folder-open', iconOff: 'folder-open-outline', label: 'متابعة المعلمات' }] : []),",
        1,
    )

# Make sure goTab clears old sub screens/details.
text = re.sub(
    r"function goTab\(next\) \{.*?\}",
    "function goTab(next) { setSettingsSub(null); setSelectedEvidence(null); setTab(next); }",
    text,
    count=1,
    flags=re.S,
)

# Remove any existing teacherFiles route, then insert it before evidence/settings/home selection.
text = re.sub(r"\n\s*else if \(tab === 'teacherFiles'\) screen = <TeacherFilesScreen[^;]*;", "", text)

patterns = [
    "else if (tab === 'evidence')",
    "else if (tab === 'settings'",
    "else screen = <HomeScreen",
]
for marker in patterns:
    pos = text.find(marker)
    if pos != -1:
        text = text[:pos] + route + "\n  " + text[pos:]
        break
else:
    raise SystemExit('Could not insert teacherFiles screen route')

# Ensure BottomNav uses goTab, not raw setTab, in MainApp.
text = re.sub(
    r"<BottomNav tab=\{tab\} setTab=\{[^}]+\} isPrincipal=\{isPrincipal\} />",
    "<BottomNav tab={tab} setTab={goTab} isPrincipal={isPrincipal} />",
    text,
    count=1,
)

# Keep invalid session popup quiet on the follow-up screen.
text = text.replace(
    "Alert.alert('تعذر تحميل المعلمات', error.message);",
    "if (String(error.message || '').includes('جلسة الجوال') || String(error.message || '').includes('غير مصرح')) { setTeachers([]); } else { Alert.alert('تعذر تحميل المعلمات', error.message); }"
)

p.write_text(text)

required = ["id: 'teacherFiles'", "label: 'متابعة المعلمات'", route, "setTab={goTab}"]
missing = [item for item in required if item not in text]
if missing:
    raise SystemExit('teacherFiles route fix failed, missing: ' + ', '.join(missing))

print('teacherFiles bottom tab is forced to TeacherFilesScreen in', p)
