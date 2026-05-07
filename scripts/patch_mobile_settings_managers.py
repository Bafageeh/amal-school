from pathlib import Path
import re

APP_PATHS = [Path('mobile/App.js'), Path('/mnt/home-storage/home/pmsa/apps/amal-school/amal-school-api/mobile/App.js'), Path('/home/pmsa/apps/amal-school/amal-school-api/mobile/App.js')]
p = next((x for x in APP_PATHS if x.exists()), None)
if p is None:
    raise SystemExit('mobile/App.js not found')
text = p.read_text()
p.with_suffix('.js.backup-before-teacherfiles-criteria').write_text(text)

screen = '''
function TeacherFilesScreen({ token, onBack, onOpenEvidence }) {
  const [loading, setLoading] = useState(true);
  const [teachers, setTeachers] = useState([]);
  const [selectedTeacher, setSelectedTeacher] = useState(null);
  const [criteria, setCriteria] = useState([]);
  const [criteriaLoading, setCriteriaLoading] = useState(false);

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

  async function openTeacher(teacher) {
    setSelectedTeacher(teacher);
    setCriteria([]);
    setCriteriaLoading(true);
    try {
      const data = await requestJson(`/teacher-evidence/${teacher.id}`, { token });
      setCriteria(data.items || []);
    } catch (error) {
      setCriteria([]);
      Alert.alert('تعذر تحميل المعايير', error.message);
    } finally {
      setCriteriaLoading(false);
    }
  }

  if (selectedTeacher) {
    return (
      <ScrollView contentContainerStyle={styles.screenPad} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        <View style={styles.adminBackHeader}>
          <Text style={styles.pageTitle}>{selectedTeacher.name}</Text>
          <TouchableOpacity onPress={() => setSelectedTeacher(null)} style={styles.headerBtn} activeOpacity={0.75}>
            <Ionicons name="arrow-forward-outline" size={20} color={C.primary} />
          </TouchableOpacity>
        </View>
        <Text style={styles.pageSubtitle}>اختاري المعيار لعرض ملفات هذه المعلمة</Text>
        {criteriaLoading ? <ActivityIndicator color={C.primary} size="large" style={{ marginTop: 30 }} /> : (
          <View style={styles.listCard}>
            {criteria.length === 0 ? <View style={[styles.actionRow, { borderBottomWidth: 0 }]}><View style={styles.actionRowText}><Text style={styles.actionRowTitle}>لا توجد معايير</Text></View><View style={[styles.actionRowIcon, { backgroundColor: C.primaryLight }]}><Ionicons name="information-circle-outline" size={20} color={C.primary} /></View></View> : criteria.map((item, idx) => (
              <TouchableOpacity key={item.id} style={[styles.actionRow, idx === criteria.length - 1 && { borderBottomWidth: 0 }]} activeOpacity={0.8} onPress={() => onOpenEvidence(item)}>
                <Ionicons name="chevron-back" size={16} color={C.border} />
                <View style={styles.actionRowText}>
                  <Text style={styles.actionRowTitle}>{item.title}</Text>
                  <Text style={styles.actionRowSub}>ملفات هذه المعلمة: {item.teacher_uploads_count ?? 0}</Text>
                </View>
                <View style={[styles.actionRowIcon, { backgroundColor: C.primaryLight }]}><Ionicons name="folder-open-outline" size={20} color={C.primary} /></View>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.screenPad} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
      <Text style={styles.pageTitle}>متابعة المعلمات</Text>
      <Text style={styles.pageSubtitle}>اختاري المعلمة ثم المعيار لعرض الملفات</Text>
      {loading ? <ActivityIndicator color={C.primary} size="large" style={{ marginTop: 30 }} /> : (
        <View style={styles.listCard}>
          {teachers.length === 0 ? <View style={[styles.actionRow, { borderBottomWidth: 0 }]}><View style={styles.actionRowText}><Text style={styles.actionRowTitle}>لا توجد معلمات</Text></View><View style={[styles.actionRowIcon, { backgroundColor: C.primaryLight }]}><Ionicons name="information-circle-outline" size={20} color={C.primary} /></View></View> : teachers.map((teacher, idx) => (
            <TouchableOpacity key={teacher.id} style={[styles.actionRow, idx === teachers.length - 1 && { borderBottomWidth: 0 }]} activeOpacity={0.8} onPress={() => openTeacher(teacher)}>
              <Ionicons name="chevron-back" size={16} color={C.border} />
              <View style={styles.actionRowText}><Text style={styles.actionRowTitle}>{teacher.name}</Text><Text style={styles.actionRowSub}>عدد الملفات: {teacher.uploads_count ?? 0}</Text></View>
              <View style={[styles.actionRowIcon, { backgroundColor: C.goldLight }]}><Ionicons name="folder-outline" size={20} color={C.gold} /></View>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </ScrollView>
  );
}
'''

text = re.sub(r"function TeacherFilesScreen\(\{.*?\n\}\n\nfunction MainApp", screen + "\n\nfunction MainApp", text, flags=re.S, count=1)
if 'function TeacherFilesScreen' not in text:
    text = text.replace('function MainApp', screen + '\nfunction MainApp', 1)

if 'adminBackHeader:' not in text:
    idx = text.rfind('\n});')
    if idx != -1:
        text = text[:idx] + "\n  adminBackHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 },\n" + text[idx:]

route = "else if (tab === 'teacherFiles') screen = <TeacherFilesScreen token={token} onBack={() => setTab('home')} onOpenEvidence={(item) => setSelectedEvidence(item)} />;"
text = re.sub(r"\n\s*else if \(tab === 'teacherFiles'\) screen = <TeacherFilesScreen[^;]*;", "", text)
marker = "else if (tab === 'evidence')"
if marker not in text:
    marker = "else if (tab === 'settings'"
if marker not in text:
    raise SystemExit('route marker not found')
text = text.replace(marker, route + "\n  " + marker, 1)

if "id: 'teacherFiles'" not in text:
    text = text.replace("{ id: 'evidence', icon: 'list', iconOff: 'list-outline', label: 'حسب المعايير' },", "{ id: 'evidence', icon: 'list', iconOff: 'list-outline', label: 'حسب المعايير' },\n    ...(isPrincipal ? [{ id: 'teacherFiles', icon: 'folder-open', iconOff: 'folder-open-outline', label: 'متابعة المعلمات' }] : []),", 1)

text = text.replace('setTab={goTab}', 'setTab={(next) => { setSettingsSub(null); setSelectedEvidence(null); setTab(next); }}')
text = text.replace("onBack={() => goTab('home')}", "onBack={() => setTab('home')}")

p.write_text(text)
for item in ['function TeacherFilesScreen', 'openTeacher', 'setSelectedTeacher', 'teacher_uploads_count', 'onPress={() => openTeacher(teacher)}', "tab === 'teacherFiles'"]:
    if item not in text:
        raise SystemExit('missing ' + item)
print('teacher criteria open from follow-up screen fixed in', p)
