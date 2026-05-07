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
p.with_suffix('.js.backup-before-settingssub-fix').write_text(text)

# Ensure MainApp has settingsSub state before any SettingsScreen callback uses setSettingsSub.
if 'const [settingsSub, setSettingsSub] = useState(null);' not in text:
    text = text.replace(
        "const [tab, setTab] = useState('home');",
        "const [tab, setTab] = useState('home');\n  const [settingsSub, setSettingsSub] = useState(null);",
        1,
    )

# Normalize goTab so opening main tabs closes settings sub-screens and evidence details.
text = text.replace(
    "function goTab(next) { setSettingsSub(null); setTab(next); }",
    "function goTab(next) { setSettingsSub(null); setSelectedEvidence(null); setTab(next); }",
)
text = text.replace(
    "function goTab(next) { setSelectedEvidence(null); setTab(next); }",
    "function goTab(next) { setSettingsSub(null); setSelectedEvidence(null); setTab(next); }",
)
text = text.replace(
    "function goTab(next) { setTab(next); }",
    "function goTab(next) { setSettingsSub(null); setSelectedEvidence(null); setTab(next); }",
)

# Ensure settings sub-screen routes exist.
teacher_route = "else if (tab === 'settings' && settingsSub === 'teachers') screen = <TeachersManagementScreen token={token} onBack={() => setSettingsSub(null)} />;"
criteria_route = "else if (tab === 'settings' && settingsSub === 'criteria') screen = <CriteriaManagementScreen token={token} onBack={() => setSettingsSub(null)} />;"
settings_call = "else if (tab === 'settings') screen = <SettingsScreen user={user} onLogout={onLogout} onOpenTeachers={() => setSettingsSub('teachers')} onOpenCriteria={() => setSettingsSub('criteria')} />;"

# Replace any settings screen call so it always passes both callbacks.
text = re.sub(
    r"else if \(tab === 'settings'\) screen = <SettingsScreen[^;]*;",
    settings_call,
    text,
    count=1,
)

if teacher_route not in text:
    text = text.replace(settings_call, teacher_route + "\n  " + settings_call, 1)
if 'function CriteriaManagementScreen' in text and criteria_route not in text:
    text = text.replace(settings_call, criteria_route + "\n  " + settings_call, 1)

p.write_text(text)

required = [
    'const [settingsSub, setSettingsSub] = useState(null);',
    "onOpenTeachers={() => setSettingsSub('teachers')}",
]
missing = [item for item in required if item not in text]
if missing:
    raise SystemExit('settingsSub fix failed, missing: ' + ', '.join(missing))

print('settingsSub fix applied to', p)
