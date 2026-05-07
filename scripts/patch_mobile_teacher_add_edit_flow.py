from pathlib import Path
import os
import re

project = os.environ.get('PROJECT_PATH')
candidate_dirs = []
if project:
    candidate_dirs.append(Path(project) / 'mobile')
candidate_dirs += [
    Path('mobile'),
    Path('/mnt/home-storage/home/pmsa/apps/amal-school/amal-school-api/mobile'),
    Path('/home/pmsa/apps/amal-school/amal-school-api/mobile'),
]

app_paths = []
seen = set()
for base in candidate_dirs:
    for name in ('AppMobileFixed.js', 'App.js'):
        p = base / name
        key = str(p)
        if key not in seen:
            app_paths.append(p)
            seen.add(key)

existing = [p for p in app_paths if p.exists()]
if not existing:
    raise SystemExit('No mobile App.js/AppMobileFixed.js found')

TEACHERS_SCREEN = r'''
function TeachersManagementScreen({ token, onBack }) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [teachers, setTeachers] = useState([]);
  const [mode, setMode] = useState('list');
  const [addName, setAddName] = useState('');
  const [addUsername, setAddUsername] = useState('');
  const [addPassword, setAddPassword] = useState('');
  const [editing, setEditing] = useState(null);
  const [editName, setEditName] = useState('');
  const [editUsername, setEditUsername] = useState('');
  const [editPassword, setEditPassword] = useState('');

  async function load() {
    setLoading(true);
    try {
      const data = await requestJson('/teachers', { token });
      setTeachers(data.teachers || []);
    } catch (error) {
      Alert.alert('تعذر تحميل المعلمات', error.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, [token]);

  function resetAddForm() {
    setAddName('');
    setAddUsername('');
    setAddPassword('');
  }

  function openAddScreen() {
    resetAddForm();
    setMode('add');
  }

  function closeAddScreen() {
    resetAddForm();
    setMode('list');
  }

  function openEditSheet(teacher) {
    setEditing(teacher);
    setEditName(teacher.name || '');
    setEditUsername(teacher.username || '');
    setEditPassword('');
  }

  function closeEditSheet() {
    setEditing(null);
    setEditName('');
    setEditUsername('');
    setEditPassword('');
  }

  async function saveNewTeacher() {
    if (!addName.trim() || !addUsername.trim()) {
      return Alert.alert('تنبيه', 'اكتبي اسم المعلمة واسم المستخدم');
    }

    setSaving(true);
    try {
      await requestJson('/teachers', {
        method: 'POST',
        token,
        body: {
          name: addName.trim(),
          username: addUsername.trim(),
          ...(addPassword.trim() ? { password: addPassword.trim() } : {}),
        },
      });
      Alert.alert('تم', 'تمت إضافة المعلمة');
      closeAddScreen();
      await load();
    } catch (error) {
      Alert.alert('تعذر الإضافة', error.message);
    } finally {
      setSaving(false);
    }
  }

  async function saveEditedTeacher() {
    if (!editing) return;
    if (!editName.trim() || !editUsername.trim()) {
      return Alert.alert('تنبيه', 'اكتبي اسم المعلمة واسم المستخدم');
    }

    setSaving(true);
    try {
      await requestJson(`/teachers/${editing.id}`, {
        method: 'PUT',
        token,
        body: {
          name: editName.trim(),
          username: editUsername.trim(),
          ...(editPassword.trim() ? { password: editPassword.trim() } : {}),
        },
      });
      Alert.alert('تم', 'تم تعديل بيانات المعلمة');
      closeEditSheet();
      await load();
    } catch (error) {
      Alert.alert('تعذر التعديل', error.message);
    } finally {
      setSaving(false);
    }
  }

  function confirmDelete(teacher) {
    Alert.alert('حذف المعلمة', `هل تريد حذف ${teacher.name}؟`, [
      { text: 'إلغاء', style: 'cancel' },
      {
        text: 'حذف',
        style: 'destructive',
        onPress: async () => {
          try {
            await requestJson(`/teachers/${teacher.id}`, { method: 'DELETE', token });
            if (editing?.id === teacher.id) closeEditSheet();
            await load();
          } catch (error) {
            Alert.alert('تعذر الحذف', error.message);
          }
        },
      },
    ]);
  }

  if (mode === 'add') {
    return (
      <ScrollView contentContainerStyle={styles.screenPad} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        <AdminBackHeader title="إضافة معلمة" onBack={closeAddScreen} />
        <Text style={styles.pageSubtitle}>اكتبي بيانات المعلمة ثم اضغطي رمز الحفظ</Text>

        <View style={styles.managerFormCard}>
          <View style={styles.managerFormHeader}>
            <TouchableOpacity style={[styles.iconAction, styles.saveIconAction]} onPress={saveNewTeacher} disabled={saving} activeOpacity={0.8}>
              {saving ? <ActivityIndicator color="#fff" size="small" /> : <Ionicons name="save-outline" size={22} color="#fff" />}
            </TouchableOpacity>
            <View style={styles.managerFormTitleWrap}>
              <Text style={styles.managerFormTitle}>إضافة معلمة جديدة</Text>
              <Text style={styles.managerFormSub}>الرقم السري اختياري، ويكون 4 أرقام عند الإدخال</Text>
            </View>
          </View>

          <TextInput style={styles.managerInput} value={addName} onChangeText={setAddName} placeholder="اسم المعلمة" placeholderTextColor={C.subtle} textAlign="right" />
          <TextInput style={styles.managerInput} value={addUsername} onChangeText={setAddUsername} placeholder="اسم المستخدم" placeholderTextColor={C.subtle} autoCapitalize="none" textAlign="right" />
          <TextInput style={styles.managerInput} value={addPassword} onChangeText={setAddPassword} placeholder="رقم سري 4 أرقام - اختياري" placeholderTextColor={C.subtle} keyboardType="number-pad" secureTextEntry maxLength={4} textAlign="right" />
        </View>
        <View style={{ height: 28 }} />
      </ScrollView>
    );
  }

  return (
    <View style={styles.fill}>
      <ScrollView contentContainerStyle={styles.screenPad} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        <View style={styles.managementTitleRow}>
          <TouchableOpacity style={styles.addTeacherFab} onPress={openAddScreen} activeOpacity={0.85}>
            <Ionicons name="add" size={24} color="#fff" />
          </TouchableOpacity>
          <View style={styles.managementTitleText}>
            <Text style={styles.pageTitle}>إدارة المعلمات</Text>
            <Text style={styles.pageSubtitle}>إضافة أو تعديل أو حذف حسابات المعلمات</Text>
          </View>
          <TouchableOpacity onPress={onBack} style={styles.headerLogoutBtn} activeOpacity={0.75}>
            <Ionicons name="arrow-forward-outline" size={20} color={C.primary} />
          </TouchableOpacity>
        </View>

        <Text style={styles.sectionLabel}>قائمة المعلمات</Text>
        {loading ? (
          <ActivityIndicator color={C.primary} size="large" style={{ marginTop: 30 }} />
        ) : (
          <View style={styles.listCard}>
            {teachers.length === 0 ? <EmptyRow title="لا توجد معلمات" /> : teachers.map((teacher, idx) => (
              <View key={teacher.id} style={[styles.managerRow, idx === teachers.length - 1 && { borderBottomWidth: 0 }]}>
                <View style={styles.managerRowActions}>
                  <TouchableOpacity style={styles.rowIconBtn} onPress={() => openEditSheet(teacher)} activeOpacity={0.8}>
                    <Ionicons name="pencil-outline" size={20} color={C.primary} />
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.rowIconBtn} onPress={() => confirmDelete(teacher)} activeOpacity={0.8}>
                    <Ionicons name="trash-outline" size={20} color={C.red} />
                  </TouchableOpacity>
                </View>
                <View style={styles.managerRowText}>
                  <Text style={styles.managerRowTitle}>{teacher.name}</Text>
                  <Text style={styles.managerRowSub}>@{teacher.username || '—'} · الملفات: {teacher.uploads_count ?? 0}</Text>
                </View>
                <View style={[styles.actionRowIcon, { backgroundColor: C.primaryLight }]}>
                  <Ionicons name="person-outline" size={20} color={C.primary} />
                </View>
              </View>
            ))}
          </View>
        )}
        <View style={{ height: 44 }} />
      </ScrollView>

      <Modal visible={!!editing} transparent animationType="slide" onRequestClose={closeEditSheet}>
        <TouchableOpacity style={styles.sheetBackdrop} activeOpacity={1} onPress={closeEditSheet}>
          <TouchableOpacity style={styles.teacherEditSheet} activeOpacity={1}>
            <View style={styles.sheetHandle} />
            <View style={styles.sheetHeader}>
              <TouchableOpacity style={[styles.iconAction, styles.saveIconAction]} onPress={saveEditedTeacher} disabled={saving} activeOpacity={0.8}>
                {saving ? <ActivityIndicator color="#fff" size="small" /> : <Ionicons name="save-outline" size={22} color="#fff" />}
              </TouchableOpacity>
              <TouchableOpacity style={[styles.iconAction, styles.cancelIconAction]} onPress={closeEditSheet} activeOpacity={0.8}>
                <Ionicons name="close-outline" size={24} color={C.red} />
              </TouchableOpacity>
              <View style={styles.managerFormTitleWrap}>
                <Text style={styles.managerFormTitle}>تعديل المعلمة</Text>
                <Text style={styles.managerFormSub}>اتركي الرقم السري فارغًا إذا لم تريدي تغييره</Text>
              </View>
            </View>

            <TextInput style={styles.managerInput} value={editName} onChangeText={setEditName} placeholder="اسم المعلمة" placeholderTextColor={C.subtle} textAlign="right" />
            <TextInput style={styles.managerInput} value={editUsername} onChangeText={setEditUsername} placeholder="اسم المستخدم" placeholderTextColor={C.subtle} autoCapitalize="none" textAlign="right" />
            <TextInput style={styles.managerInput} value={editPassword} onChangeText={setEditPassword} placeholder="رقم سري جديد - اختياري" placeholderTextColor={C.subtle} keyboardType="number-pad" secureTextEntry maxLength={4} textAlign="right" />
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}
'''

EXTRA_STYLES = r'''
  managementTitleRow: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, marginBottom: 10 },
  managementTitleText: { flex: 1, alignItems: 'flex-end' },
  addTeacherFab: { width: 48, height: 48, borderRadius: 18, alignItems: 'center', justifyContent: 'center', backgroundColor: C.primary, ...shadow(3) },
  sheetBackdrop: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(15,23,42,0.35)' },
  teacherEditSheet: { backgroundColor: C.surface, borderTopLeftRadius: 30, borderTopRightRadius: 30, padding: 18, paddingBottom: 30, ...shadow(5) },
  sheetHandle: { alignSelf: 'center', width: 52, height: 5, borderRadius: 5, backgroundColor: '#D8DEE9', marginBottom: 14 },
  sheetHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 },
'''


def replace_function(src: str, function_name: str, replacement: str) -> str:
    start = src.find('function ' + function_name)
    if start == -1:
        raise SystemExit(function_name + ' not found')

    brace_start = src.find('{', start)
    if brace_start == -1:
        raise SystemExit('opening brace not found for ' + function_name)

    depth = 0
    i = brace_start
    in_string = None
    escaped = False
    in_line_comment = False
    in_block_comment = False
    in_template_expr_depth = 0

    while i < len(src):
        ch = src[i]
        nxt = src[i + 1] if i + 1 < len(src) else ''

        if in_line_comment:
            if ch == '\n':
                in_line_comment = False
            i += 1
            continue

        if in_block_comment:
            if ch == '*' and nxt == '/':
                in_block_comment = False
                i += 2
            else:
                i += 1
            continue

        if in_string:
            if escaped:
                escaped = False
            elif ch == '\\':
                escaped = True
            elif ch == in_string:
                in_string = None
            i += 1
            continue

        if ch == '/' and nxt == '/':
            in_line_comment = True
            i += 2
            continue
        if ch == '/' and nxt == '*':
            in_block_comment = True
            i += 2
            continue
        if ch in ('"', "'", '`'):
            in_string = ch
            i += 1
            continue
        if ch == '{':
            depth += 1
        elif ch == '}':
            depth -= 1
            if depth == 0:
                end = i + 1
                return src[:start] + replacement.strip() + src[end:]
        i += 1

    raise SystemExit('closing brace not found for ' + function_name)


def ensure_modal_import(text: str) -> str:
    if re.search(r'\bModal\b', text.split('from \'react-native\'')[0] if "from 'react-native'" in text else text[:500]):
        return text
    if "  Modal,\n" in text:
        return text
    return text.replace("  ActivityIndicator,\n", "  ActivityIndicator,\n  Modal,\n", 1)


def ensure_styles(text: str) -> str:
    if 'managementTitleRow:' in text and 'teacherEditSheet:' in text:
        return text
    idx = text.rfind('\n});')
    if idx == -1:
        raise SystemExit('StyleSheet ending not found')
    return text[:idx] + '\n' + EXTRA_STYLES + text[idx:]

patched = []
for p in existing:
    text = p.read_text()
    original = text
    text = ensure_modal_import(text)
    text = replace_function(text, 'TeachersManagementScreen', TEACHERS_SCREEN)
    text = ensure_styles(text)

    required = [
        'function TeachersManagementScreen',
        "const [mode, setMode] = useState('list')",
        'openAddScreen',
        '<AdminBackHeader title="إضافة معلمة"',
        '<Modal visible={!!editing}',
        'teacherEditSheet:',
        'addTeacherFab:',
        'title="إدارة المعلمات"',
    ]
    missing = [x for x in required if x not in text]
    if missing:
        raise SystemExit(f'Patch failed in {p}, missing: {", ".join(missing)}')

    if text != original:
        p.write_text(text)
        patched.append(str(p))

if patched:
    print('Applied teacher add screen and edit bottom sheet in: ' + ', '.join(patched))
else:
    print('Teacher add screen and edit bottom sheet already applied')
