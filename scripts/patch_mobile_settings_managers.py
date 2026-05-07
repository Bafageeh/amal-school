from pathlib import Path
import re

APP_PATHS = [Path('mobile/App.js'), Path('/mnt/home-storage/home/pmsa/apps/amal-school/amal-school-api/mobile/App.js'), Path('/home/pmsa/apps/amal-school/amal-school-api/mobile/App.js')]
p = next((x for x in APP_PATHS if x.exists()), None)
if p is None:
    raise SystemExit('mobile/App.js not found')
text = p.read_text()
p.with_suffix('.js.backup-before-teacherfiles-simple').write_text(text)

screen = '''
function TeacherFilesScreen({ token, onBack }) {
  const [loading, setLoading] = useState(true);
  const [teachers, setTeachers] = useState([]);
  useEffect(() => {
    let alive = true;
    async function load() {
      setLoading(true);
      try {
        const data = await requestJson('/teacher-evidence', { token });
        if (alive) setTeachers(data.teachers || []);
      } catch (error) {
        if (alive) setTeachers([]);
      } finally {
        if (alive) setLoading(false);
      }
    }
    load();
    return () => { alive = false; };
  }, [token]);
  return (
    <ScrollView contentContainerStyle={styles.screenPad} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
      <Text style={styles.pageTitle}>متابعة المعلمات</Text>
      <Text style={styles.pageSubtitle}>اختاري المعلمة ثم المعيار لعرض الملفات</Text>
      {loading ? <ActivityIndicator color={C.primary} size="large" style={{ marginTop: 30 }} /> : (
        <View style={styles.listCard}>
          {teachers.length === 0 ? <View style={[styles.actionRow, { borderBottomWidth: 0 }]}><View style={styles.actionRowText}><Text style={styles.actionRowTitle}>لا توجد معلمات</Text></View><View style={[styles.actionRowIcon, { backgroundColor: C.primaryLight }]}><Ionicons name="information-circle-outline" size={20} color={C.primary} /></View></View> : teachers.map((teacher, idx) => (
            <View key={teacher.id} style={[styles.actionRow, idx === teachers.length - 1 && { borderBottomWidth: 0 }]}>
              <View style={styles.actionRowText}><Text style={styles.actionRowTitle}>{teacher.name}</Text><Text style={styles.actionRowSub}>عدد الملفات: {teacher.uploads_count ?? 0}</Text></View>
              <View style={[styles.actionRowIcon, { backgroundColor: C.goldLight }]}><Ionicons name="folder-outline" size={20} color={C.gold} /></View>
            </View>
          ))}
        </View>
      )}
    </ScrollView>
  );
}
'''

if 'function TeacherFilesScreen' not in text:
    text = text.replace('function MainApp', screen + '\nfunction MainApp', 1)

route = "else if (tab === 'teacherFiles') screen = <TeacherFilesScreen token={token} onBack={() => goTab('home')} onOpenEvidence={(item) => setSelectedEvidence(item)} />;"
text = re.sub(r"\n\s*else if \(tab === 'teacherFiles'\) screen = <TeacherFilesScreen[^;]*;", "", text)
marker = "else if (tab === 'evidence')"
if marker not in text:
    marker = "else if (tab === 'settings'"
if marker not in text:
    raise SystemExit('route marker not found')
text = text.replace(marker, route + "\n  " + marker, 1)
text = re.sub(r"<BottomNav tab=\{tab\} setTab=\{[^}]+\} isPrincipal=\{isPrincipal\} />", "<BottomNav tab={tab} setTab={goTab} isPrincipal={isPrincipal} />", text, count=1)

if "id: 'teacherFiles'" not in text:
    text = text.replace("{ id: 'evidence', icon: 'list', iconOff: 'list-outline', label: 'حسب المعايير' },", "{ id: 'evidence', icon: 'list', iconOff: 'list-outline', label: 'حسب المعايير' },\n    ...(isPrincipal ? [{ id: 'teacherFiles', icon: 'folder-open', iconOff: 'folder-open-outline', label: 'متابعة المعلمات' }] : []),", 1)

p.write_text(text)
for item in ['function TeacherFilesScreen', "tab === 'teacherFiles'", "id: 'teacherFiles'", 'متابعة المعلمات']:
    if item not in text:
        raise SystemExit('missing ' + item)
print('simple TeacherFilesScreen fixed in', p)
