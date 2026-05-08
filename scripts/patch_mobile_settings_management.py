from pathlib import Path

APP_PATHS = [
    Path('mobile/App.js'),
    Path('/mnt/home-storage/home/pmsa/apps/amal-school/amal-school-api/mobile/App.js'),
    Path('/home/pmsa/apps/amal-school/amal-school-api/mobile/App.js'),
]

p = next((x for x in APP_PATHS if x.exists()), None)
if p is None:
    raise SystemExit('mobile/App.js not found')

text = p.read_text()
p.with_suffix('.js.backup-before-settings-management').write_text(text)


def replace_between(src, start_marker, end_marker, replacement):
    start = src.find(start_marker)
    if start == -1:
        raise SystemExit(f'marker not found: {start_marker}')
    end = src.find(end_marker, start)
    if end == -1:
        raise SystemExit(f'end marker not found: {end_marker}')
    return src[:start] + replacement.rstrip() + '\n\n' + src[end:]

teachers_screen = r'''
function TeachersManagementScreen({ token, onBack }) {
  const [loading, setLoading] = useState(true);
  const [teachers, setTeachers] = useState([]);
  const [formOpen, setFormOpen] = useState(false);
  const [editingTeacher, setEditingTeacher] = useState(null);
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [saving, setSaving] = useState(false);

  async function loadTeachers() {
    setLoading(true);
    try {
      const data = await requestJson('/teachers', { token });
      setTeachers(data.teachers || []);
    } catch (e) {
      Alert.alert('تعذر تحميل المعلمات', e.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadTeachers(); }, [token]);

  function openAddTeacher() {
    setEditingTeacher(null);
    setName('');
    setUsername('');
    setPassword('');
    setFormOpen(true);
  }

  function openEditTeacher(teacher) {
    setEditingTeacher(teacher);
    setName(teacher.name || '');
    setUsername(teacher.username || '');
    setPassword('');
    setFormOpen(true);
  }

  async function saveTeacher() {
    if (!name.trim()) return Alert.alert('تنبيه', 'أدخلي اسم المعلمة');
    if (!username.trim()) return Alert.alert('تنبيه', 'أدخلي اسم المستخدم');
    setSaving(true);
    try {
      const body = { name: name.trim(), username: username.trim() };
      if (password.trim()) {
        body.password = password.trim();
        body.password_confirmation = password.trim();
      }
      await requestJson(editingTeacher ? `/teachers/${editingTeacher.id}` : '/teachers', {
        method: editingTeacher ? 'PUT' : 'POST',
        token,
        body,
      });
      setFormOpen(false);
      setEditingTeacher(null);
      await loadTeachers();
    } catch (e) {
      Alert.alert('تعذر الحفظ', e.message);
    } finally {
      setSaving(false);
    }
  }

  function confirmDeleteTeacher(teacher) {
    Alert.alert('حذف المعلمة', `هل تريدين حذف ${teacher.name}؟`, [
      { text: 'إلغاء', style: 'cancel' },
      { text: 'حذف', style: 'destructive', onPress: async () => {
        try {
          await requestJson(`/teachers/${teacher.id}`, { method: 'DELETE', token });
          await loadTeachers();
        } catch (e) {
          Alert.alert('تعذر الحذف', e.message);
        }
      } },
    ]);
  }

  return (
    <ScrollView contentContainerStyle={styles.screenPad} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
      <View style={styles.adminBackHeader}>
        <TouchableOpacity onPress={openAddTeacher} style={styles.headerBtn} activeOpacity={0.75}><Ionicons name="person-add-outline" size={20} color={C.primary} /></TouchableOpacity>
        <Text style={styles.pageTitle}>إدارة المعلمات</Text>
        <TouchableOpacity onPress={onBack} style={styles.headerBtn} activeOpacity={0.75}><Ionicons name="arrow-forward-outline" size={20} color={C.primary} /></TouchableOpacity>
      </View>
      <Text style={styles.pageSubtitle}>إضافة وتعديل وحذف حسابات المعلمات باستخدام الأيقونات</Text>

      {formOpen ? <View style={[styles.listCard, { padding: 14, gap: 10 }]}> 
        <Text style={styles.actionRowTitle}>{editingTeacher ? 'تعديل معلمة' : 'إضافة معلمة'}</Text>
        <TextInput value={name} onChangeText={setName} placeholder="اسم المعلمة" placeholderTextColor={C.subtle} style={[styles.inputField, { backgroundColor: C.bg, borderRadius: 14, paddingHorizontal: 14, minHeight: 48, textAlign: 'right' }]} />
        <TextInput value={username} onChangeText={setUsername} placeholder="اسم المستخدم" placeholderTextColor={C.subtle} autoCapitalize="none" style={[styles.inputField, { backgroundColor: C.bg, borderRadius: 14, paddingHorizontal: 14, minHeight: 48, textAlign: 'right' }]} />
        <TextInput value={password} onChangeText={setPassword} placeholder={editingTeacher ? 'رقم سري جديد - اختياري' : 'الرقم السري'} placeholderTextColor={C.subtle} secureTextEntry keyboardType="number-pad" style={[styles.inputField, { backgroundColor: C.bg, borderRadius: 14, paddingHorizontal: 14, minHeight: 48, textAlign: 'right' }]} />
        <View style={{ flexDirection: 'row', gap: 10 }}>
          <TouchableOpacity onPress={() => { setFormOpen(false); setEditingTeacher(null); }} style={[styles.logoutBtn, { flex: 1, marginTop: 0, borderColor: C.border }]} activeOpacity={0.85}><Ionicons name="close-outline" size={19} color={C.muted} /><Text style={[styles.logoutText, { color: C.muted }]}>إلغاء</Text></TouchableOpacity>
          <TouchableOpacity onPress={saveTeacher} disabled={saving} style={[styles.loginBtnGrad, { flex: 1, minHeight: 48, borderRadius: 16, flexDirection: 'row', gap: 8 }]} activeOpacity={0.85}>{saving ? <ActivityIndicator color="#fff" /> : <><Ionicons name="save-outline" size={19} color="#fff" /><Text style={styles.loginBtnText}>حفظ</Text></>}</TouchableOpacity>
        </View>
      </View> : null}

      {loading ? <ActivityIndicator color={C.primary} size="large" style={{ marginTop: 30 }} /> : <View style={styles.listCard}>{teachers.length === 0 ? <View style={[styles.actionRow, { borderBottomWidth: 0 }]}><View style={styles.actionRowText}><Text style={styles.actionRowTitle}>لا توجد معلمات</Text></View></View> : teachers.map((t, i) => <View key={t.id} style={[styles.actionRow, i === teachers.length - 1 && { borderBottomWidth: 0 }]}>
        <TouchableOpacity onPress={() => confirmDeleteTeacher(t)} activeOpacity={0.75}><Ionicons name="trash-outline" size={20} color={C.red} /></TouchableOpacity>
        <TouchableOpacity onPress={() => openEditTeacher(t)} activeOpacity={0.75}><Ionicons name="create-outline" size={20} color={C.muted} /></TouchableOpacity>
        <View style={styles.actionRowText}><Text style={styles.actionRowTitle}>{t.name}</Text><Text style={styles.actionRowSub}>اسم المستخدم: {t.username || '—'} · الملفات: {t.uploads_count ?? 0}</Text></View>
        <View style={[styles.actionRowIcon, { backgroundColor: C.primaryLight }]}><Ionicons name="person-outline" size={20} color={C.primary} /></View>
      </View>)}</View>}
      <View style={{ height: 28 }} />
    </ScrollView>
  );
}
'''

criteria_and_settings = r'''
function CriteriaManagementScreen({ token, evidence, onBack, onChanged, onOpenEvidence }) {
  const [items, setItems] = useState(evidence || []);
  const [loading, setLoading] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [saving, setSaving] = useState(false);

  async function loadCriteria() {
    setLoading(true);
    try {
      const data = await requestJson('/evidence', { token });
      setItems(data.items || []);
      if (onChanged) onChanged(data.items || []);
    } catch (e) {
      Alert.alert('تعذر تحميل المعايير', e.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { setItems(evidence || []); }, [evidence]);

  function openAddCriterion() {
    setEditingItem(null);
    setTitle('');
    setDescription('');
    setFormOpen(true);
  }

  function openEditCriterion(item) {
    setEditingItem(item);
    setTitle(item.title || '');
    setDescription(item.description || '');
    setFormOpen(true);
  }

  async function saveCriterion() {
    if (!title.trim()) return Alert.alert('تنبيه', 'أدخلي اسم المعيار');
    setSaving(true);
    try {
      await requestJson(editingItem ? `/evidence/${editingItem.id}` : '/evidence', {
        method: editingItem ? 'PUT' : 'POST',
        token,
        body: { title: title.trim(), description: description.trim() },
      });
      setFormOpen(false);
      setEditingItem(null);
      await loadCriteria();
    } catch (e) {
      Alert.alert('تعذر الحفظ', e.message);
    } finally {
      setSaving(false);
    }
  }

  function confirmDeleteCriterion(item) {
    Alert.alert('حذف المعيار', `هل تريدين حذف ${item.title}؟`, [
      { text: 'إلغاء', style: 'cancel' },
      { text: 'حذف', style: 'destructive', onPress: async () => {
        try {
          await requestJson(`/evidence/${item.id}`, { method: 'DELETE', token });
          await loadCriteria();
        } catch (e) {
          Alert.alert('تعذر الحذف', e.message);
        }
      } },
    ]);
  }

  return (
    <ScrollView contentContainerStyle={styles.screenPad} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
      <View style={styles.adminBackHeader}>
        <TouchableOpacity onPress={openAddCriterion} style={styles.headerBtn} activeOpacity={0.75}><Ionicons name="add-circle-outline" size={22} color={C.primary} /></TouchableOpacity>
        <Text style={styles.pageTitle}>إدارة المعايير</Text>
        <TouchableOpacity onPress={onBack} style={styles.headerBtn} activeOpacity={0.75}><Ionicons name="arrow-forward-outline" size={20} color={C.primary} /></TouchableOpacity>
      </View>
      <Text style={styles.pageSubtitle}>إنشاء وتعديل وحذف معايير التقييم</Text>

      {formOpen ? <View style={[styles.listCard, { padding: 14, gap: 10 }]}> 
        <Text style={styles.actionRowTitle}>{editingItem ? 'تعديل معيار' : 'إضافة معيار'}</Text>
        <TextInput value={title} onChangeText={setTitle} placeholder="اسم المعيار" placeholderTextColor={C.subtle} style={[styles.inputField, { backgroundColor: C.bg, borderRadius: 14, paddingHorizontal: 14, minHeight: 48, textAlign: 'right' }]} />
        <TextInput value={description} onChangeText={setDescription} placeholder="وصف اختياري" placeholderTextColor={C.subtle} multiline style={[styles.inputField, { backgroundColor: C.bg, borderRadius: 14, paddingHorizontal: 14, minHeight: 82, textAlign: 'right', textAlignVertical: 'top', paddingTop: 12 }]} />
        <View style={{ flexDirection: 'row', gap: 10 }}>
          <TouchableOpacity onPress={() => { setFormOpen(false); setEditingItem(null); }} style={[styles.logoutBtn, { flex: 1, marginTop: 0, borderColor: C.border }]} activeOpacity={0.85}><Ionicons name="close-outline" size={19} color={C.muted} /><Text style={[styles.logoutText, { color: C.muted }]}>إلغاء</Text></TouchableOpacity>
          <TouchableOpacity onPress={saveCriterion} disabled={saving} style={[styles.loginBtnGrad, { flex: 1, minHeight: 48, borderRadius: 16, flexDirection: 'row', gap: 8 }]} activeOpacity={0.85}>{saving ? <ActivityIndicator color="#fff" /> : <><Ionicons name="save-outline" size={19} color="#fff" /><Text style={styles.loginBtnText}>حفظ</Text></>}</TouchableOpacity>
        </View>
      </View> : null}

      {loading ? <ActivityIndicator color={C.primary} size="large" style={{ marginTop: 30 }} /> : <View style={styles.listCard}>{(items || []).length === 0 ? <View style={[styles.actionRow, { borderBottomWidth: 0 }]}><View style={styles.actionRowText}><Text style={styles.actionRowTitle}>لا توجد معايير</Text></View></View> : (items || []).map((item, i) => <View key={item.id} style={[styles.actionRow, i === items.length - 1 && { borderBottomWidth: 0 }]}>
        <TouchableOpacity onPress={() => confirmDeleteCriterion(item)} activeOpacity={0.75}><Ionicons name="trash-outline" size={20} color={C.red} /></TouchableOpacity>
        <TouchableOpacity onPress={() => openEditCriterion(item)} activeOpacity={0.75}><Ionicons name="create-outline" size={20} color={C.muted} /></TouchableOpacity>
        <TouchableOpacity onPress={() => onOpenEvidence(item)} activeOpacity={0.75}><Ionicons name="eye-outline" size={20} color={C.primary} /></TouchableOpacity>
        <View style={styles.actionRowText}><Text style={styles.actionRowTitle}>{item.title}</Text><Text style={styles.actionRowSub}>الملفات: {item.uploads_count ?? 0}</Text></View>
        <View style={[styles.actionRowIcon, { backgroundColor: C.tealLight }]}><Ionicons name="checkmark-done-outline" size={20} color={C.teal} /></View>
      </View>)}</View>}
      <View style={{ height: 28 }} />
    </ScrollView>
  );
}

function SettingsScreen({ user, onLogout, onOpenTeachers, onOpenTeacherFiles, onOpenCriteria }) {
  const isPrincipal = user?.is_principal || user?.role === 'principal';
  const initials = user?.name?.charAt(0) || 'م';
  return (
    <ScrollView contentContainerStyle={styles.screenPad} showsVerticalScrollIndicator={false}>
      <LinearGradient colors={C.grad} style={styles.profileCard}>
        <View style={styles.profileAvatarRow}><View style={styles.profileAvatarWrap}><View style={styles.profileAvatarRing}><View style={styles.profileAvatarInner}><Text style={styles.profileAvatarLetter}>{initials}</Text></View></View><View style={[styles.profileRoleDot, { backgroundColor: isPrincipal ? C.gold : C.green }]} /></View><View style={styles.profileInfo}><Text style={styles.profileName}>{user?.name}</Text><View style={styles.profileRolePill}><View style={[styles.profileRolePillDot, { backgroundColor: isPrincipal ? C.gold : C.green }]} /><Text style={styles.profileRoleText}>{isPrincipal ? 'مديرة المدرسة' : 'معلمة'}</Text></View></View></View>
        <View style={styles.profileDivider} />
        <View style={styles.profileSchoolRow}><Ionicons name="business-outline" size={15} color="rgba(255,255,255,0.7)" /><Text style={styles.profileSchoolName}>{user?.school?.name || 'مدرسة'}</Text></View>
      </LinearGradient>
      {isPrincipal ? <><Text style={styles.settingsSectionLabel}>إدارة المدرسة</Text><View style={styles.listCard}><ActionRow icon="people-outline" title="إدارة المعلمات" subtitle="إضافة وتعديل وحذف حسابات المعلمات" accent={C.primary} onPress={onOpenTeachers} /><ActionRow icon="checkmark-done-circle-outline" title="إدارة المعايير" subtitle="إنشاء وتعديل وحذف معايير التقييم" accent={C.teal} onPress={onOpenCriteria} /><ActionRow icon="folder-open-outline" title="متابعة ملفات المعلمات" subtitle="استعراض ملفات كل معلمة حسب المعيار" accent={C.gold} onPress={onOpenTeacherFiles} noBorder /></View></> : <><Text style={styles.settingsSectionLabel}>حسابي</Text><View style={styles.listCard}><ActionRow icon="person-outline" title="بياناتي الشخصية" subtitle="الاسم واسم المستخدم" accent={C.primary} /><ActionRow icon="folder-outline" title="ملفاتي المرفوعة" subtitle="جميع الملفات التي رفعتِها" accent={C.teal} noBorder /></View></>}
      <Text style={styles.settingsSectionLabel}>عام</Text>
      <View style={styles.listCard}><ActionRow icon="help-circle-outline" title="الدعم والمساعدة" subtitle="تواصلي مع فريق الدعم" accent={C.muted} /><View style={styles.appVersionRow}><Text style={styles.appVersionValue}>1.0.0</Text><View style={styles.appVersionText}><Text style={styles.appVersionTitle}>إصدار التطبيق</Text><Text style={styles.appVersionSub}>Amal School App</Text></View><View style={[styles.actionRowIcon, { backgroundColor: `${C.subtle}18` }]}><Ionicons name="information-circle-outline" size={20} color={C.subtle} /></View></View></View>
      <TouchableOpacity style={styles.logoutBtn} onPress={onLogout} activeOpacity={0.85}><Ionicons name="log-out-outline" size={20} color={C.red} /><Text style={styles.logoutText}>تسجيل الخروج</Text></TouchableOpacity>
      <View style={{ height: 32 }} />
    </ScrollView>
  );
}
'''

bottom_nav = r'''
function BottomNav({ tab, setTab, isPrincipal }) {
  const tabs = [
    { id: 'home', icon: 'home', iconOff: 'home-outline', label: 'الرئيسية' },
    { id: 'evidence', icon: 'checkmark-done-circle', iconOff: 'checkmark-done-circle-outline', label: 'المعايير' },
    ...(isPrincipal ? [{ id: 'teacherFiles', icon: 'folder-open', iconOff: 'folder-open-outline', label: 'متابعة المعلمات' }, { id: 'settings', icon: 'settings', iconOff: 'settings-outline', label: 'إعدادات' }] : []),
  ];
  return <View style={styles.bottomNavWrap}><View style={styles.bottomNav}>{tabs.map((t) => { const active = tab === t.id; return <TouchableOpacity key={t.id} style={[styles.navTab, active && styles.navTabActive]} onPress={() => setTab(t.id)} activeOpacity={0.8}><Ionicons name={active ? t.icon : t.iconOff} size={22} color={active ? C.primary : C.muted} /><Text style={[styles.navLabel, active && styles.navLabelActive]}>{t.label}</Text></TouchableOpacity>; })}</View></View>;
}
'''

main_app = r'''
function MainApp({ token, user, setUser, onLogout }) {
  const [tab, setTab] = useState('home');
  const [settingsSub, setSettingsSub] = useState(null);
  const [loading, setLoading] = useState(true);
  const [dashboard, setDashboard] = useState(null);
  const [evidence, setEvidence] = useState([]);
  const [selectedEvidence, setSelectedEvidence] = useState(null);

  useEffect(() => { async function loadData() { setLoading(true); try { const [me, dash, ev] = await Promise.all([requestJson('/me', { token }), requestJson('/dashboard', { token }), requestJson('/evidence', { token })]); setUser(me.user); setDashboard(dash); setEvidence(ev.items || []); } catch (error) { Alert.alert('تعذر تحميل البيانات', error.message); } finally { setLoading(false); } } loadData(); }, [token, setUser]);

  const isPrincipal = user?.is_principal || user?.role === 'principal';
  const showDetail = !loading && !!selectedEvidence;

  function goTab(next) {
    setSettingsSub(null);
    setSelectedEvidence(null);
    setTab(next);
  }

  async function refreshEvidence(nextItems = null) {
    if (Array.isArray(nextItems)) {
      setEvidence(nextItems);
      return;
    }
    try {
      const ev = await requestJson('/evidence', { token });
      setEvidence(ev.items || []);
    } catch {}
  }

  let screen;
  if (loading) screen = <LoadingScreen />;
  else if (showDetail) screen = <EvidenceDetailScreen token={token} evidence={selectedEvidence} onBack={() => setSelectedEvidence(null)} />;
  else if (tab === 'evidence') screen = <EvidenceScreen evidence={evidence} onSelectEvidence={setSelectedEvidence} isPrincipal={isPrincipal} />;
  else if (tab === 'teacherFiles') screen = <TeacherFilesScreen token={token} onBack={() => goTab('home')} onOpenEvidence={(item) => setSelectedEvidence(item)} />;
  else if (tab === 'settings' && settingsSub === 'teachers') screen = <TeachersManagementScreen token={token} onBack={() => setSettingsSub(null)} />;
  else if (tab === 'settings' && settingsSub === 'criteria') screen = <CriteriaManagementScreen token={token} evidence={evidence} onBack={() => setSettingsSub(null)} onChanged={refreshEvidence} onOpenEvidence={(item) => setSelectedEvidence(item)} />;
  else if (tab === 'settings' && settingsSub === 'teacherFiles') screen = <TeacherFilesScreen token={token} onBack={() => setSettingsSub(null)} onOpenEvidence={(item) => setSelectedEvidence(item)} />;
  else if (tab === 'settings') screen = <SettingsScreen user={user} onLogout={onLogout} onOpenTeachers={() => setSettingsSub('teachers')} onOpenCriteria={() => setSettingsSub('criteria')} onOpenTeacherFiles={() => setSettingsSub('teacherFiles')} />;
  else screen = <HomeScreen user={user} dashboard={dashboard} setTab={goTab} />;

  return <View style={[styles.fill, { backgroundColor: C.bg }]}><StatusBar barStyle="dark-content" backgroundColor={C.surface} /><SafeAreaView style={styles.fill}>{!loading && !showDetail && <AppHeader user={user} onLogout={onLogout} />}<View style={styles.fill}>{screen}</View>{!loading && !showDetail && <BottomNav tab={tab} setTab={goTab} isPrincipal={isPrincipal} />}</SafeAreaView></View>;
}
'''

text = replace_between(text, 'function TeachersManagementScreen', 'function TeacherFilesScreen', teachers_screen)
text = replace_between(text, 'function SettingsScreen', 'function BottomNav', criteria_and_settings)
text = replace_between(text, 'function BottomNav', 'function MainApp', bottom_nav)
text = replace_between(text, 'function MainApp', 'export default function App', main_app)

required = [
    'إدارة المعلمات',
    'إدارة المعايير',
    "id: 'teacherFiles'",
    'function CriteriaManagementScreen',
    "settingsSub === 'criteria'",
]
for item in required:
    if item not in text:
        raise SystemExit('missing required patch text: ' + item)

p.write_text(text)
print('Settings management patch applied to', p)
