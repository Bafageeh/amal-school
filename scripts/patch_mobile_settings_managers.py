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
p.with_suffix('.js.backup-before-adminbackheader-fix').write_text(text)

admin_header = '''
function AdminBackHeader({ title, onBack }) {
  return (
    <View style={styles.adminBackHeader}>
      <Text style={styles.pageTitle}>{title}</Text>
      <TouchableOpacity onPress={onBack} style={styles.headerBtn} activeOpacity={0.75}>
        <Ionicons name="arrow-forward-outline" size={20} color={C.primary} />
      </TouchableOpacity>
    </View>
  );
}
'''

if 'function AdminBackHeader' not in text:
    if 'function TeachersManagementScreen' in text:
        text = text.replace('function TeachersManagementScreen', admin_header + '\nfunction TeachersManagementScreen', 1)
    elif 'function MainApp' in text:
        text = text.replace('function MainApp', admin_header + '\nfunction MainApp', 1)
    else:
        raise SystemExit('No insertion point found')

if 'adminBackHeader:' not in text:
    idx = text.rfind('\n});')
    if idx == -1:
        raise SystemExit('StyleSheet ending not found')
    text = text[:idx] + "\n  adminBackHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 },\n" + text[idx:]

if 'const [settingsSub, setSettingsSub] = useState(null);' not in text:
    text = text.replace("const [tab, setTab] = useState('home');", "const [tab, setTab] = useState('home');\n  const [settingsSub, setSettingsSub] = useState(null);", 1)

p.write_text(text)

for item in ['function AdminBackHeader', 'adminBackHeader', 'setSettingsSub']:
    if item not in text:
        raise SystemExit('missing ' + item)

print('AdminBackHeader fixed in', p)
