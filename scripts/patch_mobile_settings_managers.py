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
p.with_suffix('.js.backup-before-compact-managers').write_text(text)

TEACHERS_SCREEN = r'''
function TeachersManagementScreen({ token, onBack }) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [teachers, setTeachers] = useState([]);
  const [editing, setEditing] = useState(null);
  const [formOpen, setFormOpen] = useState(false);
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

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

  function openAdd() {
    setEditing(null);
    setName('');
    setUsername('');
    setPassword('');
    setFormOpen(true);
  }

  function closeForm() {
    setEditing(null);
    setName('');
    setUsername('');
    setPassword('');
    setFormOpen(false);
  }

  function startEdit(teacher) {
    setEditing(teacher);
    setName(teacher.name || '');
    setUsername(teacher.username || '');
    setPassword('');
    setFormOpen(true);
  }

  async function saveTeacher() {
    if (!name.trim() || !username.trim()) return Alert.alert('تنبيه', 'اكتبي اسم المعلمة واسم المستخدم');
    setSaving(true);
    try {
      const body = { name: name.trim(), username: username.trim(), ...(password.trim() ? { password: password.trim() } : {}) };
      await requestJson(editing ? `/teachers/${editing.id}` : '/teachers', { method: editing ? 'PUT' : 'POST', token, body });
      closeForm();
      await load();
    } catch (error) {
      Alert.alert('تعذر الحفظ', error.message);
    } finally {
      setSaving(false);
    }
  }

  function confirmDelete(teacher) {
    Alert.alert('حذف المعلمة', `هل تريد حذف ${teacher.name}؟`, [
      { text: 'إلغاء', style: 'cancel' },
      { text: 'حذف', style: 'destructive', onPress: async () => {
        try {
          await requestJson(`/teachers/${teacher.id}`, { method: 'DELETE', token });
          if (editing?.id === teacher.id) closeForm();
          await load();
        } catch (error) {
          Alert.alert('تعذر الحذف', error.message);
        }
      } },
    ]);
  }

  return (
    <ScrollView contentContainerStyle={styles.managerScreenPad} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
      <View style={styles.managerTopBar}>
        <TouchableOpacity onPress={onBack} style={styles.managerBackBtn} activeOpacity={0.8}>
          <Ionicons name="arrow-forward-outline" size={21} color={C.primary} />
        </TouchableOpacity>
        <View style={styles.managerTitleWrap}>
          <Text style={styles.managerPageTitle}>إدارة المعلمات</Text>
          <Text style={styles.managerPageSub}>إضافة وتعديل وحذف حسابات المعلمات</Text>
        </View>
      </View>

      <TouchableOpacity style={styles.managerAddCard} onPress={openAdd} activeOpacity={0.86}>
        <View style={styles.managerAddIcon}><Ionicons name="person-add-outline" size={22} color="#fff" /></View>
        <View style={styles.managerAddTextWrap}>
          <Text style={styles.managerAddTitle}>إضافة معلمة</Text>
          <Text style={styles.managerAddSub}>فتح نموذج إضافة حساب جديد</Text>
        </View>
        <Ionicons name="chevron-back" size={17} color={C.subtle} />
      </TouchableOpacity>

      {formOpen ? (
        <View style={styles.managerFormCardCompact}>
          <View style={styles.managerFormHeaderCompact}>
            <TouchableOpacity style={[styles.managerCircleBtn, styles.managerSaveBtn]} onPress={saveTeacher} disabled={saving} activeOpacity={0.85}>
              {saving ? <ActivityIndicator color="#fff" size="small" /> : <Ionicons name="save-outline" size={21} color="#fff" />}
            </TouchableOpacity>
            <TouchableOpacity style={[styles.managerCircleBtn, styles.managerCloseBtn]} onPress={closeForm} activeOpacity={0.85}>
              <Ionicons name="close-outline" size={22} color={C.red} />
            </TouchableOpacity>
            <View style={styles.managerTitleWrap}>
              <Text style={styles.managerFormTitleCompact}>{editing ? 'تعديل بيانات المعلمة' : 'معلمة جديدة'}</Text>
              <Text style={styles.managerFormSubCompact}>الرقم السري اختياري عند التعديل</Text>
            </View>
          </View>
          <TextInput style={styles.managerInputCompact} value={name} onChangeText={setName} placeholder="اسم المعلمة" placeholderTextColor={C.subtle} textAlign="right" />
          <TextInput style={styles.managerInputCompact} value={username} onChangeText={setUsername} placeholder="اسم المستخدم" placeholderTextColor={C.subtle} autoCapitalize="none" textAlign="right" />
          <TextInput style={styles.managerInputCompact} value={password} onChangeText={setPassword} placeholder="رقم سري 4 أرقام - اختياري" placeholderTextColor={C.subtle} keyboardType="number-pad" secureTextEntry maxLength={4} textAlign="right" />
        </View>
      ) : null}

      <Text style={styles.managerSectionTitle}>قائمة المعلمات</Text>
      {loading ? <ActivityIndicator color={C.primary} size="large" style={{ marginTop: 30 }} /> : (
        <View style={styles.managerListCard}>
          {teachers.length === 0 ? <EmptyRow title="لا توجد معلمات" /> : teachers.map((teacher, idx) => (
            <View key={teacher.id} style={[styles.managerTeacherRow, idx === teachers.length - 1 && { borderBottomWidth: 0 }]}>
              <View style={styles.managerMiniActions}>
                <TouchableOpacity style={styles.managerMiniBtn} onPress={() => startEdit(teacher)} activeOpacity={0.85}>
                  <Ionicons name="pencil-outline" size={19} color={C.primary} />
                </TouchableOpacity>
                <TouchableOpacity style={styles.managerMiniBtn} onPress={() => confirmDelete(teacher)} activeOpacity={0.85}>
                  <Ionicons name="trash-outline" size={19} color={C.red} />
                </TouchableOpacity>
              </View>
              <View style={styles.managerTeacherText}>
                <Text style={styles.managerTeacherName} numberOfLines={1}>{teacher.name}</Text>
                <Text style={styles.managerTeacherMeta} numberOfLines={1}>@{teacher.username || '—'} · الملفات: {teacher.uploads_count ?? 0}</Text>
              </View>
              <View style={styles.managerAvatar}><Ionicons name="person-outline" size={22} color={C.primary} /></View>
            </View>
          ))}
        </View>
      )}
      <View style={{ height: 24 }} />
    </ScrollView>
  );
}
'''

CRITERIA_SCREEN = r'''
function CriteriaManagementScreen({ token, onBack }) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [items, setItems] = useState([]);
  const [editing, setEditing] = useState(null);
  const [formOpen, setFormOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');

  async function load() {
    setLoading(true);
    try {
      const data = await requestJson('/evidence', { token });
      setItems(data.items || []);
    } catch (error) {
      Alert.alert('تعذر تحميل المعايير', error.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, [token]);
  function openAdd() { setEditing(null); setTitle(''); setDescription(''); setFormOpen(true); }
  function closeForm() { setEditing(null); setTitle(''); setDescription(''); setFormOpen(false); }
  function startEdit(item) { setEditing(item); setTitle(item.title || ''); setDescription(item.description || ''); setFormOpen(true); }

  async function saveCriterion() {
    if (!title.trim()) return Alert.alert('تنبيه', 'اكتبي اسم المعيار');
    setSaving(true);
    try {
      await requestJson(editing ? `/evidence/${editing.id}` : '/evidence', { method: editing ? 'PUT' : 'POST', token, body: { title: title.trim(), description: description.trim() } });
      closeForm();
      await load();
    } catch (error) {
      Alert.alert('تعذر الحفظ', error.message);
    } finally {
      setSaving(false);
    }
  }

  function confirmDelete(item) {
    Alert.alert('حذف المعيار', `هل تريد حذف ${item.title}؟`, [
      { text: 'إلغاء', style: 'cancel' },
      { text: 'حذف', style: 'destructive', onPress: async () => {
        try {
          await requestJson(`/evidence/${item.id}`, { method: 'DELETE', token });
          if (editing?.id === item.id) closeForm();
          await load();
        } catch (error) {
          Alert.alert('تعذر الحذف', error.message);
        }
      } },
    ]);
  }

  return (
    <ScrollView contentContainerStyle={styles.managerScreenPad} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
      <View style={styles.managerTopBar}>
        <TouchableOpacity onPress={onBack} style={styles.managerBackBtn} activeOpacity={0.8}>
          <Ionicons name="arrow-forward-outline" size={21} color={C.primary} />
        </TouchableOpacity>
        <View style={styles.managerTitleWrap}>
          <Text style={styles.managerPageTitle}>إدارة المعايير</Text>
          <Text style={styles.managerPageSub}>إنشاء وتعديل وحذف المعايير</Text>
        </View>
      </View>
      <TouchableOpacity style={styles.managerAddCard} onPress={openAdd} activeOpacity={0.86}>
        <View style={styles.managerAddIcon}><Ionicons name="add-outline" size={25} color="#fff" /></View>
        <View style={styles.managerAddTextWrap}>
          <Text style={styles.managerAddTitle}>إضافة معيار</Text>
          <Text style={styles.managerAddSub}>فتح نموذج معيار جديد</Text>
        </View>
        <Ionicons name="chevron-back" size={17} color={C.subtle} />
      </TouchableOpacity>
      {formOpen ? (
        <View style={styles.managerFormCardCompact}>
          <View style={styles.managerFormHeaderCompact}>
            <TouchableOpacity style={[styles.managerCircleBtn, styles.managerSaveBtn]} onPress={saveCriterion} disabled={saving}>{saving ? <ActivityIndicator color="#fff" size="small" /> : <Ionicons name="save-outline" size={21} color="#fff" />}</TouchableOpacity>
            <TouchableOpacity style={[styles.managerCircleBtn, styles.managerCloseBtn]} onPress={closeForm}><Ionicons name="close-outline" size={22} color={C.red} /></TouchableOpacity>
            <View style={styles.managerTitleWrap}><Text style={styles.managerFormTitleCompact}>{editing ? 'تعديل معيار' : 'معيار جديد'}</Text><Text style={styles.managerFormSubCompact}>يمكن ترك الوصف فارغًا</Text></View>
          </View>
          <TextInput style={styles.managerInputCompact} value={title} onChangeText={setTitle} placeholder="اسم المعيار" placeholderTextColor={C.subtle} textAlign="right" />
          <TextInput style={[styles.managerInputCompact, { minHeight: 86, textAlignVertical: 'top', paddingTop: 12 }]} value={description} onChangeText={setDescription} placeholder="وصف المعيار" placeholderTextColor={C.subtle} multiline textAlign="right" />
        </View>
      ) : null}
      <Text style={styles.managerSectionTitle}>قائمة المعايير</Text>
      {loading ? <ActivityIndicator color={C.primary} size="large" style={{ marginTop: 30 }} /> : <View style={styles.managerListCard}>{items.length === 0 ? <EmptyRow title="لا توجد معايير" /> : items.map((item, idx) => <View key={item.id} style={[styles.managerTeacherRow, idx === items.length - 1 && { borderBottomWidth: 0 }]}><View style={styles.managerMiniActions}><TouchableOpacity style={styles.managerMiniBtn} onPress={() => startEdit(item)}><Ionicons name="pencil-outline" size={19} color={C.primary} /></TouchableOpacity><TouchableOpacity style={styles.managerMiniBtn} onPress={() => confirmDelete(item)}><Ionicons name="trash-outline" size={19} color={C.red} /></TouchableOpacity></View><View style={styles.managerTeacherText}><Text style={styles.managerTeacherName} numberOfLines={1}>{item.title}</Text><Text style={styles.managerTeacherMeta}>الملفات: {item.uploads_count ?? 0}</Text></View><View style={styles.managerAvatar}><Ionicons name="list-outline" size={22} color={C.teal} /></View></View>)}</View>}
      <View style={{ height: 24 }} />
    </ScrollView>
  );
}
'''

SETTINGS_SCREEN = r'''
function SettingsScreen({ user, onLogout, onOpenTeachers, onOpenCriteria }) {
  const isPrincipal = user?.is_principal || user?.role === 'principal';
  const initials = user?.name?.charAt(0) || 'م';
  return (
    <ScrollView contentContainerStyle={styles.screenPad} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
      <LinearGradient colors={C.grad} style={styles.profileCard}>
        <View style={styles.profileAvatarRow}><View style={styles.profileAvatarWrap}><View style={styles.profileAvatarInner}><Text style={styles.profileAvatarLetter}>{initials}</Text></View><View style={[styles.profileRoleDot, { backgroundColor: isPrincipal ? C.gold : C.green }]} /></View><View style={styles.profileInfo}><Text style={styles.profileName}>{user?.name}</Text><View style={styles.profileRolePill}><View style={[styles.profileRolePillDot, { backgroundColor: isPrincipal ? C.gold : C.green }]} /><Text style={styles.profileRoleText}>{isPrincipal ? 'مديرة المدرسة' : 'معلمة'}</Text></View></View></View>
        <View style={styles.profileDivider} />
        <View style={styles.profileSchoolRow}><Ionicons name="business-outline" size={15} color="rgba(255,255,255,0.7)" /><Text style={styles.profileSchoolName}>{user?.school?.name || 'مدرسة'}</Text></View>
      </LinearGradient>
      {isPrincipal ? <><Text style={styles.settingsSectionLabel}>إدارة المدرسة</Text><View style={styles.listCard}><ActionRow icon="person-add-outline" title="إضافة معلمة" subtitle="إضافة أو تعديل أو حذف المعلمات" accent={C.primary} onPress={onOpenTeachers} /><ActionRow icon="list-outline" title="إدارة المعايير" subtitle="إنشاء وتعديل وحذف المعايير" accent={C.teal} onPress={onOpenCriteria} noBorder /></View></> : <><Text style={styles.settingsSectionLabel}>حسابي</Text><View style={styles.listCard}><ActionRow icon="person-outline" title="بياناتي الشخصية" subtitle="الاسم واسم المستخدم" accent={C.primary} /><ActionRow icon="folder-outline" title="ملفاتي المرفوعة" subtitle="جميع الملفات التي رفعتِها" accent={C.teal} noBorder /></View></>}
      <Text style={styles.settingsSectionLabel}>عام</Text>
      <View style={styles.listCard}><ActionRow icon="help-circle-outline" title="الدعم والمساعدة" subtitle="تواصلي مع فريق الدعم" accent={C.muted} /><View style={styles.appVersionRow}><Text style={styles.appVersionValue}>1.0.3</Text><View style={styles.appVersionText}><Text style={styles.appVersionTitle}>إصدار التطبيق</Text><Text style={styles.appVersionSub}>Amal School App</Text></View><View style={[styles.actionRowIcon, { backgroundColor: `${C.subtle}18` }]}><Ionicons name="information-circle-outline" size={20} color={C.subtle} /></View></View></View>
      <TouchableOpacity style={styles.logoutBtn} onPress={onLogout} activeOpacity={0.85}><Ionicons name="log-out-outline" size={20} color={C.red} /><Text style={styles.logoutText}>تسجيل الخروج</Text></TouchableOpacity>
      <View style={{ height: 32 }} />
    </ScrollView>
  );
}
'''

def replace_or_insert_function(src, name, body, before='function TeacherFilesScreen'):
    pattern = rf"function {name}\(.*?\n\}}\n\n"
    if re.search(pattern, src, flags=re.S):
        return re.sub(pattern, body + "\n\n", src, flags=re.S, count=1)
    if before in src:
        return src.replace(before, body + "\n\n" + before, 1)
    return src.replace('function MainApp', body + "\n\nfunction MainApp", 1)

text = replace_or_insert_function(text, 'TeachersManagementScreen', TEACHERS_SCREEN)
text = replace_or_insert_function(text, 'CriteriaManagementScreen', CRITERIA_SCREEN)
text = re.sub(r"function SettingsScreen\(\{.*?\}\) \{.*?\n\}\n\nfunction BottomNav", SETTINGS_SCREEN + "\n\nfunction BottomNav", text, flags=re.S, count=1)

# settings state and routes
if 'const [settingsSub, setSettingsSub] = useState(null);' not in text:
    text = text.replace("const [tab, setTab] = useState('home');", "const [tab, setTab] = useState('home');\n  const [settingsSub, setSettingsSub] = useState(null);", 1)

teacher_route = "else if (tab === 'settings' && settingsSub === 'teachers') screen = <TeachersManagementScreen token={token} onBack={() => setSettingsSub(null)} />;"
criteria_route = "else if (tab === 'settings' && settingsSub === 'criteria') screen = <CriteriaManagementScreen token={token} onBack={() => setSettingsSub(null)} />;"
settings_call = "else if (tab === 'settings') screen = <SettingsScreen user={user} onLogout={onLogout} onOpenTeachers={() => setSettingsSub('teachers')} onOpenCriteria={() => setSettingsSub('criteria')} />;"
text = re.sub(r"else if \(tab === 'settings'\) screen = <SettingsScreen[^;]*;", settings_call, text, count=1)
if teacher_route not in text and settings_call in text:
    text = text.replace(settings_call, teacher_route + "\n  " + settings_call, 1)
if criteria_route not in text and settings_call in text:
    text = text.replace(settings_call, criteria_route + "\n  " + settings_call, 1)
text = text.replace("function goTab(next) { setSettingsSub(null); setTab(next); }", "function goTab(next) { setSettingsSub(null); setSelectedEvidence(null); setTab(next); }")
text = text.replace("function goTab(next) { setSelectedEvidence(null); setTab(next); }", "function goTab(next) { setSettingsSub(null); setSelectedEvidence(null); setTab(next); }")

# Remove old AdminBackHeader dependency from manager screens.
text = text.replace('<AdminBackHeader title="إضافة معلمة" onBack={onBack} />', '')
text = text.replace('<AdminBackHeader title="إدارة المعايير" onBack={onBack} />', '')

styles_block = r'''
  managerScreenPad: { padding: 16, paddingBottom: 104 },
  managerTopBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 },
  managerBackBtn: { width: 42, height: 42, borderRadius: 16, backgroundColor: '#EEF1FF', alignItems: 'center', justifyContent: 'center' },
  managerTitleWrap: { flex: 1, alignItems: 'flex-end' },
  managerPageTitle: { color: C.text, fontSize: 25, fontWeight: '900', textAlign: 'right' },
  managerPageSub: { color: C.muted, fontSize: 12.5, marginTop: 5, textAlign: 'right' },
  managerAddCard: { minHeight: 70, borderRadius: 24, backgroundColor: C.surface, borderWidth: 1, borderColor: '#EEF2F8', flexDirection: 'row-reverse', alignItems: 'center', gap: 12, paddingHorizontal: 14, marginBottom: 12, ...shadow(2) },
  managerAddIcon: { width: 46, height: 46, borderRadius: 18, backgroundColor: C.primary, alignItems: 'center', justifyContent: 'center' },
  managerAddTextWrap: { flex: 1, alignItems: 'flex-end' },
  managerAddTitle: { color: C.text, fontSize: 16, fontWeight: '900', textAlign: 'right' },
  managerAddSub: { color: C.muted, fontSize: 12, marginTop: 3, textAlign: 'right' },
  managerFormCardCompact: { backgroundColor: C.surface, borderRadius: 24, padding: 14, borderWidth: 1, borderColor: '#EEF2F8', marginBottom: 14, ...shadow(2) },
  managerFormHeaderCompact: { flexDirection: 'row', alignItems: 'center', gap: 9, marginBottom: 10 },
  managerCircleBtn: { width: 42, height: 42, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  managerSaveBtn: { backgroundColor: C.green },
  managerCloseBtn: { backgroundColor: '#FFF1F2', borderWidth: 1, borderColor: '#FFE4E6' },
  managerFormTitleCompact: { color: C.text, fontSize: 16, fontWeight: '900', textAlign: 'right' },
  managerFormSubCompact: { color: C.muted, fontSize: 11.5, marginTop: 3, textAlign: 'right' },
  managerInputCompact: { minHeight: 48, borderRadius: 16, borderWidth: 1, borderColor: C.border, backgroundColor: '#F8FAFC', color: C.text, paddingHorizontal: 12, fontSize: 14.5, marginTop: 8 },
  managerSectionTitle: { color: C.text, fontSize: 18, fontWeight: '900', textAlign: 'right', marginTop: 4, marginBottom: 10 },
  managerListCard: { backgroundColor: C.surface, borderRadius: 24, borderWidth: 1, borderColor: '#EEF2F8', paddingHorizontal: 10, overflow: 'hidden', ...shadow(2) },
  managerTeacherRow: { minHeight: 72, flexDirection: 'row', alignItems: 'center', gap: 10, borderBottomWidth: 1, borderBottomColor: '#F1F5F9', paddingVertical: 10 },
  managerMiniActions: { flexDirection: 'row', gap: 7 },
  managerMiniBtn: { width: 38, height: 38, borderRadius: 15, backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: '#EEF2F8', alignItems: 'center', justifyContent: 'center' },
  managerTeacherText: { flex: 1, alignItems: 'flex-end' },
  managerTeacherName: { color: C.text, fontSize: 15.5, fontWeight: '900', textAlign: 'right' },
  managerTeacherMeta: { color: C.muted, fontSize: 12, marginTop: 4, textAlign: 'right' },
  managerAvatar: { width: 44, height: 44, borderRadius: 17, backgroundColor: C.primaryLight, alignItems: 'center', justifyContent: 'center' },
'''
for style_name in ['managerScreenPad', 'managerTopBar', 'managerTeacherRow']:
    text = re.sub(rf"\n\s*{style_name}: \{{.*?\}},", "", text, flags=re.S)
if 'managerScreenPad:' not in text:
    idx = text.rfind('\n});')
    if idx == -1:
        raise SystemExit('StyleSheet ending not found')
    text = text[:idx] + '\n' + styles_block + text[idx:]

p.write_text(text)
required = ['function TeachersManagementScreen', 'function CriteriaManagementScreen', 'إدارة المعلمات', 'إضافة معلمة', 'إدارة المعايير', 'managerTeacherRow', "settingsSub === 'teachers'", "settingsSub === 'criteria'"]
missing = [x for x in required if x not in text]
if missing:
    raise SystemExit('compact redesign failed, missing: ' + ', '.join(missing))
print('compact mobile managers redesign applied to', p)
