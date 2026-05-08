import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Platform,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as SecureStore from 'expo-secure-store';
import EvidenceDetailScreen from './src/EvidenceDetailScreen';

const API_BASE_URL = 'https://amal.pm.sa/mobile-api/v1';
const TOKEN_KEY = 'amal_mobile_token';

const C = {
  bg: '#F4F7FF',
  surface: '#FFFFFF',
  text: '#0F172A',
  muted: '#64748B',
  subtle: '#94A3B8',
  border: '#E2E8F0',
  primary: '#4361EE',
  primaryDark: '#2D46C9',
  primaryLight: '#EEF1FF',
  teal: '#0EA5E9',
  tealLight: '#E0F2FE',
  green: '#10B981',
  greenLight: '#D1FAE5',
  gold: '#F59E0B',
  goldLight: '#FEF3C7',
  red: '#EF4444',
  redLight: '#FEE2E2',
  grad: ['#4361EE', '#2D46C9', '#1A1060'],
};

const shadow = (depth = 2) => Platform.select({
  ios: {
    shadowColor: '#1A1060',
    shadowOffset: { width: 0, height: depth },
    shadowOpacity: 0.08,
    shadowRadius: depth * 4,
  },
  android: { elevation: depth + 1 },
  default: {},
});

async function requestJson(path, { method = 'GET', token = null, body = null } = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method,
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : null,
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const firstError = data.errors ? Object.values(data.errors).flat()[0] : null;
    throw new Error(firstError || data.message || `HTTP ${response.status}`);
  }
  return data;
}

function LoadingScreen({ label = 'جاري التحميل...' }) {
  return (
    <LinearGradient colors={C.grad} style={[styles.fill, styles.center]}>
      <StatusBar barStyle="light-content" />
      <View style={styles.loadingLogo}><Text style={styles.loadingLogoText}>أ</Text></View>
      <ActivityIndicator color="#fff" size="large" style={{ marginTop: 24 }} />
      <Text style={styles.loadingText}>{label}</Text>
    </LinearGradient>
  );
}

function InputRow({ icon, focused, inputStyle, ...props }) {
  return (
    <View style={[styles.inputRow, focused && styles.inputRowFocused]}>
      <TextInput
        {...props}
        style={[styles.inputField, inputStyle]}
        placeholderTextColor={C.subtle}
        autoCapitalize="none"
        textAlign="right"
      />
      <View style={styles.inputIconWrap}>
        <Ionicons name={icon} size={20} color={focused ? C.primary : C.muted} />
      </View>
    </View>
  );
}

function PrimaryButton({ title, icon, loading, onPress, disabled, style }) {
  return (
    <TouchableOpacity onPress={onPress} disabled={disabled || loading} activeOpacity={0.88} style={style}>
      <LinearGradient colors={[C.primary, C.primaryDark]} style={styles.primaryButton}>
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <>
            {icon ? <Ionicons name={icon} size={19} color="#fff" /> : null}
            <Text style={styles.primaryButtonText}>{title}</Text>
          </>
        )}
      </LinearGradient>
    </TouchableOpacity>
  );
}

function LoginScreen({ onLoggedIn }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [focusedField, setFocusedField] = useState(null);

  async function login() {
    if (!username.trim()) return Alert.alert('تنبيه', 'فضلاً أدخلي اسم المستخدم');
    setLoading(true);
    try {
      const data = await requestJson('/login', {
        method: 'POST',
        body: { username: username.trim(), password },
      });
      await SecureStore.setItemAsync(TOKEN_KEY, data.token);
      onLoggedIn(data.token, data.user, data.requires_password_setup);
    } catch (error) {
      Alert.alert('تعذر تسجيل الدخول', error.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={styles.fill}>
      <StatusBar barStyle="light-content" />
      <LinearGradient colors={C.grad} style={styles.loginTop}>
        <SafeAreaView style={styles.loginTopInner}>
          <View style={styles.loginLogo}><Text style={styles.loginLogoText}>أ</Text></View>
          <Text style={styles.loginAppName}>أمل</Text>
          <Text style={styles.loginTagline}>منصة معايير التقييم وملفات المعلمات</Text>
        </SafeAreaView>
      </LinearGradient>
      <ScrollView style={styles.loginSheet} contentContainerStyle={styles.loginSheetContent} keyboardShouldPersistTaps="handled">
        <Text style={styles.loginWelcome}>مرحباً بكِ</Text>
        <Text style={styles.loginSub}>سجّلي دخولك للمتابعة</Text>
        <InputRow
          value={username}
          onChangeText={setUsername}
          placeholder="اسم المستخدم"
          icon="person-outline"
          focused={focusedField === 'username'}
          onFocus={() => setFocusedField('username')}
          onBlur={() => setFocusedField(null)}
        />
        <InputRow
          value={password}
          onChangeText={setPassword}
          placeholder="الرقم السري"
          icon="lock-closed-outline"
          secureTextEntry
          keyboardType="number-pad"
          focused={focusedField === 'password'}
          onFocus={() => setFocusedField('password')}
          onBlur={() => setFocusedField(null)}
        />
        <PrimaryButton title="دخول" loading={loading} onPress={login} />
      </ScrollView>
    </View>
  );
}

function SetupPasswordScreen({ token, user, onDone }) {
  const [name, setName] = useState(user?.name || '');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);

  async function submit() {
    setLoading(true);
    try {
      const data = await requestJson('/setup-password', {
        method: 'POST',
        token,
        body: { name, password, password_confirmation: confirm },
      });
      onDone(data.user);
    } catch (error) {
      Alert.alert('تعذر الاعتماد', error.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={styles.fill}>
      <StatusBar barStyle="light-content" />
      <LinearGradient colors={C.grad} style={styles.loginTop}>
        <SafeAreaView style={styles.loginTopInner}>
          <View style={styles.loginLogo}><Ionicons name="shield-checkmark-outline" size={40} color="#fff" /></View>
          <Text style={styles.loginAppName}>اعتماد الحساب</Text>
          <Text style={styles.loginTagline}>أدخلي اسمك والرقم السري الجديد</Text>
        </SafeAreaView>
      </LinearGradient>
      <ScrollView style={styles.loginSheet} contentContainerStyle={styles.loginSheetContent} keyboardShouldPersistTaps="handled">
        <Text style={styles.loginWelcome}>إعداد الحساب</Text>
        <Text style={styles.loginSub}>هذه خطوة واحدة فقط</Text>
        <InputRow value={name} onChangeText={setName} placeholder="الاسم الكامل" icon="person-outline" />
        <InputRow value={password} onChangeText={setPassword} placeholder="رقم سري من 4 خانات" icon="lock-closed-outline" secureTextEntry keyboardType="number-pad" maxLength={4} />
        <InputRow value={confirm} onChangeText={setConfirm} placeholder="تأكيد الرقم السري" icon="lock-open-outline" secureTextEntry keyboardType="number-pad" maxLength={4} />
        <PrimaryButton title="حفظ واعتماد" loading={loading} onPress={submit} />
      </ScrollView>
    </View>
  );
}

function AppHeader({ user, onLogout }) {
  const initials = user?.name?.charAt(0) || 'م';
  const isPrincipal = user?.role === 'principal' || user?.is_principal;
  return (
    <View style={styles.header}>
      <TouchableOpacity onPress={onLogout} style={styles.headerBtn} activeOpacity={0.75}>
        <Ionicons name="log-out-outline" size={20} color={C.muted} />
      </TouchableOpacity>
      <View style={styles.headerCenter}>
        <Text style={styles.headerSchool} numberOfLines={1}>{user?.school?.name || 'مدرسة'}</Text>
        <Text style={styles.headerName} numberOfLines={1}>{user?.name}</Text>
      </View>
      <View style={styles.headerAvatarWrap}>
        <LinearGradient colors={[C.primary, C.primaryDark]} style={styles.headerAvatar}>
          <Text style={styles.headerAvatarText}>{initials}</Text>
        </LinearGradient>
        <View style={[styles.headerRoleDot, { backgroundColor: isPrincipal ? C.gold : C.green }]} />
      </View>
    </View>
  );
}

function StatCard({ label, value, icon, bg, color }) {
  return (
    <View style={styles.statCard}>
      <View style={[styles.statIconBg, { backgroundColor: bg }]}> 
        <Ionicons name={icon} size={20} color={color} />
      </View>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function ActionRow({ icon, title, subtitle, accent = C.primary, onPress, noBorder }) {
  return (
    <TouchableOpacity
      style={[styles.actionRow, noBorder && { borderBottomWidth: 0 }]}
      onPress={onPress}
      disabled={!onPress}
      activeOpacity={0.78}
    >
      <Ionicons name="chevron-back" size={16} color={onPress ? C.border : 'transparent'} />
      <View style={styles.actionRowText} pointerEvents="none">
        <Text style={[styles.actionRowTitle, { writingDirection: 'rtl' }]}>{title}</Text>
        {subtitle ? <Text style={[styles.actionRowSub, { writingDirection: 'rtl' }]}>{subtitle}</Text> : null}
      </View>
      <View pointerEvents="none" style={[styles.actionRowIcon, { backgroundColor: `${accent}18` }]}> 
        <Ionicons name={icon} size={20} color={accent} />
      </View>
    </TouchableOpacity>
  );
}

function HomeScreen({ user, dashboard, setTab }) {
  const stats = dashboard?.stats || {};
  const isPrincipal = user?.is_principal || user?.role === 'principal';
  const latestUploads = (dashboard?.latest_uploads || []).slice(0, 4);

  return (
    <ScrollView contentContainerStyle={styles.screenPad} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
      <LinearGradient colors={C.grad} style={styles.heroCard}>
        <View style={styles.heroPill}>
          <View style={styles.heroPillDot} />
          <Text style={styles.heroPillText}>{isPrincipal ? 'مديرة المدرسة' : 'معلمة'}</Text>
        </View>
        <Text style={styles.heroGreeting}>مرحباً</Text>
        <Text style={styles.heroName}>{user?.name}</Text>
        <Text style={styles.heroDesc}>{isPrincipal ? 'متابعة المعايير وملفات المعلمات بسرعة' : 'رفع ومتابعة ملفات معايير التقييم الخاصة بك'}</Text>
      </LinearGradient>

      <View style={styles.statsRow}>
        {isPrincipal ? <StatCard label="المعلمات" value={String(stats.teachers_count ?? 0)} icon="people" bg={C.primaryLight} color={C.primary} /> : null}
        <StatCard label="المعايير" value={String(stats.evidence_count ?? 0)} icon="checkmark-circle" bg={C.tealLight} color={C.teal} />
        <StatCard label="الملفات" value={String(stats.uploads_count ?? 0)} icon="folder" bg={C.greenLight} color={C.green} />
      </View>

      <Text style={styles.sectionLabel}>اختصارات سريعة</Text>
      <View style={styles.listCard}>
        <ActionRow icon="list-outline" title="حسب المعايير" subtitle={isPrincipal ? 'عرض الملفات مرتبة حسب كل معيار' : 'عرض ورفع الملفات'} accent={C.teal} onPress={() => setTab('evidence')} />
        {isPrincipal ? <ActionRow icon="folder-open-outline" title="متابعة المعلمات" subtitle="اختيار معلمة ثم معيار لعرض ملفاتها" accent={C.gold} onPress={() => setTab('teacherFiles')} /> : null}
        <ActionRow icon="settings-outline" title="الإعدادات" subtitle="خيارات الحساب وإدارة المدرسة" accent={C.primary} onPress={() => setTab('settings')} noBorder />
      </View>

      {latestUploads.length > 0 ? (
        <>
          <Text style={styles.sectionLabel}>آخر الملفات المرفوعة</Text>
          <View style={styles.listCard}>
            {latestUploads.map((upload, idx) => (
              <View key={upload.id || idx} style={[styles.uploadRow, idx === latestUploads.length - 1 && { borderBottomWidth: 0 }]}> 
                <Text style={styles.uploadRowDate}>{upload.created_at}</Text>
                <View style={styles.uploadRowText}>
                  <Text style={styles.uploadRowTitle} numberOfLines={1}>{upload.title}</Text>
                  <Text style={styles.uploadRowSub} numberOfLines={1}>{upload.evidence?.title || '—'}</Text>
                </View>
                <View style={styles.uploadRowIcon}><Ionicons name="document-attach-outline" size={17} color={C.green} /></View>
              </View>
            ))}
          </View>
        </>
      ) : null}
      <View style={{ height: 24 }} />
    </ScrollView>
  );
}

function EvidenceScreen({ evidence, onSelectEvidence, isPrincipal }) {
  return (
    <ScrollView contentContainerStyle={styles.screenPad} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
      <Text style={styles.pageTitle}>حسب المعايير</Text>
      <Text style={styles.pageSubtitle}>{isPrincipal ? 'اختاري معياراً لعرض الملفات المرفوعة' : 'اختاري معياراً لعرض ملفاته أو رفع ملفات جديدة'}</Text>
      {(evidence || []).map((item) => (
        <TouchableOpacity key={item.id} style={styles.evidenceCard} activeOpacity={0.82} onPress={() => onSelectEvidence(item)}>
          <View style={styles.evidenceCardTop}>
            <View style={styles.evidenceBadge}>
              <Ionicons name="folder-outline" size={13} color={C.primary} />
              <Text style={styles.evidenceBadgeText}>{item.uploads_count ?? 0} ملف</Text>
            </View>
            <View style={styles.evidenceIconWrap}>
              <LinearGradient colors={[C.primary, C.primaryDark]} style={styles.evidenceIcon}>
                <Ionicons name="checkmark-done-outline" size={18} color="#fff" />
              </LinearGradient>
            </View>
          </View>
          <Text style={styles.evidenceTitle}>{item.title}</Text>
          {item.description ? <Text style={styles.evidenceDesc} numberOfLines={2}>{item.description}</Text> : null}
          <View style={styles.evidenceCardFooter}>
            <View style={styles.evidenceOpenBtn}>
              <Text style={styles.evidenceOpenText}>فتح المعيار</Text>
              <Ionicons name="arrow-back-outline" size={15} color={C.primary} />
            </View>
          </View>
        </TouchableOpacity>
      ))}
      <View style={{ height: 24 }} />
    </ScrollView>
  );
}

function AdminBackHeader({ title, onBack, rightAction }) {
  return (
    <View style={styles.adminBackHeader}>
      <View style={{ width: 42 }}>{rightAction}</View>
      <Text style={styles.pageTitle}>{title}</Text>
      <TouchableOpacity onPress={onBack} style={styles.headerBtn} activeOpacity={0.75}>
        <Ionicons name="arrow-forward-outline" size={20} color={C.primary} />
      </TouchableOpacity>
    </View>
  );
}

function EmptyRow({ title }) {
  return (
    <View style={[styles.actionRow, { borderBottomWidth: 0 }]}> 
      <View style={styles.actionRowText}><Text style={styles.actionRowTitle}>{title}</Text></View>
      <View style={[styles.actionRowIcon, { backgroundColor: C.primaryLight }]}> 
        <Ionicons name="information-circle-outline" size={20} color={C.primary} />
      </View>
    </View>
  );
}

function FormCard({ title, children }) {
  return (
    <View style={styles.formCard}>
      <Text style={styles.formTitle}>{title}</Text>
      {children}
    </View>
  );
}

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
    } catch (error) {
      Alert.alert('تعذر تحميل المعلمات', error.message);
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
    if (!editingTeacher && !password.trim()) return Alert.alert('تنبيه', 'أدخلي الرقم السري');
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
    } catch (error) {
      Alert.alert('تعذر الحفظ', error.message);
    } finally {
      setSaving(false);
    }
  }

  function confirmDeleteTeacher(teacher) {
    Alert.alert('حذف المعلمة', `هل تريدين حذف ${teacher.name}؟`, [
      { text: 'إلغاء', style: 'cancel' },
      {
        text: 'حذف',
        style: 'destructive',
        onPress: async () => {
          try {
            await requestJson(`/teachers/${teacher.id}`, { method: 'DELETE', token });
            await loadTeachers();
          } catch (error) {
            Alert.alert('تعذر الحذف', error.message);
          }
        },
      },
    ]);
  }

  return (
    <ScrollView contentContainerStyle={styles.screenPad} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
      <AdminBackHeader
        title="إدارة المعلمات"
        onBack={onBack}
        rightAction={(
          <TouchableOpacity onPress={openAddTeacher} style={styles.headerBtn} activeOpacity={0.75}>
            <Ionicons name="person-add-outline" size={21} color={C.primary} />
          </TouchableOpacity>
        )}
      />
      <Text style={styles.pageSubtitle}>إضافة وتعديل وحذف حسابات المعلمات</Text>

      {formOpen ? (
        <FormCard title={editingTeacher ? 'تعديل معلمة' : 'إضافة معلمة'}>
          <TextInput value={name} onChangeText={setName} placeholder="اسم المعلمة" placeholderTextColor={C.subtle} style={styles.formInput} textAlign="right" />
          <TextInput value={username} onChangeText={setUsername} placeholder="اسم المستخدم" placeholderTextColor={C.subtle} autoCapitalize="none" style={styles.formInput} textAlign="right" />
          <TextInput value={password} onChangeText={setPassword} placeholder={editingTeacher ? 'رقم سري جديد - اختياري' : 'الرقم السري'} placeholderTextColor={C.subtle} secureTextEntry keyboardType="number-pad" style={styles.formInput} textAlign="right" />
          <View style={styles.formActions}>
            <TouchableOpacity onPress={() => { setFormOpen(false); setEditingTeacher(null); }} style={styles.secondaryBtn} activeOpacity={0.85}>
              <Ionicons name="close-outline" size={19} color={C.muted} />
              <Text style={styles.secondaryBtnText}>إلغاء</Text>
            </TouchableOpacity>
            <PrimaryButton title="حفظ" icon="save-outline" loading={saving} onPress={saveTeacher} style={styles.formPrimaryWrap} />
          </View>
        </FormCard>
      ) : null}

      {loading ? <ActivityIndicator color={C.primary} size="large" style={{ marginTop: 30 }} /> : (
        <View style={styles.listCard}>
          {teachers.length === 0 ? <EmptyRow title="لا توجد معلمات" /> : teachers.map((teacher, idx) => (
            <View key={teacher.id} style={[styles.actionRow, idx === teachers.length - 1 && { borderBottomWidth: 0 }]}> 
              <TouchableOpacity onPress={() => confirmDeleteTeacher(teacher)} activeOpacity={0.75} style={styles.iconTap}>
                <Ionicons name="trash-outline" size={20} color={C.red} />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => openEditTeacher(teacher)} activeOpacity={0.75} style={styles.iconTap}>
                <Ionicons name="create-outline" size={20} color={C.muted} />
              </TouchableOpacity>
              <View style={styles.actionRowText}>
                <Text style={styles.actionRowTitle}>{teacher.name}</Text>
                <Text style={styles.actionRowSub}>اسم المستخدم: {teacher.username || '—'} · الملفات: {teacher.uploads_count ?? 0}</Text>
              </View>
              <View style={[styles.actionRowIcon, { backgroundColor: C.primaryLight }]}> 
                <Ionicons name="person-outline" size={20} color={C.primary} />
              </View>
            </View>
          ))}
        </View>
      )}
      <View style={{ height: 28 }} />
    </ScrollView>
  );
}

function CriteriaManagementScreen({ token, evidence, onBack, onChanged, onOpenEvidence }) {
  const [items, setItems] = useState(evidence || []);
  const [loading, setLoading] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => { setItems(evidence || []); }, [evidence]);

  async function loadCriteria() {
    setLoading(true);
    try {
      const data = await requestJson('/evidence', { token });
      const nextItems = data.items || [];
      setItems(nextItems);
      if (onChanged) onChanged(nextItems);
    } catch (error) {
      Alert.alert('تعذر تحميل المعايير', error.message);
    } finally {
      setLoading(false);
    }
  }

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
    } catch (error) {
      Alert.alert('تعذر الحفظ', error.message);
    } finally {
      setSaving(false);
    }
  }

  function confirmDeleteCriterion(item) {
    Alert.alert('حذف المعيار', `هل تريدين حذف ${item.title}؟`, [
      { text: 'إلغاء', style: 'cancel' },
      {
        text: 'حذف',
        style: 'destructive',
        onPress: async () => {
          try {
            await requestJson(`/evidence/${item.id}`, { method: 'DELETE', token });
            await loadCriteria();
          } catch (error) {
            Alert.alert('تعذر الحذف', error.message);
          }
        },
      },
    ]);
  }

  return (
    <ScrollView contentContainerStyle={styles.screenPad} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
      <AdminBackHeader
        title="إدارة المعايير"
        onBack={onBack}
        rightAction={(
          <TouchableOpacity onPress={openAddCriterion} style={styles.headerBtn} activeOpacity={0.75}>
            <Ionicons name="add-circle-outline" size={23} color={C.primary} />
          </TouchableOpacity>
        )}
      />
      <Text style={styles.pageSubtitle}>إنشاء وتعديل وحذف معايير التقييم</Text>

      {formOpen ? (
        <FormCard title={editingItem ? 'تعديل معيار' : 'إضافة معيار'}>
          <TextInput value={title} onChangeText={setTitle} placeholder="اسم المعيار" placeholderTextColor={C.subtle} style={styles.formInput} textAlign="right" />
          <TextInput
            value={description}
            onChangeText={setDescription}
            placeholder="وصف اختياري"
            placeholderTextColor={C.subtle}
            multiline
            style={[styles.formInput, styles.formTextArea]}
            textAlign="right"
            textAlignVertical="top"
          />
          <View style={styles.formActions}>
            <TouchableOpacity onPress={() => { setFormOpen(false); setEditingItem(null); }} style={styles.secondaryBtn} activeOpacity={0.85}>
              <Ionicons name="close-outline" size={19} color={C.muted} />
              <Text style={styles.secondaryBtnText}>إلغاء</Text>
            </TouchableOpacity>
            <PrimaryButton title="حفظ" icon="save-outline" loading={saving} onPress={saveCriterion} style={styles.formPrimaryWrap} />
          </View>
        </FormCard>
      ) : null}

      {loading ? <ActivityIndicator color={C.primary} size="large" style={{ marginTop: 30 }} /> : (
        <View style={styles.listCard}>
          {(items || []).length === 0 ? <EmptyRow title="لا توجد معايير" /> : (items || []).map((item, idx) => (
            <View key={item.id} style={[styles.actionRow, idx === items.length - 1 && { borderBottomWidth: 0 }]}> 
              <TouchableOpacity onPress={() => confirmDeleteCriterion(item)} activeOpacity={0.75} style={styles.iconTap}>
                <Ionicons name="trash-outline" size={20} color={C.red} />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => openEditCriterion(item)} activeOpacity={0.75} style={styles.iconTap}>
                <Ionicons name="create-outline" size={20} color={C.muted} />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => onOpenEvidence(item)} activeOpacity={0.75} style={styles.iconTap}>
                <Ionicons name="eye-outline" size={20} color={C.primary} />
              </TouchableOpacity>
              <View style={styles.actionRowText}>
                <Text style={styles.actionRowTitle}>{item.title}</Text>
                <Text style={styles.actionRowSub}>الملفات: {item.uploads_count ?? 0}</Text>
              </View>
              <View style={[styles.actionRowIcon, { backgroundColor: C.tealLight }]}> 
                <Ionicons name="checkmark-done-outline" size={20} color={C.teal} />
              </View>
            </View>
          ))}
        </View>
      )}
      <View style={{ height: 28 }} />
    </ScrollView>
  );
}

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
        Alert.alert('تعذر تحميل المعلمات', error.message);
      } finally {
        if (alive) setLoading(false);
      }
    }
    load();
    return () => { alive = false; };
  }, [token]);

  async function openTeacher(teacher) {
    setSelectedTeacher(teacher);
    setCriteriaLoading(true);
    try {
      const data = await requestJson(`/teacher-evidence/${teacher.id}`, { token });
      setCriteria(data.items || []);
    } catch (error) {
      Alert.alert('تعذر تحميل ملفات المعلمة', error.message);
    } finally {
      setCriteriaLoading(false);
    }
  }

  if (selectedTeacher) {
    return (
      <ScrollView contentContainerStyle={styles.screenPad} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        <AdminBackHeader title={selectedTeacher.name} onBack={() => setSelectedTeacher(null)} />
        <Text style={styles.pageSubtitle}>اختاري معياراً لعرض الملفات الخاصة بالمعلمة</Text>
        {criteriaLoading ? <ActivityIndicator color={C.primary} size="large" style={{ marginTop: 30 }} /> : (
          <View style={styles.listCard}>
            {criteria.length === 0 ? <EmptyRow title="لا توجد ملفات لهذه المعلمة" /> : criteria.map((item, idx) => (
              <TouchableOpacity key={item.id} style={[styles.actionRow, idx === criteria.length - 1 && { borderBottomWidth: 0 }]} activeOpacity={0.8} onPress={() => onOpenEvidence(item)}>
                <Ionicons name="chevron-back" size={16} color={C.border} />
                <View style={styles.actionRowText}>
                  <Text style={styles.actionRowTitle}>{item.title}</Text>
                  <Text style={styles.actionRowSub}>ملفات هذه المعلمة: {item.teacher_uploads_count ?? 0}</Text>
                </View>
                <View style={[styles.actionRowIcon, { backgroundColor: C.primaryLight }]}> 
                  <Ionicons name="folder-open-outline" size={20} color={C.primary} />
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}
        <View style={{ height: 28 }} />
      </ScrollView>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.screenPad} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
      <Text style={styles.pageTitle}>متابعة المعلمات</Text>
      <Text style={styles.pageSubtitle}>اختاري المعلمة ثم المعيار لعرض الملفات</Text>
      {loading ? <ActivityIndicator color={C.primary} size="large" style={{ marginTop: 30 }} /> : (
        <View style={styles.listCard}>
          {teachers.length === 0 ? <EmptyRow title="لا توجد معلمات" /> : teachers.map((teacher, idx) => (
            <TouchableOpacity key={teacher.id} style={[styles.actionRow, idx === teachers.length - 1 && { borderBottomWidth: 0 }]} activeOpacity={0.8} onPress={() => openTeacher(teacher)}>
              <Ionicons name="chevron-back" size={16} color={C.border} />
              <View style={styles.actionRowText}>
                <Text style={styles.actionRowTitle}>{teacher.name}</Text>
                <Text style={styles.actionRowSub}>عدد الملفات: {teacher.uploads_count ?? 0}</Text>
              </View>
              <View style={[styles.actionRowIcon, { backgroundColor: C.goldLight }]}> 
                <Ionicons name="folder-outline" size={20} color={C.gold} />
              </View>
            </TouchableOpacity>
          ))}
        </View>
      )}
      <View style={{ height: 28 }} />
    </ScrollView>
  );
}

function SettingsScreen({ user, onLogout, onOpenTeachers, onOpenCriteria }) {
  const isPrincipal = user?.is_principal || user?.role === 'principal';
  const initials = user?.name?.charAt(0) || 'م';

  return (
    <ScrollView contentContainerStyle={styles.screenPad} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
      <LinearGradient colors={C.grad} style={styles.profileCard}>
        <View style={styles.profileAvatarRow}>
          <View style={styles.profileAvatarWrap}>
            <View style={styles.profileAvatarInner}><Text style={styles.profileAvatarLetter}>{initials}</Text></View>
            <View style={[styles.profileRoleDot, { backgroundColor: isPrincipal ? C.gold : C.green }]} />
          </View>
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>{user?.name}</Text>
            <View style={styles.profileRolePill}>
              <View style={[styles.profileRolePillDot, { backgroundColor: isPrincipal ? C.gold : C.green }]} />
              <Text style={styles.profileRoleText}>{isPrincipal ? 'مديرة المدرسة' : 'معلمة'}</Text>
            </View>
          </View>
        </View>
        <View style={styles.profileDivider} />
        <View style={styles.profileSchoolRow}>
          <Ionicons name="business-outline" size={15} color="rgba(255,255,255,0.7)" />
          <Text style={styles.profileSchoolName}>{user?.school?.name || 'مدرسة'}</Text>
        </View>
      </LinearGradient>

      {isPrincipal ? (
        <>
          <Text style={styles.settingsSectionLabel}>إدارة المدرسة</Text>
          <View style={styles.listCard}>
            <ActionRow icon="people-outline" title="إدارة المعلمات" subtitle="إضافة وتعديل وحذف حسابات المعلمات" accent={C.primary} onPress={onOpenTeachers} />
            <ActionRow icon="checkmark-done-circle-outline" title="إدارة المعايير" subtitle="إنشاء وتعديل وحذف معايير التقييم" accent={C.teal} onPress={onOpenCriteria} noBorder />
          </View>
        </>
      ) : (
        <>
          <Text style={styles.settingsSectionLabel}>حسابي</Text>
          <View style={styles.listCard}>
            <ActionRow icon="person-outline" title="بياناتي الشخصية" subtitle="الاسم واسم المستخدم" accent={C.primary} onPress={() => Alert.alert('بياناتي الشخصية', user?.name || 'لا توجد بيانات')} />
            <ActionRow icon="folder-outline" title="ملفاتي المرفوعة" subtitle="جميع الملفات التي رفعتِها" accent={C.teal} onPress={() => Alert.alert('ملفاتي المرفوعة', 'افتحي تبويب حسب المعايير لاستعراض الملفات.')} noBorder />
          </View>
        </>
      )}

      <Text style={styles.settingsSectionLabel}>عام</Text>
      <View style={styles.listCard}>
        <ActionRow icon="help-circle-outline" title="الدعم والمساعدة" subtitle="تواصلي مع فريق الدعم" accent={C.muted} onPress={() => Alert.alert('الدعم والمساعدة', 'سيتم ربط وسيلة الدعم لاحقاً.')} />
        <View style={styles.appVersionRow}>
          <Text style={styles.appVersionValue}>1.0.8</Text>
          <View style={styles.appVersionText}>
            <Text style={styles.appVersionTitle}>إصدار التطبيق</Text>
            <Text style={styles.appVersionSub}>Amal School App</Text>
          </View>
          <View style={[styles.actionRowIcon, { backgroundColor: `${C.subtle}18` }]}> 
            <Ionicons name="information-circle-outline" size={20} color={C.subtle} />
          </View>
        </View>
      </View>

      <TouchableOpacity style={styles.logoutBtn} onPress={onLogout} activeOpacity={0.85}>
        <Ionicons name="log-out-outline" size={20} color={C.red} />
        <Text style={styles.logoutText}>تسجيل الخروج</Text>
      </TouchableOpacity>
      <View style={{ height: 32 }} />
    </ScrollView>
  );
}

function BottomNav({ tab, setTab, isPrincipal }) {
  const tabs = useMemo(() => [
    { id: 'home', icon: 'home', iconOff: 'home-outline', label: 'الرئيسية' },
    { id: 'evidence', icon: 'list', iconOff: 'list-outline', label: 'حسب المعايير' },
    ...(isPrincipal ? [{ id: 'teacherFiles', icon: 'folder-open', iconOff: 'folder-open-outline', label: 'متابعة المعلمات' }] : []),
    { id: 'settings', icon: 'settings', iconOff: 'settings-outline', label: 'الإعدادات' },
  ], [isPrincipal]);

  return (
    <View style={styles.bottomNavWrap}>
      <View style={styles.bottomNav}>
        {tabs.map((item) => {
          const active = tab === item.id;
          return (
            <TouchableOpacity key={item.id} style={[styles.navTab, active && styles.navTabActive]} onPress={() => setTab(item.id)} activeOpacity={0.8}>
              <Ionicons name={active ? item.icon : item.iconOff} size={21} color={active ? C.primary : C.muted} />
              <Text style={[styles.navLabel, active && styles.navLabelActive]} numberOfLines={1}>{item.label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

function MainApp({ token, user, setUser, onLogout }) {
  const [tab, setTab] = useState('home');
  const [settingsSub, setSettingsSub] = useState(null);
  const [loading, setLoading] = useState(true);
  const [dashboard, setDashboard] = useState(null);
  const [evidence, setEvidence] = useState([]);
  const [selectedEvidence, setSelectedEvidence] = useState(null);

  useEffect(() => {
    let alive = true;
    async function loadData() {
      setLoading(true);
      try {
        const [me, dash, ev] = await Promise.all([
          requestJson('/me', { token }),
          requestJson('/dashboard', { token }),
          requestJson('/evidence', { token }),
        ]);
        if (!alive) return;
        setUser(me.user);
        setDashboard(dash);
        setEvidence(ev.items || []);
      } catch (error) {
        Alert.alert('تعذر تحميل البيانات', error.message);
      } finally {
        if (alive) setLoading(false);
      }
    }
    loadData();
    return () => { alive = false; };
  }, [token, setUser]);

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
  else if (tab === 'settings' && settingsSub === 'criteria') screen = (
    <CriteriaManagementScreen
      token={token}
      evidence={evidence}
      onBack={() => setSettingsSub(null)}
      onChanged={refreshEvidence}
      onOpenEvidence={(item) => setSelectedEvidence(item)}
    />
  );
  else if (tab === 'settings') screen = (
    <SettingsScreen
      user={user}
      onLogout={onLogout}
      onOpenTeachers={() => setSettingsSub('teachers')}
      onOpenCriteria={() => setSettingsSub('criteria')}
    />
  );
  else screen = <HomeScreen user={user} dashboard={dashboard} setTab={goTab} />;

  return (
    <View style={[styles.fill, { backgroundColor: C.bg }]}> 
      <StatusBar barStyle="dark-content" backgroundColor={C.surface} />
      <SafeAreaView style={styles.fill}>
        {!loading && !showDetail ? <AppHeader user={user} onLogout={onLogout} /> : null}
        <View style={styles.fill}>{screen}</View>
        {!loading && !showDetail ? <BottomNav tab={tab} setTab={goTab} isPrincipal={isPrincipal} /> : null}
      </SafeAreaView>
    </View>
  );
}

export default function AppMobileFixedStable() {
  const [ready, setReady] = useState(false);
  const [token, setToken] = useState(null);
  const [user, setUser] = useState(null);
  const [requiresSetup, setRequiresSetup] = useState(false);

  useEffect(() => {
    let alive = true;
    async function bootstrap() {
      try {
        const savedToken = await SecureStore.getItemAsync(TOKEN_KEY);
        if (!savedToken) return;
        const data = await requestJson('/me', { token: savedToken });
        if (!alive) return;
        setToken(savedToken);
        setUser(data.user);
        setRequiresSetup(false);
      } catch {
        await SecureStore.deleteItemAsync(TOKEN_KEY).catch(() => {});
      } finally {
        if (alive) setReady(true);
      }
    }
    bootstrap();
    return () => { alive = false; };
  }, []);

  async function logout() {
    await SecureStore.deleteItemAsync(TOKEN_KEY).catch(() => {});
    setToken(null);
    setUser(null);
    setRequiresSetup(false);
  }

  if (!ready) return <LoadingScreen label="جاري تجهيز التطبيق..." />;
  if (!token) {
    return (
      <LoginScreen
        onLoggedIn={(nextToken, nextUser, nextRequiresSetup) => {
          setToken(nextToken);
          setUser(nextUser);
          setRequiresSetup(!!nextRequiresSetup);
        }}
      />
    );
  }
  if (requiresSetup) {
    return (
      <SetupPasswordScreen
        token={token}
        user={user}
        onDone={(nextUser) => {
          setUser(nextUser);
          setRequiresSetup(false);
        }}
      />
    );
  }

  return <MainApp token={token} user={user} setUser={setUser} onLogout={logout} />;
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  center: { alignItems: 'center', justifyContent: 'center' },
  loadingLogo: {
    width: 86,
    height: 86,
    borderRadius: 28,
    backgroundColor: 'rgba(255,255,255,0.16)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.28)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingLogoText: { color: '#fff', fontSize: 42, fontWeight: '900' },
  loadingText: { marginTop: 14, color: '#fff', fontSize: 15, fontWeight: '700' },
  loginTop: { minHeight: 270, paddingBottom: 44 },
  loginTopInner: { alignItems: 'center', justifyContent: 'center', paddingTop: 42 },
  loginLogo: {
    width: 92,
    height: 92,
    borderRadius: 30,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.28)',
  },
  loginLogoText: { color: '#fff', fontSize: 48, fontWeight: '900' },
  loginAppName: { color: '#fff', fontSize: 34, fontWeight: '900', marginTop: 14 },
  loginTagline: { color: 'rgba(255,255,255,0.82)', fontSize: 14, marginTop: 8, fontWeight: '700' },
  loginSheet: {
    flex: 1,
    marginTop: -32,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    backgroundColor: C.bg,
  },
  loginSheetContent: { padding: 22, paddingTop: 28 },
  loginWelcome: { textAlign: 'right', color: C.text, fontSize: 25, fontWeight: '900' },
  loginSub: { textAlign: 'right', color: C.muted, fontSize: 14, marginTop: 5, marginBottom: 18 },
  inputRow: {
    minHeight: 56,
    borderRadius: 18,
    backgroundColor: C.surface,
    borderWidth: 1,
    borderColor: C.border,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    marginTop: 10,
    ...shadow(2),
  },
  inputRowFocused: { borderColor: C.primary },
  inputField: { flex: 1, color: C.text, fontSize: 15, fontWeight: '700', minHeight: 48 },
  inputIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 14,
    backgroundColor: C.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 10,
  },
  primaryButton: {
    minHeight: 52,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
    marginTop: 14,
  },
  primaryButtonText: { color: '#fff', fontSize: 16, fontWeight: '900' },
  header: {
    minHeight: 74,
    backgroundColor: C.surface,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerBtn: {
    width: 42,
    height: 42,
    borderRadius: 16,
    backgroundColor: C.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerCenter: { flex: 1, alignItems: 'center', paddingHorizontal: 12 },
  headerSchool: { color: C.text, fontSize: 15, fontWeight: '900' },
  headerName: { color: C.muted, fontSize: 12, fontWeight: '700', marginTop: 2 },
  headerAvatarWrap: { position: 'relative' },
  headerAvatar: { width: 46, height: 46, borderRadius: 17, alignItems: 'center', justifyContent: 'center' },
  headerAvatarText: { color: '#fff', fontSize: 20, fontWeight: '900' },
  headerRoleDot: { position: 'absolute', right: -2, bottom: -2, width: 14, height: 14, borderRadius: 7, borderWidth: 2, borderColor: '#fff' },
  screenPad: { padding: 16, paddingBottom: 110 },
  heroCard: { borderRadius: 28, padding: 20, minHeight: 166, justifyContent: 'space-between', ...shadow(4) },
  heroPill: {
    alignSelf: 'flex-end',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.16)',
    borderRadius: 99,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  heroPillDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: C.green, marginRight: 7 },
  heroPillText: { color: '#fff', fontSize: 12, fontWeight: '800' },
  heroGreeting: { color: 'rgba(255,255,255,0.76)', textAlign: 'right', fontSize: 15, marginTop: 8 },
  heroName: { color: '#fff', textAlign: 'right', fontSize: 26, fontWeight: '900', marginTop: 2 },
  heroDesc: { color: 'rgba(255,255,255,0.82)', textAlign: 'right', fontSize: 13, marginTop: 8, lineHeight: 21 },
  statsRow: { flexDirection: 'row', gap: 10, marginTop: 14 },
  statCard: {
    flex: 1,
    backgroundColor: C.surface,
    borderRadius: 22,
    padding: 14,
    minHeight: 118,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadow(2),
  },
  statIconBg: { width: 38, height: 38, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  statValue: { color: C.text, fontSize: 21, fontWeight: '900', marginTop: 8 },
  statLabel: { color: C.muted, fontSize: 12, fontWeight: '800', marginTop: 2 },
  sectionLabel: { color: C.text, textAlign: 'right', fontSize: 16, fontWeight: '900', marginTop: 20, marginBottom: 10 },
  settingsSectionLabel: { color: C.text, textAlign: 'right', fontSize: 16, fontWeight: '900', marginTop: 18, marginBottom: 10 },
  listCard: { backgroundColor: C.surface, borderRadius: 24, overflow: 'hidden', ...shadow(2) },
  actionRow: {
    minHeight: 72,
    paddingHorizontal: 14,
    paddingVertical: 11,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  actionRowText: { flex: 1, alignItems: 'flex-end' },
  actionRowTitle: { color: C.text, fontSize: 15, fontWeight: '900', textAlign: 'right' },
  actionRowSub: { color: C.muted, fontSize: 12, fontWeight: '700', textAlign: 'right', marginTop: 3 },
  actionRowIcon: { width: 42, height: 42, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  iconTap: { width: 34, height: 34, alignItems: 'center', justifyContent: 'center', borderRadius: 12, backgroundColor: C.bg },
  uploadRow: {
    minHeight: 68,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  uploadRowDate: { color: C.subtle, fontSize: 11, fontWeight: '700' },
  uploadRowText: { flex: 1, alignItems: 'flex-end' },
  uploadRowTitle: { color: C.text, fontSize: 14, fontWeight: '900' },
  uploadRowSub: { color: C.muted, fontSize: 12, marginTop: 2 },
  uploadRowIcon: { width: 36, height: 36, borderRadius: 13, backgroundColor: C.greenLight, alignItems: 'center', justifyContent: 'center' },
  pageTitle: { color: C.text, fontSize: 23, fontWeight: '900', textAlign: 'right' },
  pageSubtitle: { color: C.muted, fontSize: 13, lineHeight: 21, fontWeight: '700', textAlign: 'right', marginTop: 6, marginBottom: 14 },
  evidenceCard: { backgroundColor: C.surface, borderRadius: 24, padding: 16, marginBottom: 12, ...shadow(2) },
  evidenceCardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  evidenceBadge: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: C.primaryLight, borderRadius: 99, paddingHorizontal: 10, paddingVertical: 6 },
  evidenceBadgeText: { color: C.primary, fontSize: 11, fontWeight: '900' },
  evidenceIconWrap: { width: 44, height: 44, borderRadius: 16, overflow: 'hidden' },
  evidenceIcon: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  evidenceTitle: { color: C.text, fontSize: 17, fontWeight: '900', textAlign: 'right', marginTop: 12 },
  evidenceDesc: { color: C.muted, fontSize: 13, lineHeight: 20, textAlign: 'right', marginTop: 6 },
  evidenceCardFooter: { marginTop: 14, alignItems: 'flex-start' },
  evidenceOpenBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: C.primaryLight, borderRadius: 99, paddingHorizontal: 12, paddingVertical: 8 },
  evidenceOpenText: { color: C.primary, fontWeight: '900', fontSize: 12 },
  adminBackHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 },
  formCard: { backgroundColor: C.surface, borderRadius: 24, padding: 14, marginBottom: 14, gap: 10, ...shadow(2) },
  formTitle: { color: C.text, fontSize: 16, fontWeight: '900', textAlign: 'right' },
  formInput: { backgroundColor: C.bg, borderRadius: 14, paddingHorizontal: 14, minHeight: 48, color: C.text, fontSize: 14, fontWeight: '700' },
  formTextArea: { minHeight: 86, paddingTop: 12 },
  formActions: { flexDirection: 'row', gap: 10 },
  secondaryBtn: {
    flex: 1,
    minHeight: 48,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: C.border,
    backgroundColor: C.surface,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 7,
  },
  secondaryBtnText: { color: C.muted, fontSize: 14, fontWeight: '900' },
  formPrimaryWrap: { flex: 1 },
  profileCard: { borderRadius: 28, padding: 18, ...shadow(3) },
  profileAvatarRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', gap: 12 },
  profileAvatarWrap: { position: 'relative' },
  profileAvatarInner: { width: 58, height: 58, borderRadius: 21, backgroundColor: 'rgba(255,255,255,0.18)', alignItems: 'center', justifyContent: 'center' },
  profileAvatarLetter: { color: '#fff', fontSize: 25, fontWeight: '900' },
  profileRoleDot: { position: 'absolute', right: -2, bottom: -2, width: 15, height: 15, borderRadius: 8, borderWidth: 2, borderColor: '#fff' },
  profileInfo: { flex: 1, alignItems: 'flex-end' },
  profileName: { color: '#fff', fontSize: 20, fontWeight: '900', textAlign: 'right' },
  profileRolePill: { marginTop: 8, flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(255,255,255,0.15)', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 99 },
  profileRolePillDot: { width: 8, height: 8, borderRadius: 4 },
  profileRoleText: { color: '#fff', fontSize: 12, fontWeight: '900' },
  profileDivider: { height: 1, backgroundColor: 'rgba(255,255,255,0.18)', marginVertical: 14 },
  profileSchoolRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', gap: 7 },
  profileSchoolName: { color: '#fff', fontSize: 13, fontWeight: '800' },
  appVersionRow: { minHeight: 68, paddingHorizontal: 14, paddingVertical: 11, flexDirection: 'row', alignItems: 'center', gap: 10 },
  appVersionValue: { color: C.subtle, fontSize: 12, fontWeight: '900' },
  appVersionText: { flex: 1, alignItems: 'flex-end' },
  appVersionTitle: { color: C.text, fontSize: 14, fontWeight: '900' },
  appVersionSub: { color: C.muted, fontSize: 12, marginTop: 2 },
  logoutBtn: {
    minHeight: 52,
    marginTop: 16,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: C.redLight,
    backgroundColor: C.surface,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  logoutText: { color: C.red, fontSize: 15, fontWeight: '900' },
  bottomNavWrap: { position: 'absolute', left: 0, right: 0, bottom: 0, paddingHorizontal: 12, paddingBottom: 10, backgroundColor: 'transparent' },
  bottomNav: { backgroundColor: C.surface, borderRadius: 24, padding: 8, flexDirection: 'row', justifyContent: 'space-around', ...shadow(4) },
  navTab: { flex: 1, minHeight: 56, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  navTabActive: { backgroundColor: C.primaryLight },
  navLabel: { color: C.muted, fontSize: 10, fontWeight: '800', marginTop: 3 },
  navLabelActive: { color: C.primary },
});
