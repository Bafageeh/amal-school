import React, { useEffect, useState } from 'react';
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
  text: '#0D1117',
  muted: '#6B7280',
  subtle: '#9CA3AF',
  border: '#E8ECF4',
  primary: '#4361EE',
  primaryDark: '#2D46C9',
  primaryLight: '#EEF1FF',
  grad: ['#4361EE', '#2D46C9', '#1A1060'],
  teal: '#0EA5E9',
  tealLight: '#E0F2FE',
  green: '#10B981',
  greenLight: '#D1FAE5',
  gold: '#F59E0B',
  red: '#EF4444',
  redLight: '#FEE2E2',
};

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
      <View style={styles.loadingLogoRing}>
        <Text style={styles.loadingLogoLetter}>أ</Text>
      </View>
      <ActivityIndicator color="rgba(255,255,255,0.85)" size="large" style={{ marginTop: 28 }} />
      <Text style={styles.loadingText}>جاري التحميل...</Text>
    </LinearGradient>
  );
}

function LoginScreen({ onLoggedIn }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [focusedField, setFocusedField] = useState(null);

  async function login() {
    if (!username.trim()) {
      Alert.alert('تنبيه', 'فضلاً أدخلي اسم المستخدم');
      return;
    }

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
          <View style={styles.loginLogoRing}>
            <Text style={styles.loginLogoLetter}>أ</Text>
          </View>
          <Text style={styles.loginAppName}>أمل</Text>
          <Text style={styles.loginTagline}>منصة معايير التقييم وملفات المعلمات</Text>
        </SafeAreaView>
      </LinearGradient>

      <ScrollView style={styles.loginSheet} contentContainerStyle={styles.loginSheetContent} keyboardShouldPersistTaps="handled">
        <Text style={styles.loginWelcome}>مرحباً بكِ</Text>
        <Text style={styles.loginSub}>سجّلي دخولك للمتابعة</Text>

        <View style={[styles.inputRow, focusedField === 'username' && styles.inputRowFocused]}>
          <TextInput
            style={styles.inputField}
            placeholder="اسم المستخدم"
            placeholderTextColor={C.subtle}
            value={username}
            onChangeText={setUsername}
            autoCapitalize="none"
            textAlign="right"
            onFocus={() => setFocusedField('username')}
            onBlur={() => setFocusedField(null)}
          />
          <View style={styles.inputIconWrap}>
            <Ionicons name="person-outline" size={20} color={focusedField === 'username' ? C.primary : C.muted} />
          </View>
        </View>

        <View style={[styles.inputRow, focusedField === 'password' && styles.inputRowFocused]}>
          <TextInput
            style={styles.inputField}
            placeholder="الرقم السري"
            placeholderTextColor={C.subtle}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            keyboardType="number-pad"
            textAlign="right"
            onFocus={() => setFocusedField('password')}
            onBlur={() => setFocusedField(null)}
          />
          <View style={styles.inputIconWrap}>
            <Ionicons name="lock-closed-outline" size={20} color={focusedField === 'password' ? C.primary : C.muted} />
          </View>
        </View>

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
          <View style={styles.loginLogoRing}>
            <Ionicons name="shield-checkmark-outline" size={40} color="#fff" />
          </View>
          <Text style={styles.loginAppName}>اعتماد الحساب</Text>
          <Text style={styles.loginTagline}>أدخلي اسمك والرقم السري الجديد</Text>
        </SafeAreaView>
      </LinearGradient>

      <ScrollView style={styles.loginSheet} contentContainerStyle={styles.loginSheetContent} keyboardShouldPersistTaps="handled">
        <Text style={styles.loginWelcome}>إعداد الحساب</Text>
        <Text style={styles.loginSub}>هذه خطوة واحدة فقط</Text>

        <FormInput icon="person-outline" placeholder="الاسم الكامل" value={name} onChangeText={setName} />
        <FormInput icon="lock-closed-outline" placeholder="رقم سري من 4 خانات" value={password} onChangeText={setPassword} secureTextEntry keyboardType="number-pad" maxLength={4} />
        <FormInput icon="lock-open-outline" placeholder="تأكيد الرقم السري" value={confirm} onChangeText={setConfirm} secureTextEntry keyboardType="number-pad" maxLength={4} />

        <TouchableOpacity style={styles.loginBtn} onPress={submit} disabled={loading} activeOpacity={0.88}>
          <LinearGradient colors={[C.primary, C.primaryDark]} style={styles.loginBtnGrad}>
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.loginBtnText}>حفظ واعتماد</Text>}
          </LinearGradient>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

function FormInput({ icon, ...props }) {
  return (
    <View style={styles.inputRow}>
      <TextInput style={styles.inputField} placeholderTextColor={C.subtle} textAlign="right" {...props} />
      <View style={styles.inputIconWrap}>
        <Ionicons name={icon} size={20} color={C.muted} />
      </View>
    </View>
  );
}

function AppHeader({ user, onLogout }) {
  const initials = user?.name?.charAt(0) || 'م';
  const isPrincipal = user?.is_principal || user?.role === 'principal';

  return (
    <View style={styles.header}>
      <TouchableOpacity onPress={onLogout} style={styles.headerLogoutBtn} activeOpacity={0.75}>
        <Ionicons name="log-out-outline" size={20} color={C.muted} />
      </TouchableOpacity>
      <View style={styles.headerCenter}>
        <Text style={styles.headerSchool} numberOfLines={1}>{user?.school?.name || 'مدرسة'}</Text>
        <Text style={styles.headerName} numberOfLines={1}>{user?.name || ''}</Text>
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
    <TouchableOpacity style={[styles.actionRow, noBorder && { borderBottomWidth: 0 }]} onPress={onPress} activeOpacity={0.8}>
      <Ionicons name="chevron-back" size={16} color={C.border} />
      <View style={styles.actionRowText}>
        <Text style={styles.actionRowTitle}>{title}</Text>
        {subtitle ? <Text style={styles.actionRowSub}>{subtitle}</Text> : null}
      </View>
      <View style={[styles.actionRowIcon, { backgroundColor: `${accent}18` }]}>
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
    <ScrollView contentContainerStyle={styles.screenPad} showsVerticalScrollIndicator={false}>
      <LinearGradient colors={C.grad} style={styles.heroCard}>
        <View style={styles.heroPill}>
          <View style={styles.heroPillDot} />
          <Text style={styles.heroPillText}>{isPrincipal ? 'مديرة المدرسة' : 'معلمة'}</Text>
        </View>
        <Text style={styles.heroGreeting}>مرحباً</Text>
        <Text style={styles.heroName}>{user?.name}</Text>
        <Text style={styles.heroDesc}>{isPrincipal ? 'إدارة معايير التقييم وملفات المعلمات' : 'رفع ومتابعة ملفات معايير التقييم الخاصة بك'}</Text>
      </LinearGradient>

      <View style={styles.statsRow}>
        {isPrincipal ? <StatCard label="المعلمات" value={String(stats.teachers_count ?? 0)} icon="people" bg={C.primaryLight} color={C.primary} /> : null}
        <StatCard label="المعايير" value={String(stats.evidence_count ?? 0)} icon="checkmark-circle" bg={C.tealLight} color={C.teal} />
        <StatCard label="الملفات" value={String(stats.uploads_count ?? 0)} icon="folder" bg={C.greenLight} color={C.green} />
      </View>

      <Text style={styles.sectionLabel}>اختصارات سريعة</Text>
      <View style={styles.listCard}>
        <ActionRow icon="checkmark-done-circle-outline" title="معايير التقييم" subtitle="عرض ورفع الملفات" accent={C.teal} onPress={() => setTab('evidence')} />
        {isPrincipal ? <ActionRow icon="settings-outline" title="الإعدادات" subtitle="إدارة ومتابعة الحساب" accent={C.gold} onPress={() => setTab('settings')} noBorder /> : null}
      </View>

      {latestUploads.length ? (
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
                <View style={styles.uploadRowIcon}>
                  <Ionicons name="document-attach-outline" size={17} color={C.green} />
                </View>
              </View>
            ))}
          </View>
        </>
      ) : null}

      <View style={{ height: 24 }} />
    </ScrollView>
  );
}

function EvidenceScreen({ evidence, onSelectEvidence }) {
  return (
    <ScrollView contentContainerStyle={styles.screenPad} showsVerticalScrollIndicator={false}>
      <Text style={styles.pageTitle}>معايير التقييم</Text>
      <Text style={styles.pageSubtitle}>اختاري معيارًا لعرض ملفاته أو رفع ملفات جديدة</Text>

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

function SettingsScreen({ user, onLogout }) {
  const isPrincipal = user?.is_principal || user?.role === 'principal';
  const initials = user?.name?.charAt(0) || 'م';

  return (
    <ScrollView contentContainerStyle={styles.screenPad} showsVerticalScrollIndicator={false}>
      <LinearGradient colors={C.grad} style={styles.profileCard}>
        <View style={styles.profileAvatarRow}>
          <View style={styles.profileAvatarWrap}>
            <View style={styles.profileAvatarInner}>
              <Text style={styles.profileAvatarLetter}>{initials}</Text>
            </View>
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
            <ActionRow icon="people-outline" title="المعلمات" subtitle="إضافة وتعديل وحذف حسابات المعلمات" accent={C.primary} />
            <ActionRow icon="folder-open-outline" title="متابعة ملفات المعلمات" subtitle="استعراض ملفات كل معلمة حسب المعيار" accent={C.gold} noBorder />
          </View>
          <Text style={styles.settingsSectionLabel}>التقارير</Text>
          <View style={styles.listCard}>
            <ActionRow icon="stats-chart-outline" title="إحصائيات الرفع" subtitle="نسبة اكتمال ملفات كل معلمة" accent={C.teal} />
            <ActionRow icon="ribbon-outline" title="المعايير المكتملة" subtitle="المعايير التي اكتملت ملفاتها" accent={C.green} noBorder />
          </View>
        </>
      ) : (
        <>
          <Text style={styles.settingsSectionLabel}>حسابي</Text>
          <View style={styles.listCard}>
            <ActionRow icon="person-outline" title="بياناتي الشخصية" subtitle="الاسم واسم المستخدم" accent={C.primary} />
            <ActionRow icon="folder-outline" title="ملفاتي المرفوعة" subtitle="جميع الملفات التي رفعتِها" accent={C.teal} noBorder />
          </View>
        </>
      )}

      <Text style={styles.settingsSectionLabel}>عام</Text>
      <View style={styles.listCard}>
        <ActionRow icon="help-circle-outline" title="الدعم والمساعدة" subtitle="تواصلي مع فريق الدعم" accent={C.muted} />
        <View style={styles.appVersionRow}>
          <Text style={styles.appVersionValue}>1.0.0</Text>
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
  const tabs = [
    { id: 'home', icon: 'home', iconOff: 'home-outline', label: 'الرئيسية' },
    { id: 'evidence', icon: 'checkmark-done-circle', iconOff: 'checkmark-done-circle-outline', label: 'المعايير' },
    ...(isPrincipal ? [{ id: 'settings', icon: 'settings', iconOff: 'settings-outline', label: 'إعدادات' }] : []),
  ];

  return (
    <View style={styles.bottomNavWrap}>
      <View style={styles.bottomNav}>
        {tabs.map((t) => {
          const active = tab === t.id;
          return (
            <TouchableOpacity key={t.id} style={[styles.navTab, active && styles.navTabActive]} onPress={() => setTab(t.id)} activeOpacity={0.8}>
              <Ionicons name={active ? t.icon : t.iconOff} size={22} color={active ? C.primary : C.muted} />
              <Text style={[styles.navLabel, active && styles.navLabelActive]}>{t.label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

function MainApp({ token, user, setUser, onLogout }) {
  const [tab, setTab] = useState('home');
  const [loading, setLoading] = useState(true);
  const [dashboard, setDashboard] = useState(null);
  const [evidence, setEvidence] = useState([]);
  const [selectedEvidence, setSelectedEvidence] = useState(null);

  useEffect(() => {
    let mounted = true;

    async function loadData() {
      setLoading(true);
      try {
        const [me, dash, ev] = await Promise.all([
          requestJson('/me', { token }),
          requestJson('/dashboard', { token }),
          requestJson('/evidence', { token }),
        ]);

        if (!mounted) return;
        setUser(me.user);
        setDashboard(dash);
        setEvidence(ev.items || []);
      } catch (error) {
        if (mounted) Alert.alert('تعذر تحميل البيانات', error.message);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    loadData();
    return () => { mounted = false; };
  }, [token, setUser]);

  const isPrincipal = user?.is_principal || user?.role === 'principal';

  if (loading) {
    return <LoadingScreen />;
  }

  if (selectedEvidence) {
    return (
      <SafeAreaView style={styles.fill}>
        <StatusBar barStyle="dark-content" backgroundColor={C.bg} />
        <EvidenceDetailScreen token={token} evidence={selectedEvidence} onBack={() => setSelectedEvidence(null)} />
      </SafeAreaView>
    );
  }

  let screen = <HomeScreen user={user} dashboard={dashboard} setTab={setTab} />;
  if (tab === 'evidence') screen = <EvidenceScreen evidence={evidence} onSelectEvidence={setSelectedEvidence} />;
  if (tab === 'settings') screen = <SettingsScreen user={user} onLogout={onLogout} />;

  return (
    <View style={[styles.fill, { backgroundColor: C.bg }]}> 
      <StatusBar barStyle="dark-content" backgroundColor={C.surface} />
      <SafeAreaView style={styles.fill}>
        <AppHeader user={user} onLogout={onLogout} />
        <View style={styles.fill}>{screen}</View>
        <BottomNav tab={tab} setTab={setTab} isPrincipal={isPrincipal} />
      </SafeAreaView>
    </View>
  );
}

export default function App() {
  const [booting, setBooting] = useState(true);
  const [token, setToken] = useState(null);
  const [user, setUser] = useState(null);
  const [needsSetup, setNeedsSetup] = useState(false);

  useEffect(() => {
    let mounted = true;

    async function boot() {
      const storedToken = await SecureStore.getItemAsync(TOKEN_KEY);
      if (storedToken) {
        try {
          const me = await requestJson('/me', { token: storedToken });
          if (!mounted) return;
          setToken(storedToken);
          setUser(me.user);
          setNeedsSetup(me.user?.requires_password_setup || false);
        } catch {
          await SecureStore.deleteItemAsync(TOKEN_KEY);
        }
      }
      if (mounted) setBooting(false);
    }

    boot();
    return () => { mounted = false; };
  }, []);

  async function logout() {
    if (token) requestJson('/logout', { method: 'POST', token }).catch(() => {});
    await SecureStore.deleteItemAsync(TOKEN_KEY);
    setToken(null);
    setUser(null);
    setNeedsSetup(false);
  }

  if (booting) return <LoadingScreen />;
  if (!token) return <LoginScreen onLoggedIn={(t, u, s) => { setToken(t); setUser(u); setNeedsSetup(s); }} />;
  if (needsSetup) return <SetupPasswordScreen token={token} user={user} onDone={(u) => { setUser(u); setNeedsSetup(false); }} />;
  return <MainApp token={token} user={user} setUser={setUser} onLogout={logout} />;
}

const shadow = (depth = 2) => Platform.select({
  ios: { shadowColor: '#1A1060', shadowOffset: { width: 0, height: depth }, shadowOpacity: 0.08, shadowRadius: depth * 4 },
  android: { elevation: depth + 1 },
  default: {},
});

const styles = StyleSheet.create({
  fill: { flex: 1 },
  center: { alignItems: 'center', justifyContent: 'center' },

  loadingLogoRing: { width: 96, height: 96, borderRadius: 48, backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: 'rgba(255,255,255,0.25)' },
  loadingLogoLetter: { color: '#fff', fontSize: 44, fontWeight: '900' },
  loadingText: { color: 'rgba(255,255,255,0.75)', fontSize: 15, fontWeight: '700', marginTop: 14, textAlign: 'center' },

  loginTop: { paddingBottom: 56 },
  loginTopInner: { alignItems: 'center', paddingTop: 56, paddingBottom: 10, gap: 14 },
  loginLogoRing: { width: 96, height: 96, borderRadius: 48, backgroundColor: 'rgba(255,255,255,0.18)', alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: 'rgba(255,255,255,0.28)' },
  loginLogoLetter: { color: '#fff', fontSize: 44, fontWeight: '900' },
  loginAppName: { color: '#fff', fontSize: 28, fontWeight: '900' },
  loginTagline: { color: 'rgba(255,255,255,0.68)', fontSize: 13, textAlign: 'center', paddingHorizontal: 36 },
  loginSheet: { flex: 1, backgroundColor: C.surface, borderTopLeftRadius: 36, borderTopRightRadius: 36, marginTop: -36 },
  loginSheetContent: { padding: 28, paddingTop: 38 },
  loginWelcome: { color: C.text, fontSize: 26, fontWeight: '900', textAlign: 'right', marginBottom: 4 },
  loginSub: { color: C.muted, fontSize: 14, textAlign: 'right', marginBottom: 28 },
  inputRow: { minHeight: 56, borderRadius: 17, backgroundColor: C.bg, borderWidth: 1.5, borderColor: C.border, flexDirection: 'row-reverse', alignItems: 'center', paddingHorizontal: 14, marginBottom: 12 },
  inputRowFocused: { borderColor: C.primary, backgroundColor: C.surface },
  inputField: { flex: 1, color: C.text, fontSize: 16, paddingVertical: 12 },
  inputIconWrap: { width: 36, alignItems: 'center', justifyContent: 'center' },
  loginBtn: { marginTop: 10, borderRadius: 18, overflow: 'hidden' },
  loginBtnGrad: { minHeight: 58, alignItems: 'center', justifyContent: 'center' },
  loginBtnText: { color: '#fff', fontSize: 17, fontWeight: '900' },

  header: { backgroundColor: C.surface, paddingHorizontal: 18, paddingVertical: 12, flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: C.border },
  headerLogoutBtn: { width: 40, height: 40, borderRadius: 14, backgroundColor: C.bg, alignItems: 'center', justifyContent: 'center' },
  headerCenter: { flex: 1, alignItems: 'flex-end', paddingHorizontal: 12 },
  headerSchool: { color: C.muted, fontSize: 12, fontWeight: '700' },
  headerName: { color: C.text, fontSize: 16, fontWeight: '900', marginTop: 2 },
  headerAvatarWrap: { position: 'relative' },
  headerAvatar: { width: 44, height: 44, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  headerAvatarText: { color: '#fff', fontSize: 20, fontWeight: '900' },
  headerRoleDot: { position: 'absolute', bottom: -2, right: -2, width: 13, height: 13, borderRadius: 7, borderWidth: 2, borderColor: C.surface },

  screenPad: { padding: 18, paddingBottom: 100 },
  heroCard: { borderRadius: 28, padding: 22, marginBottom: 18, minHeight: 170, overflow: 'hidden', ...shadow(4) },
  heroPill: { alignSelf: 'flex-end', flexDirection: 'row-reverse', alignItems: 'center', gap: 6, backgroundColor: 'rgba(255,255,255,0.13)', paddingHorizontal: 11, paddingVertical: 6, borderRadius: 99, marginBottom: 22 },
  heroPillDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: C.green },
  heroPillText: { color: 'rgba(255,255,255,0.82)', fontSize: 12, fontWeight: '800' },
  heroGreeting: { color: 'rgba(255,255,255,0.7)', fontSize: 15, fontWeight: '700', textAlign: 'right' },
  heroName: { color: '#fff', fontSize: 26, fontWeight: '900', textAlign: 'right', marginTop: 4 },
  heroDesc: { color: 'rgba(255,255,255,0.66)', fontSize: 14, textAlign: 'right', lineHeight: 22, marginTop: 8 },
  statsRow: { flexDirection: 'row-reverse', gap: 10, marginBottom: 18 },
  statCard: { flex: 1, backgroundColor: C.surface, borderRadius: 18, padding: 14, alignItems: 'center', ...shadow(2) },
  statIconBg: { width: 38, height: 38, borderRadius: 13, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  statValue: { color: C.text, fontSize: 22, fontWeight: '900' },
  statLabel: { color: C.muted, fontSize: 12, fontWeight: '700', marginTop: 2 },
  sectionLabel: { color: C.text, fontSize: 17, fontWeight: '900', textAlign: 'right', marginBottom: 10, marginTop: 2 },
  listCard: { backgroundColor: C.surface, borderRadius: 20, overflow: 'hidden', marginBottom: 18, ...shadow(2) },
  actionRow: { minHeight: 66, flexDirection: 'row', alignItems: 'center', padding: 14, borderBottomWidth: 1, borderBottomColor: C.border },
  actionRowText: { flex: 1, alignItems: 'flex-end', paddingHorizontal: 12 },
  actionRowTitle: { color: C.text, fontSize: 15, fontWeight: '900', textAlign: 'right' },
  actionRowSub: { color: C.muted, fontSize: 12, fontWeight: '600', textAlign: 'right', marginTop: 3 },
  actionRowIcon: { width: 42, height: 42, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  uploadRow: { flexDirection: 'row', alignItems: 'center', minHeight: 62, padding: 14, borderBottomWidth: 1, borderBottomColor: C.border },
  uploadRowDate: { color: C.subtle, fontSize: 11 },
  uploadRowText: { flex: 1, alignItems: 'flex-end', paddingHorizontal: 12 },
  uploadRowTitle: { color: C.text, fontSize: 14, fontWeight: '800', textAlign: 'right' },
  uploadRowSub: { color: C.muted, fontSize: 12, marginTop: 2, textAlign: 'right' },
  uploadRowIcon: { width: 36, height: 36, borderRadius: 12, backgroundColor: C.greenLight, alignItems: 'center', justifyContent: 'center' },

  pageTitle: { color: C.text, fontSize: 24, fontWeight: '900', textAlign: 'right', marginBottom: 6 },
  pageSubtitle: { color: C.muted, fontSize: 14, textAlign: 'right', marginBottom: 18 },
  evidenceCard: { backgroundColor: C.surface, borderRadius: 24, padding: 18, marginBottom: 12, ...shadow(2) },
  evidenceCardTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 },
  evidenceBadge: { flexDirection: 'row-reverse', alignItems: 'center', gap: 5, backgroundColor: C.primaryLight, borderRadius: 99, paddingHorizontal: 9, paddingVertical: 5 },
  evidenceBadgeText: { color: C.primary, fontSize: 12, fontWeight: '800' },
  evidenceIconWrap: { alignItems: 'center', justifyContent: 'center' },
  evidenceIcon: { width: 42, height: 42, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
  evidenceTitle: { color: C.text, fontSize: 17, fontWeight: '900', textAlign: 'right', marginBottom: 5 },
  evidenceDesc: { color: C.muted, fontSize: 13, textAlign: 'right', lineHeight: 20 },
  evidenceCardFooter: { marginTop: 14, alignItems: 'flex-start' },
  evidenceOpenBtn: { flexDirection: 'row-reverse', alignItems: 'center', gap: 6, backgroundColor: C.primaryLight, borderRadius: 99, paddingHorizontal: 12, paddingVertical: 8 },
  evidenceOpenText: { color: C.primary, fontSize: 13, fontWeight: '900' },

  profileCard: { borderRadius: 28, padding: 20, marginBottom: 18, ...shadow(4) },
  profileAvatarRow: { flexDirection: 'row-reverse', alignItems: 'center' },
  profileAvatarWrap: { position: 'relative' },
  profileAvatarInner: { width: 68, height: 68, borderRadius: 24, backgroundColor: 'rgba(255,255,255,0.18)', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.25)' },
  profileAvatarLetter: { color: '#fff', fontSize: 30, fontWeight: '900' },
  profileRoleDot: { position: 'absolute', bottom: -2, right: -2, width: 16, height: 16, borderRadius: 8, borderWidth: 2, borderColor: '#fff' },
  profileInfo: { flex: 1, alignItems: 'flex-end', marginRight: 14 },
  profileName: { color: '#fff', fontSize: 20, fontWeight: '900', textAlign: 'right' },
  profileRolePill: { flexDirection: 'row-reverse', alignItems: 'center', gap: 6, backgroundColor: 'rgba(255,255,255,0.13)', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 99, marginTop: 8 },
  profileRolePillDot: { width: 7, height: 7, borderRadius: 4 },
  profileRoleText: { color: 'rgba(255,255,255,0.82)', fontSize: 12, fontWeight: '800' },
  profileDivider: { height: 1, backgroundColor: 'rgba(255,255,255,0.12)', marginVertical: 16 },
  profileSchoolRow: { flexDirection: 'row-reverse', alignItems: 'center', gap: 8 },
  profileSchoolName: { color: 'rgba(255,255,255,0.75)', fontSize: 13, fontWeight: '700' },
  settingsSectionLabel: { color: C.text, fontSize: 16, fontWeight: '900', textAlign: 'right', marginBottom: 10 },
  appVersionRow: { minHeight: 64, flexDirection: 'row', alignItems: 'center', padding: 14 },
  appVersionValue: { color: C.subtle, fontSize: 12, fontWeight: '800' },
  appVersionText: { flex: 1, alignItems: 'flex-end', paddingHorizontal: 12 },
  appVersionTitle: { color: C.text, fontSize: 15, fontWeight: '900', textAlign: 'right' },
  appVersionSub: { color: C.muted, fontSize: 12, marginTop: 2, textAlign: 'right' },
  logoutBtn: { minHeight: 54, borderRadius: 18, backgroundColor: C.redLight, flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 4 },
  logoutText: { color: C.red, fontSize: 15, fontWeight: '900' },

  bottomNavWrap: { backgroundColor: 'transparent', paddingHorizontal: 18, paddingBottom: Platform.OS === 'ios' ? 20 : 12, paddingTop: 8 },
  bottomNav: { backgroundColor: C.surface, borderRadius: 24, padding: 8, flexDirection: 'row-reverse', ...shadow(6) },
  navTab: { flex: 1, alignItems: 'center', justifyContent: 'center', minHeight: 56, borderRadius: 18 },
  navTabActive: { backgroundColor: C.primaryLight },
  navLabel: { color: C.muted, fontSize: 11, fontWeight: '800', marginTop: 4 },
  navLabelActive: { color: C.primary },
});
