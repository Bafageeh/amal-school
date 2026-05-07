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

function LoadingScreen() {
  return (
    <LinearGradient colors={C.grad} style={[styles.fill, styles.center]}>
      <StatusBar barStyle="light-content" />
      <View style={styles.loadingLogo}><Text style={styles.loadingLogoText}>أ</Text></View>
      <ActivityIndicator color="#fff" size="large" style={{ marginTop: 24 }} />
      <Text style={styles.loadingText}>جاري التحميل...</Text>
    </LinearGradient>
  );
}

function InputRow({ icon, focused, ...props }) {
  return (
    <View style={[styles.inputRow, focused && styles.inputRowFocused]}>
      <TextInput
        {...props}
        style={styles.inputField}
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
        <TouchableOpacity style={styles.loginBtn} onPress={login} disabled={loading} activeOpacity={0.88}>
          <LinearGradient colors={[C.primary, C.primaryDark]} style={styles.loginBtnGrad}>
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.loginBtnText}>دخول</Text>}
          </LinearGradient>
        </TouchableOpacity>
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
        <TouchableOpacity style={styles.loginBtn} onPress={submit} disabled={loading} activeOpacity={0.88}>
          <LinearGradient colors={[C.primary, C.primaryDark]} style={styles.loginBtnGrad}>
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.loginBtnText}>حفظ واعتماد</Text>}
          </LinearGradient>
        </TouchableOpacity>
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
        <Text style={styles.actionRowTitle}>{title}</Text>
        {subtitle ? <Text style={styles.actionRowSub}>{subtitle}</Text> : null}
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
        <View style={styles.heroPill}><View style={styles.heroPillDot} /><Text style={styles.heroPillText}>{isPrincipal ? 'مديرة المدرسة' : 'معلمة'}</Text></View>
        <Text style={styles.heroGreeting}>مرحباً</Text>
        <Text style={styles.heroName}>{user?.name}</Text>
        <Text style={styles.heroDesc}>{isPrincipal ? 'متابعة المعايير وملفات المعلمات بسرعة' : 'رفع ومتابعة ملفات معايير التقييم الخاصة بك'}</Text>
      </LinearGradient>

      <View style={styles.statsRow}>
        {isPrincipal && <StatCard label="المعلمات" value={String(stats.teachers_count ?? 0)} icon="people" bg={C.primaryLight} color={C.primary} />}
        <StatCard label="المعايير" value={String(stats.evidence_count ?? 0)} icon="checkmark-circle" bg={C.tealLight} color={C.teal} />
        <StatCard label="الملفات" value={String(stats.uploads_count ?? 0)} icon="folder" bg={C.greenLight} color={C.green} />
      </View>

      <Text style={styles.sectionLabel}>اختصارات سريعة</Text>
      <View style={styles.listCard}>
        <ActionRow icon="list-outline" title="حسب المعايير" subtitle={isPrincipal ? 'عرض الملفات مرتبة حسب كل معيار' : 'عرض ورفع الملفات'} accent={C.teal} onPress={() => setTab('evidence')} />
        {isPrincipal && <ActionRow icon="folder-open-outline" title="متابعة المعلمات" subtitle="اختيار معلمة ثم معيار لعرض ملفاتها" accent={C.gold} onPress={() => setTab('teacherFiles')} />}
        <ActionRow icon="settings-outline" title="الإعدادات" subtitle="خيارات الحساب وإدارة المدرسة" accent={C.primary} onPress={() => setTab('settings')} noBorder />
      </View>

      {latestUploads.length > 0 && (
        <>
          <Text style={styles.sectionLabel}>آخر الملفات المرفوعة</Text>
          <View style={styles.listCard}>
            {latestUploads.map((upload, idx) => (
              <View key={upload.id} style={[styles.uploadRow, idx === latestUploads.length - 1 && { borderBottomWidth: 0 }]}>
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
      )}
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

function TeachersManagementScreen({ token, onBack }) {
  const [loading, setLoading] = useState(true);
  const [teachers, setTeachers] = useState([]);

  useEffect(() => {
    let alive = true;
    async function load() {
      setLoading(true);
      try {
        const data = await requestJson('/teachers', { token });
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

  return (
    <ScrollView contentContainerStyle={styles.screenPad} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
      <AdminBackHeader title="المعلمات" onBack={onBack} />
      <Text style={styles.pageSubtitle}>قائمة حسابات المعلمات في المدرسة</Text>
      {loading ? <ActivityIndicator color={C.primary} size="large" style={{ marginTop: 30 }} /> : (
        <View style={styles.listCard}>
          {teachers.length === 0 ? <EmptyRow title="لا توجد معلمات" /> : teachers.map((teacher, idx) => (
            <View key={teacher.id} style={[styles.actionRow, idx === teachers.length - 1 && { borderBottomWidth: 0 }]}>
              <View style={[styles.actionRowIcon, { backgroundColor: C.primaryLight }]}>
                <Ionicons name="person-outline" size={20} color={C.primary} />
              </View>
              <View style={styles.actionRowText}>
                <Text style={styles.actionRowTitle}>{teacher.name}</Text>
                <Text style={styles.actionRowSub}>اسم المستخدم: {teacher.username || '—'} · الملفات: {teacher.uploads_count ?? 0}</Text>
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

function SettingsScreen({ user, onLogout, onOpenTeachers }) {
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
            <ActionRow icon="people-outline" title="المعلمات" subtitle="إضافة وتعديل وحذف حسابات المعلمات" accent={C.primary} onPress={onOpenTeachers} noBorder />
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
          <Text style={styles.appVersionValue}>1.0.1</Text>
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

  let screen;
  if (loading) screen = <LoadingScreen />;
  else if (showDetail) screen = <EvidenceDetailScreen token={token} evidence={selectedEvidence} onBack={() => setSelectedEvidence(null)} />;
  else if (tab === 'evidence') screen = <EvidenceScreen evidence={evidence} onSelectEvidence={setSelectedEvidence} isPrincipal={isPrincipal} />;
  else if (tab === 'teacherFiles') screen = <TeacherFilesScreen token={token} onBack={() => goTab('home')} onOpenEvidence={setSelectedEvidence} />;
  else if (tab === 'settings' && settingsSub === 'teachers') screen = <TeachersManagementScreen token={token} onBack={() => setSettingsSub(null)} />;
  else if (tab === 'settings') screen = <SettingsScreen user={user} onLogout={onLogout} onOpenTeachers={() => setSettingsSub('teachers')} />;
  else screen = <HomeScreen user={user} dashboard={dashboard} setTab={goTab} />;

  return (
    <View style={[styles.fill, { backgroundColor: C.bg }]}>
      <StatusBar barStyle="dark-content" backgroundColor={C.surface} />
      <SafeAreaView style={styles.fill}>
        {!loading && !showDetail && <AppHeader user={user} onLogout={onLogout} />}
        <View style={styles.fill}>{screen}</View>
        {!loading && !showDetail && <BottomNav tab={tab} setTab={goTab} isPrincipal={isPrincipal} />}
      </SafeAreaView>
    </View>
  );
}

export default function AppMobileFixed() {
  const [booting, setBooting] = useState(true);
  const [token, setToken] = useState(null);
  const [user, setUser] = useState(null);
  const [needsSetup, setNeedsSetup] = useState(false);

  useEffect(() => {
    async function boot() {
      const storedToken = await SecureStore.getItemAsync(TOKEN_KEY);
      if (storedToken) {
        try {
          const me = await requestJson('/me', { token: storedToken });
          setToken(storedToken);
          setUser(me.user);
          setNeedsSetup(me.user?.requires_password_setup || false);
        } catch {
          await SecureStore.deleteItemAsync(TOKEN_KEY);
        }
      }
      setBooting(false);
    }
    boot();
  }, []);

  async function logout() {
    if (token) requestJson('/logout', { method: 'POST', token }).catch(() => {});
    await SecureStore.deleteItemAsync(TOKEN_KEY);
    setToken(null);
    setUser(null);
    setNeedsSetup(false);
  }

  if (booting) return <LoadingScreen />;
  if (!token) return <LoginScreen onLoggedIn={(nextToken, nextUser, setupRequired) => { setToken(nextToken); setUser(nextUser); setNeedsSetup(setupRequired); }} />;
  if (needsSetup) return <SetupPasswordScreen token={token} user={user} onDone={(nextUser) => { setUser(nextUser); setNeedsSetup(false); }} />;
  return <MainApp token={token} user={user} setUser={setUser} onLogout={logout} />;
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  center: { alignItems: 'center', justifyContent: 'center' },
  loadingLogo: { width: 96, height: 96, borderRadius: 48, backgroundColor: 'rgba(255,255,255,0.16)', alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: 'rgba(255,255,255,0.24)' },
  loadingLogoText: { color: '#fff', fontSize: 44, fontWeight: '900' },
  loadingText: { color: 'rgba(255,255,255,0.78)', fontSize: 15, fontWeight: '700', marginTop: 14 },
  loginTop: { paddingBottom: 56 },
  loginTopInner: { alignItems: 'center', paddingTop: 56, paddingBottom: 10, gap: 14 },
  loginLogo: { width: 96, height: 96, borderRadius: 48, backgroundColor: 'rgba(255,255,255,0.18)', alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: 'rgba(255,255,255,0.28)' },
  loginLogoText: { color: '#fff', fontSize: 44, fontWeight: '900' },
  loginAppName: { color: '#fff', fontSize: 28, fontWeight: '900' },
  loginTagline: { color: 'rgba(255,255,255,0.72)', fontSize: 13, textAlign: 'center', paddingHorizontal: 36 },
  loginSheet: { flex: 1, backgroundColor: C.surface, borderTopLeftRadius: 36, borderTopRightRadius: 36, marginTop: -36 },
  loginSheetContent: { padding: 28, paddingTop: 34 },
  loginWelcome: { color: C.text, fontSize: 30, fontWeight: '900', textAlign: 'right' },
  loginSub: { color: C.muted, fontSize: 15, marginTop: 8, marginBottom: 24, textAlign: 'right' },
  inputRow: { minHeight: 58, borderRadius: 20, borderWidth: 1, borderColor: C.border, backgroundColor: '#F8FAFC', flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, marginBottom: 13 },
  inputRowFocused: { borderColor: C.primary, backgroundColor: C.surface },
  inputField: { flex: 1, color: C.text, fontSize: 16, paddingVertical: 12 },
  inputIconWrap: { width: 38, height: 38, borderRadius: 15, alignItems: 'center', justifyContent: 'center', backgroundColor: C.surface, marginLeft: 10 },
  loginBtn: { borderRadius: 20, overflow: 'hidden', marginTop: 8, ...shadow(4) },
  loginBtnGrad: { minHeight: 58, alignItems: 'center', justifyContent: 'center' },
  loginBtnText: { color: '#fff', fontSize: 17, fontWeight: '900' },
  header: { minHeight: 74, paddingHorizontal: 18, paddingTop: 10, paddingBottom: 10, backgroundColor: C.surface, flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: '#EDF1F7' },
  headerBtn: { width: 42, height: 42, borderRadius: 16, backgroundColor: '#F8FAFC', alignItems: 'center', justifyContent: 'center' },
  headerCenter: { flex: 1, alignItems: 'flex-end', paddingHorizontal: 12 },
  headerSchool: { color: C.muted, fontSize: 12, fontWeight: '700' },
  headerName: { color: C.text, fontSize: 17, fontWeight: '900', marginTop: 3 },
  headerAvatarWrap: { position: 'relative' },
  headerAvatar: { width: 46, height: 46, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  headerAvatarText: { color: '#fff', fontSize: 20, fontWeight: '900' },
  headerRoleDot: { position: 'absolute', width: 13, height: 13, borderRadius: 7, left: -1, bottom: 0, borderWidth: 2, borderColor: C.surface },
  screenPad: { padding: 18, paddingBottom: 112 },
  heroCard: { borderRadius: 30, padding: 22, minHeight: 176, justifyContent: 'flex-end', ...shadow(5) },
  heroPill: { alignSelf: 'flex-end', flexDirection: 'row-reverse', alignItems: 'center', gap: 8, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 999, backgroundColor: 'rgba(255,255,255,0.16)', marginBottom: 20 },
  heroPillDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: C.green },
  heroPillText: { color: '#EAF2FF', fontSize: 12, fontWeight: '900' },
  heroGreeting: { color: 'rgba(255,255,255,0.7)', fontSize: 16, textAlign: 'right' },
  heroName: { color: '#fff', fontSize: 31, fontWeight: '900', textAlign: 'right', marginTop: 4 },
  heroDesc: { color: '#DBEAFE', fontSize: 14, lineHeight: 23, textAlign: 'right', marginTop: 7 },
  statsRow: { flexDirection: 'row-reverse', gap: 10, marginTop: 14 },
  statCard: { flex: 1, backgroundColor: C.surface, borderRadius: 24, padding: 14, alignItems: 'flex-end', borderWidth: 1, borderColor: '#EEF2F8', ...shadow(2) },
  statIconBg: { width: 38, height: 38, borderRadius: 15, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  statValue: { color: C.text, fontSize: 24, fontWeight: '900' },
  statLabel: { color: C.muted, fontSize: 12, fontWeight: '800', marginTop: 2 },
  sectionLabel: { color: C.text, fontSize: 18, fontWeight: '900', textAlign: 'right', marginTop: 24, marginBottom: 10 },
  settingsSectionLabel: { color: C.text, fontSize: 18, fontWeight: '900', textAlign: 'right', marginTop: 22, marginBottom: 10 },
  listCard: { backgroundColor: C.surface, borderRadius: 26, paddingHorizontal: 12, borderWidth: 1, borderColor: '#EEF2F8', overflow: 'hidden', ...shadow(2) },
  actionRow: { minHeight: 76, flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: '#F1F5F9', gap: 12, paddingVertical: 12 },
  actionRowText: { flex: 1, alignItems: 'flex-end' },
  actionRowTitle: { color: C.text, fontSize: 16, fontWeight: '900', textAlign: 'right' },
  actionRowSub: { color: C.muted, fontSize: 12.5, lineHeight: 19, marginTop: 4, textAlign: 'right' },
  actionRowIcon: { width: 46, height: 46, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  uploadRow: { minHeight: 70, flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: '#F1F5F9', gap: 10, paddingVertical: 10 },
  uploadRowDate: { color: C.subtle, fontSize: 11, width: 76 },
  uploadRowText: { flex: 1, alignItems: 'flex-end' },
  uploadRowTitle: { color: C.text, fontSize: 14, fontWeight: '900' },
  uploadRowSub: { color: C.muted, fontSize: 12, marginTop: 3 },
  uploadRowIcon: { width: 38, height: 38, borderRadius: 15, backgroundColor: C.greenLight, alignItems: 'center', justifyContent: 'center' },
  pageTitle: { color: C.text, fontSize: 30, fontWeight: '900', textAlign: 'right' },
  pageSubtitle: { color: C.muted, fontSize: 14, lineHeight: 23, textAlign: 'right', marginTop: 8, marginBottom: 16 },
  evidenceCard: { backgroundColor: C.surface, borderRadius: 28, padding: 18, marginBottom: 13, borderWidth: 1, borderColor: '#EEF2F8', ...shadow(2) },
  evidenceCardTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  evidenceBadge: { flexDirection: 'row-reverse', alignItems: 'center', gap: 6, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999, backgroundColor: C.primaryLight },
  evidenceBadgeText: { color: C.primary, fontSize: 12, fontWeight: '900' },
  evidenceIconWrap: { width: 48, height: 48, borderRadius: 19, overflow: 'hidden' },
  evidenceIcon: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  evidenceTitle: { color: C.text, fontSize: 18, fontWeight: '900', textAlign: 'right', marginTop: 16 },
  evidenceDesc: { color: C.muted, fontSize: 13, lineHeight: 21, textAlign: 'right', marginTop: 7 },
  evidenceCardFooter: { marginTop: 16, alignItems: 'flex-start' },
  evidenceOpenBtn: { flexDirection: 'row-reverse', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 9, borderRadius: 999, backgroundColor: C.primaryLight },
  evidenceOpenText: { color: C.primary, fontSize: 12, fontWeight: '900' },
  adminBackHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 },
  profileCard: { borderRadius: 30, padding: 20, ...shadow(5) },
  profileAvatarRow: { flexDirection: 'row-reverse', alignItems: 'center', gap: 14 },
  profileAvatarWrap: { position: 'relative' },
  profileAvatarInner: { width: 64, height: 64, borderRadius: 24, backgroundColor: 'rgba(255,255,255,0.18)', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.25)' },
  profileAvatarLetter: { color: '#fff', fontSize: 28, fontWeight: '900' },
  profileRoleDot: { position: 'absolute', left: -2, bottom: 1, width: 15, height: 15, borderRadius: 8, borderWidth: 2, borderColor: '#fff' },
  profileInfo: { flex: 1, alignItems: 'flex-end' },
  profileName: { color: '#fff', fontSize: 24, fontWeight: '900', textAlign: 'right' },
  profileRolePill: { flexDirection: 'row-reverse', alignItems: 'center', gap: 6, marginTop: 9, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999, backgroundColor: 'rgba(255,255,255,0.15)' },
  profileRolePillDot: { width: 7, height: 7, borderRadius: 4 },
  profileRoleText: { color: '#EAF2FF', fontSize: 12, fontWeight: '900' },
  profileDivider: { height: 1, backgroundColor: 'rgba(255,255,255,0.13)', marginVertical: 16 },
  profileSchoolRow: { flexDirection: 'row-reverse', alignItems: 'center', gap: 8 },
  profileSchoolName: { color: '#DBEAFE', fontSize: 13, fontWeight: '800' },
  appVersionRow: { minHeight: 76, flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12 },
  appVersionValue: { color: C.subtle, fontSize: 13, fontWeight: '900' },
  appVersionText: { flex: 1, alignItems: 'flex-end' },
  appVersionTitle: { color: C.text, fontSize: 16, fontWeight: '900' },
  appVersionSub: { color: C.muted, fontSize: 12, marginTop: 4 },
  logoutBtn: { marginTop: 18, minHeight: 56, borderRadius: 22, backgroundColor: '#FFF1F2', flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'center', gap: 8, borderWidth: 1, borderColor: '#FFE4E6' },
  logoutText: { color: C.red, fontSize: 15, fontWeight: '900' },
  bottomNavWrap: { position: 'absolute', left: 0, right: 0, bottom: 0, paddingHorizontal: 14, paddingTop: 8, paddingBottom: Platform.OS === 'ios' ? 20 : 12, backgroundColor: 'rgba(244,247,255,0.92)' },
  bottomNav: { minHeight: 68, borderRadius: 26, backgroundColor: C.surface, flexDirection: 'row-reverse', alignItems: 'center', padding: 7, borderWidth: 1, borderColor: '#EEF2F8', ...shadow(5) },
  navTab: { flex: 1, height: 54, borderRadius: 20, alignItems: 'center', justifyContent: 'center', gap: 3 },
  navTabActive: { backgroundColor: C.primaryLight },
  navLabel: { color: C.muted, fontSize: 10.5, fontWeight: '900', textAlign: 'center' },
  navLabelActive: { color: C.primary },
});
