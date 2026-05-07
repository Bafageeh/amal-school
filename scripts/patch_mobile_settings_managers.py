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
p.with_suffix('.js.backup-before-inline-headers').write_text(text)

def inline_header(title):
    return (
        '<View style={styles.adminBackHeader}>'
        f'<Text style={{styles.pageTitle}}>{title}</Text>'
        '<TouchableOpacity onPress={onBack} style={styles.headerBtn} activeOpacity={0.75}>'
        '<Ionicons name="arrow-forward-outline" size={20} color={C.primary} />'
        '</TouchableOpacity>'
        '</View>'
    )

# Remove dependency on AdminBackHeader completely.
text = re.sub(r'<AdminBackHeader\s+title="إضافة معلمة"\s+onBack=\{onBack\}\s*/>', inline_header('إضافة معلمة'), text)
text = re.sub(r'<AdminBackHeader\s+title="إدارة المعايير"\s+onBack=\{onBack\}\s*/>', inline_header('إدارة المعايير'), text)
text = re.sub(r'<AdminBackHeader\s+title=\{selectedTeacher\.name\}\s+onBack=\{\(\) => setSelectedTeacher\(null\)\}\s*/>', (
    '<View style={styles.adminBackHeader}>'
    '<Text style={styles.pageTitle}>{selectedTeacher.name}</Text>'
    '<TouchableOpacity onPress={() => setSelectedTeacher(null)} style={styles.headerBtn} activeOpacity={0.75}>'
    '<Ionicons name="arrow-forward-outline" size={20} color={C.primary} />'
    '</TouchableOpacity>'
    '</View>'
), text)

if 'adminBackHeader:' not in text:
    idx = text.rfind('\n});')
    if idx == -1:
        raise SystemExit('StyleSheet ending not found')
    text = text[:idx] + "\n  adminBackHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 },\n" + text[idx:]

# Keep settingsSub available for settings cards.
if 'const [settingsSub, setSettingsSub] = useState(null);' not in text:
    text = text.replace(
        "const [tab, setTab] = useState('home');",
        "const [tab, setTab] = useState('home');\n  const [settingsSub, setSettingsSub] = useState(null);",
        1,
    )

# Keep routes present.
teacher_route = "else if (tab === 'settings' && settingsSub === 'teachers') screen = <TeachersManagementScreen token={token} onBack={() => setSettingsSub(null)} />;"
criteria_route = "else if (tab === 'settings' && settingsSub === 'criteria') screen = <CriteriaManagementScreen token={token} onBack={() => setSettingsSub(null)} />;"
settings_call = "else if (tab === 'settings') screen = <SettingsScreen user={user} onLogout={onLogout} onOpenTeachers={() => setSettingsSub('teachers')} onOpenCriteria={() => setSettingsSub('criteria')} />;"
text = re.sub(r"else if \(tab === 'settings'\) screen = <SettingsScreen[^;]*;", settings_call, text, count=1)
if teacher_route not in text and settings_call in text:
    text = text.replace(settings_call, teacher_route + "\n  " + settings_call, 1)
if 'function CriteriaManagementScreen' in text and criteria_route not in text and settings_call in text:
    text = text.replace(settings_call, criteria_route + "\n  " + settings_call, 1)

p.write_text(text)

if 'AdminBackHeader title="إضافة معلمة"' in text or 'AdminBackHeader title="إدارة المعايير"' in text:
    raise SystemExit('AdminBackHeader usage still exists in manager screens')
for item in ['adminBackHeader', 'setSettingsSub', 'إضافة معلمة']:
    if item not in text:
        raise SystemExit('missing ' + item)
print('inline headers patch applied to', p)
