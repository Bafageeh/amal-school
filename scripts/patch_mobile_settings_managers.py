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
p.with_suffix('.js.backup-before-settings-managers').write_text(text)

teacher_screen = r'''
function TeachersManagementScreen({ token, onBack }) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [teachers, setTeachers] = useState([]);
  const [editing, setEditing] = useState(null);
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
  function resetForm() { setEditing(null); setName(''); setUsername(''); setPassword(''); }
  function startEdit(teacher) { setEditing(teacher); setName(teacher.name || ''); setUsername(teacher.username || ''); setPassword(''); }

  async function saveTeacher() {
    if (!name.trim() || !username.trim()) return Alert.alert('تنبيه', 'اكتبي اسم المعلمة واسم المستخدم');
    setSaving(true);
    try {
      const body = { name: name.trim(), username: username.trim(), ...(password.trim() ? { password: password.trim() } : {}) };
      await requestJson(editing ? `/teachers/${editing.id}` : '/teachers', { method: editing ? 'PUT' : 'POST', token, body });
      Alert.alert('تم', editing ? 'تم تعديل بيانات المعلمة' : 'تمت إضافة المعلمة');
      resetForm();
      await load();
    } catch (error) { Alert.alert('تعذر الحفظ', error.message); }
    finally { setSaving(false); }
  }

  function confirmDelete(teacher) {
    Alert.alert('حذف المعلمة', `هل تريد حذف ${teacher.name}؟`, [
      { text: 'إلغاء', style: 'cancel' },
      { text: 'حذف', style: 'destructive', onPress: async () => {
        try { await requestJson(`/teachers/${teacher.id}`, { method: 'DELETE', token }); if (editing?.id === teacher.id) resetForm(); await load(); }
        catch (error) { Alert.alert('تعذر الحذف', error.message); }
      } },
    ]);
  }

  return (
    <ScrollView contentContainerStyle={styles.screenPad} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
      <AdminBackHeader title="إضافة معلمة" onBack={onBack} />
      <Text style={styles.pageSubtitle}>إضافة أو تعديل أو حذف حسابات المعلمات</Text>
      <View style={styles.managerFormCard}>
        <View style={styles.managerFormHeader}>
          <TouchableOpacity style={[styles.iconAction, styles.saveIconAction]} onPress={saveTeacher} disabled={saving} activeOpacity={0.8}>{saving ? <ActivityIndicator color="#fff" size="small" /> : <Ionicons name="save-outline" size={22} color="#fff" />}</TouchableOpacity>
          {editing ? <TouchableOpacity style={[styles.iconAction, styles.cancelIconAction]} onPress={resetForm} activeOpacity={0.8}><Ionicons name="close-outline" size={24} color={C.red} /></TouchableOpacity> : null}
          <View style={styles.managerFormTitleWrap}><Text style={styles.managerFormTitle}>{editing ? 'تعديل معلمة' : 'إضافة معلمة جديدة'}</Text><Text style={styles.managerFormSub}>الرقم السري اختياري، ويكون 4 أرقام عند الإدخال</Text></View>
        </View>
        <TextInput style={styles.managerInput} value={name} onChangeText={setName} placeholder="اسم المعلمة" placeholderTextColor={C.subtle} textAlign="right" />
        <TextInput style={styles.managerInput} value={username} onChangeText={setUsername} placeholder="اسم المستخدم" placeholderTextColor={C.subtle} autoCapitalize="none" textAlign="right" />
        <TextInput style={styles.managerInput} value={password} onChangeText={setPassword} placeholder={editing ? 'رقم سري جديد - اختياري' : 'رقم سري 4 أرقام - اختياري'} placeholderTextColor={C.subtle} keyboardType="number-pad" secureTextEntry maxLength={4} textAlign="right" />
      </View>
      <Text style={styles.sectionLabel}>قائمة المعلمات</Text>
      {loading ? <ActivityIndicator color={C.primary} size="large" style={{ marginTop: 30 }} /> : <View style={styles.listCard}>{teachers.length === 0 ? <EmptyRow title="لا توجد معلمات" /> : teachers.map((teacher, idx) => <View key={teacher.id} style={[styles.managerRow, idx === teachers.length - 1 && { borderBottomWidth: 0 }]}><View style={styles.managerRowActions}><TouchableOpacity style={styles.rowIconBtn} onPress={() => startEdit(teacher)} activeOpacity={0.8}><Ionicons name="pencil-outline" size={20} color={C.primary} /></TouchableOpacity><TouchableOpacity style={styles.rowIconBtn} onPress={() => confirmDelete(teacher)} activeOpacity={0.8}><Ionicons name="trash-outline" size={20} color={C.red} /></TouchableOpacity></View><View style={styles.managerRowText}><Text style={styles.managerRowTitle}>{teacher.name}</Text><Text style={styles.managerRowSub}>@{teacher.username || '—'} · الملفات: {teacher.uploads_count ?? 0}</Text></View><View style={[styles.actionRowIcon, { backgroundColor: C.primaryLight }]}><Ionicons name="person-outline" size={20} color={C.primary} /></View></View>)}</View>}
      <View style={{ height: 28 }} />
    </ScrollView>
  );
}
'''

criteria_screen = r'''
function CriteriaManagementScreen({ token, onBack }) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [items, setItems] = useState([]);
  const [editing, setEditing] = useState(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  async function load() { setLoading(true); try { const data = await requestJson('/evidence', { token }); setItems(data.items || []); } catch (error) { Alert.alert('تعذر تحميل المعايير', error.message); } finally { setLoading(false); } }
  useEffect(() => { load(); }, [token]);
  function resetForm() { setEditing(null); setTitle(''); setDescription(''); }
  function startEdit(item) { setEditing(item); setTitle(item.title || ''); setDescription(item.description || ''); }
  async function saveCriterion() { if (!title.trim()) return Alert.alert('تنبيه', 'اكتبي اسم المعيار'); setSaving(true); try { await requestJson(editing ? `/evidence/${editing.id}` : '/evidence', { method: editing ? 'PUT' : 'POST', token, body: { title: title.trim(), description: description.trim() } }); Alert.alert('تم', editing ? 'تم تعديل المعيار' : 'تمت إضافة المعيار'); resetForm(); await load(); } catch (error) { Alert.alert('تعذر الحفظ', error.message); } finally { setSaving(false); } }
  function confirmDelete(item) { Alert.alert('حذف المعيار', `هل تريد حذف ${item.title}؟ سيتم حذف الملفات المرتبطة به.`, [{ text: 'إلغاء', style: 'cancel' }, { text: 'حذف', style: 'destructive', onPress: async () => { try { await requestJson(`/evidence/${item.id}`, { method: 'DELETE', token }); if (editing?.id === item.id) resetForm(); await load(); } catch (error) { Alert.alert('تعذر الحذف', error.message); } } }]); }
  return <ScrollView contentContainerStyle={styles.screenPad} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled"><AdminBackHeader title="إدارة المعايير" onBack={onBack} /><Text style={styles.pageSubtitle}>إنشاء وتعديل وحذف المعايير</Text><View style={styles.managerFormCard}><View style={styles.managerFormHeader}><TouchableOpacity style={[styles.iconAction, styles.saveIconAction]} onPress={saveCriterion} disabled={saving}>{saving ? <ActivityIndicator color="#fff" size="small" /> : <Ionicons name="save-outline" size={22} color="#fff" />}</TouchableOpacity>{editing ? <TouchableOpacity style={[styles.iconAction, styles.cancelIconAction]} onPress={resetForm}><Ionicons name="close-outline" size={24} color={C.red} /></TouchableOpacity> : null}<View style={styles.managerFormTitleWrap}><Text style={styles.managerFormTitle}>{editing ? 'تعديل معيار' : 'إضافة معيار جديد'}</Text><Text style={styles.managerFormSub}>يمكن ترك الوصف فارغًا</Text></View></View><TextInput style={styles.managerInput} value={title} onChangeText={setTitle} placeholder="اسم المعيار" placeholderTextColor={C.subtle} textAlign="right" /><TextInput style={[styles.managerInput, styles.managerTextarea]} value={description} onChangeText={setDescription} placeholder="وصف المعيار" placeholderTextColor={C.subtle} multiline textAlign="right" /></View><Text style={styles.sectionLabel}>قائمة المعايير</Text>{loading ? <ActivityIndicator color={C.primary} size="large" style={{ marginTop: 30 }} /> : <View style={styles.listCard}>{items.length === 0 ? <EmptyRow title="لا توجد معايير" /> : items.map((item, idx) => <View key={item.id} style={[styles.managerRow, idx === items.length - 1 && { borderBottomWidth: 0 }]}><View style={styles.managerRowActions}><TouchableOpacity style={styles.rowIconBtn} onPress={() => startEdit(item)}><Ionicons name="pencil-outline" size={20} color={C.primary} /></TouchableOpacity><TouchableOpacity style={styles.rowIconBtn} onPress={() => confirmDelete(item)}><Ionicons name="trash-outline" size={20} color={C.red} /></TouchableOpacity></View><View style={styles.managerRowText}><Text style={styles.managerRowTitle}>{item.title}</Text><Text style={styles.managerRowSub}>الملفات: {item.uploads_count ?? 0}</Text></View><View style={[styles.actionRowIcon, { backgroundColor: C.tealLight }]}><Ionicons name="list-outline" size={20} color={C.teal} /></View></View>)}</View>}<View style={{ height: 28 }} /></ScrollView>;
}
'''

settings_screen = r'''
function SettingsScreen({ user, onLogout, onOpenTeachers, onOpenCriteria }) {
  const isPrincipal = user?.is_principal || user?.role === 'principal';
  const initials = user?.name?.charAt(0) || 'م';
  return <ScrollView contentContainerStyle={styles.screenPad} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled"><LinearGradient colors={C.grad} style={styles.profileCard}><View style={styles.profileAvatarRow}><View style={styles.profileAvatarWrap}><View style={styles.profileAvatarInner}><Text style={styles.profileAvatarLetter}>{initials}</Text></View><View style={[styles.profileRoleDot, { backgroundColor: isPrincipal ? C.gold : C.green }]} /></View><View style={styles.profileInfo}><Text style={styles.profileName}>{user?.name}</Text><View style={styles.profileRolePill}><View style={[styles.profileRolePillDot, { backgroundColor: isPrincipal ? C.gold : C.green }]} /><Text style={styles.profileRoleText}>{isPrincipal ? 'مديرة المدرسة' : 'معلمة'}</Text></View></View></View><View style={styles.profileDivider} /><View style={styles.profileSchoolRow}><Ionicons name="business-outline" size={15} color="rgba(255,255,255,0.7)" /><Text style={styles.profileSchoolName}>{user?.school?.name || 'مدرسة'}</Text></View></LinearGradient>{isPrincipal ? <><Text style={styles.settingsSectionLabel}>إدارة المدرسة</Text><View style={styles.listCard}><ActionRow icon="person-add-outline" title="إضافة معلمة" subtitle="إضافة أو تعديل أو حذف المعلمات" accent={C.primary} onPress={onOpenTeachers} /><ActionRow icon="list-outline" title="إدارة المعايير" subtitle="إنشاء وتعديل وحذف المعايير" accent={C.teal} onPress={onOpenCriteria} noBorder /></View></> : <><Text style={styles.settingsSectionLabel}>حسابي</Text><View style={styles.listCard}><ActionRow icon="person-outline" title="بياناتي الشخصية" subtitle="الاسم واسم المستخدم" accent={C.primary} /><ActionRow icon="folder-outline" title="ملفاتي المرفوعة" subtitle="جميع الملفات التي رفعتِها" accent={C.teal} noBorder /></View></>}<Text style={styles.settingsSectionLabel}>عام</Text><View style={styles.listCard}><ActionRow icon="help-circle-outline" title="الدعم والمساعدة" subtitle="تواصلي مع فريق الدعم" accent={C.muted} /><View style={styles.appVersionRow}><Text style={styles.appVersionValue}>1.0.2</Text><View style={styles.appVersionText}><Text style={styles.appVersionTitle}>إصدار التطبيق</Text><Text style={styles.appVersionSub}>Amal School App</Text></View><View style={[styles.actionRowIcon, { backgroundColor: `${C.subtle}18` }]}><Ionicons name="information-circle-outline" size={20} color={C.subtle} /></View></View></View><TouchableOpacity style={styles.logoutBtn} onPress={onLogout} activeOpacity={0.85}><Ionicons name="log-out-outline" size={20} color={C.red} /><Text style={styles.logoutText}>تسجيل الخروج</Text></TouchableOpacity><View style={{ height: 32 }} /></ScrollView>;
}
'''

text = re.sub(r"function TeachersManagementScreen\(\{ token, onBack \}\) \{.*?\n\}\n\nfunction TeacherFilesScreen", teacher_screen + "\n\nfunction TeacherFilesScreen", text, flags=re.S, count=1)
if 'function CriteriaManagementScreen' not in text:
    text = text.replace('function SettingsScreen', criteria_screen + '\n\nfunction SettingsScreen', 1)
text = re.sub(r"function SettingsScreen\(\{.*?\}\) \{.*?\n\}\n\nfunction BottomNav", settings_screen + "\n\nfunction BottomNav", text, flags=re.S, count=1)
if "settingsSub === 'criteria'" not in text:
    text = text.replace("else if (tab === 'settings' && settingsSub === 'teachers') screen = <TeachersManagementScreen token={token} onBack={() => setSettingsSub(null)} />;", "else if (tab === 'settings' && settingsSub === 'teachers') screen = <TeachersManagementScreen token={token} onBack={() => setSettingsSub(null)} />;\n  else if (tab === 'settings' && settingsSub === 'criteria') screen = <CriteriaManagementScreen token={token} onBack={() => setSettingsSub(null)} />;", 1)
text = re.sub(r"else if \(tab === 'settings'\) screen = <SettingsScreen user=\{user\} onLogout=\{onLogout\}.*?/>;", "else if (tab === 'settings') screen = <SettingsScreen user={user} onLogout={onLogout} onOpenTeachers={() => setSettingsSub('teachers')} onOpenCriteria={() => setSettingsSub('criteria')} />;", text, count=1)

extra_styles = r'''
  managerFormCard: { backgroundColor: C.surface, borderRadius: 26, padding: 16, borderWidth: 1, borderColor: '#EEF2F8', ...shadow(2), marginBottom: 16 },
  managerFormHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 },
  managerFormTitleWrap: { flex: 1, alignItems: 'flex-end' },
  managerFormTitle: { color: C.text, fontSize: 17, fontWeight: '900', textAlign: 'right' },
  managerFormSub: { color: C.muted, fontSize: 12, marginTop: 4, textAlign: 'right' },
  managerInput: { minHeight: 52, borderRadius: 18, borderWidth: 1, borderColor: C.border, backgroundColor: '#F8FAFC', paddingHorizontal: 14, color: C.text, fontSize: 15, marginTop: 10 },
  managerTextarea: { minHeight: 92, paddingTop: 14, textAlignVertical: 'top' },
  iconAction: { width: 46, height: 46, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  saveIconAction: { backgroundColor: C.green },
  cancelIconAction: { backgroundColor: '#FFF1F2', borderWidth: 1, borderColor: '#FFE4E6' },
  managerRow: { minHeight: 78, flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  managerRowActions: { flexDirection: 'row', gap: 8 },
  rowIconBtn: { width: 40, height: 40, borderRadius: 15, backgroundColor: '#F8FAFC', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#EEF2F8' },
  managerRowText: { flex: 1, alignItems: 'flex-end' },
  managerRowTitle: { color: C.text, fontSize: 15.5, fontWeight: '900', textAlign: 'right' },
  managerRowSub: { color: C.muted, fontSize: 12, marginTop: 4, textAlign: 'right' },
'''
if 'managerFormCard' not in text:
    idx = text.rfind('\n});')
    if idx == -1:
        raise SystemExit('StyleSheet ending not found')
    text = text[:idx] + '\n' + extra_styles + text[idx:]

p.write_text(text)
required = ['إضافة معلمة', 'إدارة المعايير', 'function CriteriaManagementScreen', 'person-add-outline', 'trash-outline', 'pencil-outline', 'save-outline', "settingsSub === 'criteria'"]
missing = [x for x in required if x not in text]
if missing:
    raise SystemExit('Patch failed, missing: ' + ', '.join(missing))
print('mobile settings managers patch applied to', p)
