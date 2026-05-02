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

// ─── Design Tokens ───────────────────────────────────────────────────────────
const C = {
  bg:           '#F4F7FF',
  surface:      '#FFFFFF',
  text:         '#0D1117',
  muted:        '#6B7280',
  subtle:       '#9CA3AF',
  border:       '#E8ECF4',

  primary:      '#4361EE',
  primaryDark:  '#2D46C9',
  primaryLight: '#EEF1FF',
  grad:         ['#4361EE', '#2D46C9', '#1A1060'],

  teal:         '#0EA5E9',
  tealLight:    '#E0F2FE',
  green:        '#10B981',
  greenLight:   '#D1FAE5',
  gold:         '#F59E0B',
  goldLight:    '#FEF3C7',
  red:          '#EF4444',
};

// ─── API Helper ───────────────────────────────────────────────────────────────
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

// ─── Loading ──────────────────────────────────────────────────────────────────
function LoadingScreen() {
  return (
    <LinearGradient colors={C.grad} style={styles.fill}>
      <StatusBar barStyle="light-content" />
      <View style={styles.loadingLogoWrap}>
        <View style={styles.loadingLogoRing}>
          <Text style={styles.loadingLogoLetter}>أ</Text>
        </View>
      </View>
      <ActivityIndicator color="rgba(255,255,255,0.8)" size="large" style={{ marginTop: 32 }} />
      <Text style={styles.loadingText}>جاري التحميل...</Text>
    </LinearGradient>
  );
}

// ─── Login ────────────────────────────────────────────────────────────────────
function LoginScreen({ onLoggedIn }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [focusedField, setFocusedField] = useState(null);

  async function login() {
    if (!username.trim()) return Alert.alert('تنبيه', 'فضلاً أدخلي اسم المستخدم');
    setLoading(true);
    try {
      const data = await requestJson('/login', { method: 'POST', body: { username: username.trim(), password } });
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
      {/* Top gradient section */}
      <LinearGradient colors={C.grad} style={styles.loginTop}>
        <SafeAreaView style={styles.loginTopInner}>
          <View style={styles.loginLogoRing}>
            <Text style={styles.loginLogoLetter}>أ</Text>
          </View>
          <Text style={styles.loginAppName}>أمل</Text>
          <Text style={styles.loginTagline}>منصة معايير التقييم وملفات المعلمات</Text>
        </SafeAreaView>
      </LinearGradient>

      {/* Bottom card */}
      <ScrollView
        style={styles.loginSheet}
        contentContainerStyle={styles.loginSheetContent}
        keyboardShouldPersistTaps="handled"
      >
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
            {loading
              ? <ActivityIndicator color="#fff" />
              : <Text style={styles.loginBtnText}>دخول</Text>}
          </LinearGradient>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

// ─── Setup Password ───────────────────────────────────────────────────────────
function SetupPasswordScreen({ token, user, onDone }) {
  const [name, setName] = useState(user?.name || '');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);

  async function submit() {
    setLoading(true);
    try {
      const data = await requestJson('/setup-password', {
        method: 'POST', token,
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
          <View style={[styles.loginLogoRing, { backgroundColor: 'rgba(255,255,255,0.15)' }]}>
            <Ionicons name="shield-checkmark-outline" size={40} color="#fff" />
          </View>
          <Text style={styles.loginAppName}>اعتماد الحساب</Text>
          <Text style={styles.loginTagline}>أدخلي اسمك والرقم السري الجديد</Text>
        </SafeAreaView>
      </LinearGradient>

      <ScrollView style={styles.loginSheet} contentContainerStyle={styles.loginSheetContent} keyboardShouldPersistTaps="handled">
        <Text style={styles.loginWelcome}>إعداد الحساب</Text>
        <Text style={styles.loginSub}>هذه خطوة واحدة فقط</Text>

        {[
          { key: 'name', placeholder: 'الاسم الكامل', value: name, onChange: setName, icon: 'person-outline', keyboard: 'default', secure: false, max: null },
          { key: 'pass', placeholder: 'رقم سري من 4 خانات', value: password, onChange: setPassword, icon: 'lock-closed-outline', keyboard: 'number-pad', secure: true, max: 4 },
          { key: 'conf', placeholder: 'تأكيد الرقم السري', value: confirm, onChange: setConfirm, icon: 'lock-open-outline', keyboard: 'number-pad', secure: true, max: 4 },
        ].map((f) => (
          <View key={f.key} style={styles.inputRow}>
            <TextInput
              style={styles.inputField}
              placeholder={f.placeholder}
              placeholderTextColor={C.subtle}
              value={f.value}
              onChangeText={f.onChange}
              keyboardType={f.keyboard}
              secureTextEntry={f.secure}
              maxLength={f.max || undefined}
              textAlign="right"
            />
            <View style={styles.inputIconWrap}>
              <Ionicons name={f.icon} size={20} color={C.muted} />
            </View>
          </View>
        ))}

        <TouchableOpacity style={styles.loginBtn} onPress={submit} disabled={loading} activeOpacity={0.88}>
          <LinearGradient colors={[C.primary, C.primaryDark]} style={styles.loginBtnGrad}>
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.loginBtnText}>حفظ واعتماد</Text>}
          </LinearGradient>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

// ─── App Header ───────────────────────────────────────────────────────────────
function AppHeader({ user, onLogout }) {
  const initials = user?.name?.charAt(0) || 'م';
  const isPrincipal = user?.role === 'principal' || user?.is_principal;

  return (
    <View style={styles.header}>
      <TouchableOpacity onPress={onLogout} style={styles.headerLogoutBtn} activeOpacity={0.75}>
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

// ─── Stat Card ────────────────────────────────────────────────────────────────
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

// ─── Action Row ───────────────────────────────────────────────────────────────
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

// ─── Home Screen ──────────────────────────────────────────────────────────────
function HomeScreen({ user, dashboard, setTab }) {
  const stats = dashboard?.stats || {};
  const isPrincipal = user?.is_principal;
  const latestUploads = (dashboard?.latest_uploads || []).slice(0, 4);

  return (
    <ScrollView contentContainerStyle={styles.screenPad} showsVerticalScrollIndicator={false}>

      {/* Hero card */}
      <LinearGradient colors={C.grad} style={styles.heroCard}>
        <View style={styles.heroDecor1} />
        <View style={styles.heroDecor2} />
        <View style={styles.heroPill}>
          <View style={styles.heroPillDot} />
          <Text style={styles.heroPillText}>{isPrincipal ? 'مديرة المدرسة' : 'معلمة'}</Text>
        </View>
        <Text style={styles.heroGreeting}>مرحباً</Text>
        <Text style={styles.heroName}>{user?.name}</Text>
        <Text style={styles.heroDesc}>
          {isPrincipal
            ? 'إدارة معايير التقييم وملفات المعلمات'
            : 'رفع ومتابعة ملفات معايير التقييم الخاصة بك'}
        </Text>
      </LinearGradient>

      {/* Stats */}
      <View style={styles.statsRow}>
        {isPrincipal && (
          <StatCard label="المعلمات" value={String(stats.teachers_count ?? 0)} icon="people" bg={C.primaryLight} color={C.primary} />
        )}
        <StatCard label="المعايير" value={String(stats.evidence_count ?? 0)} icon="checkmark-circle" bg={C.tealLight} color={C.teal} />
        <StatCard label="الملفات" value={String(stats.uploads_count ?? 0)} icon="folder" bg={C.greenLight} color={C.green} />
      </View>

      {/* Quick actions */}
      <Text style={styles.sectionLabel}>اختصارات سريعة</Text>
      <View style={styles.listCard}>
        <ActionRow icon="checkmark-done-circle-outline" title="معايير التقييم" subtitle="عرض ورفع الملفات" accent={C.teal} onPress={() => setTab('evidence')} />
        {isPrincipal && (
          <ActionRow icon="settings-outline" title="الإعدادات" subtitle="إدارة المعلمات" accent={C.gold} onPress={() => setTab('settings')} noBorder />
        )}
      </View>

      {/* Latest uploads */}
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
                <View style={styles.uploadRowIcon}>
                  <Ionicons name="document-attach-outline" size={17} color={C.green} />
                </View>
              </View>
            ))}
          </View>
        </>
      )}

      <View style={{ height: 24 }} />
    </ScrollView>
  );
}

// ─── Evidence Screen ──────────────────────────────────────────────────────────
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
          {item.description ? (
            <Text style={styles.evidenceDesc} numberOfLines={2}>{item.description}</Text>
          ) : null}

          <View style={styles.evidenceCardFooter}>
            <View style={styles.evidenceOpenBtn}>
              <Text style={styles.evidenceOpenText}>فتح المعيار</Text>
              <Ionicons name="arrow-back-outline" size={15} color={C.primary} />
            </View>
            <View style={styles.evidenceProgressBar}>
              <View style={[styles.evidenceProgressFill, { width: `${Math.min((item.uploads_count ?? 0) * 25, 100)}%` }]} />
            </View>
          </View>
        </TouchableOpacity>
      ))}

      <View style={{ height: 24 }} />
    </ScrollView>
  );
}

// ─── Settings Screen ──────────────────────────────────────────────────────────
function SettingsScreen({ user, onLogout }) {
  const isPrincipal = user?.is_principal;
  const initials = user?.name?.charAt(0) || 'م';

  return (
    <ScrollView contentContainerStyle={styles.screenPad} showsVerticalScrollIndicator={false}>

      {/* Profile card */}
      <LinearGradient colors={C.grad} style={styles.profileCard}>
        <View style={styles.profileCardDecor1} />
        <View style={styles.profileCardDecor2} />
        <View style={styles.profileAvatarRow}>
          <View style={styles.profileAvatarWrap}>
            <View style={styles.profileAvatarRing}>
              <View style={styles.profileAvatarInner}>
                <Text style={styles.profileAvatarLetter}>{initials}</Text>
              </View>
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

      {/* Principal sections */}
      {isPrincipal && (
        <>
          <Text style={styles.settingsSectionLabel}>إدارة المدرسة</Text>
          <View style={styles.listCard}>
            <ActionRow
              icon="people-outline"
              title="المعلمات"
              subtitle="إضافة وتعديل وحذف حسابات المعلمات"
              accent={C.primary}
            />
            <ActionRow
              icon="folder-open-outline"
              title="متابعة ملفات المعلمات"
              subtitle="استعراض ملفات كل معلمة حسب المعيار"
              accent={C.gold}
              noBorder
            />
          </View>

          <Text style={styles.settingsSectionLabel}>التقارير</Text>
          <View style={styles.listCard}>
            <ActionRow
              icon="stats-chart-outline"
              title="إحصائيات الرفع"
              subtitle="نسبة اكتمال ملفات كل معلمة"
              accent={C.teal}
            />
            <ActionRow
              icon="ribbon-outline"
              title="المعايير المكتملة"
              subtitle="المعايير التي اكتملت ملفاتها"
              accent={C.green}
              noBorder
            />
          </View>
        </>
      )}

      {/* Teacher sections */}
      {!isPrincipal && (
        <>
          <Text style={styles.settingsSectionLabel}>حسابي</Text>
          <View style={styles.listCard}>
            <ActionRow
              icon="person-outline"
              title="بياناتي الشخصية"
              subtitle="الاسم واسم المستخدم"
              accent={C.primary}
            />
            <ActionRow
              icon="folder-outline"
              title="ملفاتي المرفوعة"
              subtitle="جميع الملفات التي رفعتِها"
              accent={C.teal}
              noBorder
            />
          </View>
        </>
      )}

      {/* General */}
      <Text style={styles.settingsSectionLabel}>عام</Text>
      <View style={styles.listCard}>
        <ActionRow
          icon="help-circle-outline"
          title="الدعم والمساعدة"
          subtitle="تواصلي مع فريق الدعم"
          accent={C.muted}
        />
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

      {/* Logout */}
      <TouchableOpacity style={styles.logoutBtn} onPress={onLogout} activeOpacity={0.85}>
        <Ionicons name="log-out-outline" size={20} color={C.red} />
        <Text style={styles.logoutText}>تسجيل الخروج</Text>
      </TouchableOpacity>

      <View style={{ height: 32 }} />
    </ScrollView>
  );
}

// ─── Bottom Navigation ────────────────────────────────────────────────────────
function BottomNav({ tab, setTab, isPrincipal }) {
  const tabs = [
    { id: 'home',     icon: 'home',                 iconOff: 'home-outline',                 label: 'الرئيسية' },
    { id: 'evidence', icon: 'checkmark-done-circle', iconOff: 'checkmark-done-circle-outline', label: 'المعايير'  },
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

// ─── Main App ─────────────────────────────────────────────────────────────────
function MainApp({ token, user, setUser, onLogout }) {
  const [tab, setTab] = useState('home');
  const [loading, setLoading] = useState(true);
  const [dashboard, setDashboard] = useState(null);
  const [evidence, setEvidence] = useState([]);
  const [selectedEvidence, setSelectedEvidence] = useState(null);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const [me, dash, ev] = await Promise.all([
          requestJson('/me', { token }),
          requestJson('/dashboard', { token }),
          requestJson('/evidence', { token }),
        ]);
        setUser(me.user);
        setDashboard(dash);
        setEvidence(ev.items || []);
      } catch (error) {
        Alert.alert('تعذر تحميل البيانات', error.message);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const isPrincipal = user?.is_principal || user?.role === 'principal';

  // When an evidence item is selected, show detail screen (full screen, no bottom nav)
  if (!loading && selectedEvidence) {
    return (
      <SafeAreaView style={styles.fill}>
        <StatusBar barStyle="dark-content" backgroundColor={C.bg} />
        <EvidenceDetailScreen
          token={token}
          evidence={selectedEvidence}
          onBack={() => setSelectedEvidence(null)}
        />
      </SafeAreaView>
    );
  }

  const screen = useMemo(() => {
    if (loading) return <LoadingScreen />;
    if (tab === 'evidence') return <EvidenceScreen evidence={evidence} onSelectEvidence={setSelectedEvidence} />;
    if (tab === 'settings') return <SettingsScreen user={user} onLogout={onLogout} />;
    return <HomeScreen user={user} dashboard={dashboard} setTab={setTab} />;
  }, [tab, loading, dashboard, evidence, user]);

  return (
    <View style={[styles.fill, { backgroundColor: C.bg }]}>
      <StatusBar barStyle="dark-content" backgroundColor={C.surface} />
      <SafeAreaView style={styles.fill}>
        {!loading && <AppHeader user={user} onLogout={onLogout} />}
        <View style={styles.fill}>{screen}</View>
        {!loading && <BottomNav tab={tab} setTab={setTab} isPrincipal={isPrincipal} />}
      </SafeAreaView>
    </View>
  );
}

// ─── Root ─────────────────────────────────────────────────────────────────────
export default function App() {
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
  if (!token) return <LoginScreen onLoggedIn={(t, u, s) => { setToken(t); setUser(u); setNeedsSetup(s); }} />;
  if (needsSetup) return <SetupPasswordScreen token={token} user={user} onDone={(u) => { setUser(u); setNeedsSetup(false); }} />;
  return <MainApp token={token} user={user} setUser={setUser} onLogout={logout} />;
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const shadow = (depth = 2) => Platform.select({
  ios:     { shadowColor: '#1A1060', shadowOffset: { width: 0, height: depth }, shadowOpacity: 0.08, shadowRadius: depth * 4 },
  android: { elevation: depth + 1 },
});

const styles = StyleSheet.create({
  fill: { flex: 1 },

  // Loading
  loadingLogoWrap: { alignItems: 'center' },
  loadingLogoRing: { width: 96, height: 96, borderRadius: 48, backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: 'rgba(255,255,255,0.25)' },
  loadingLogoLetter: { color: '#fff', fontSize: 44, fontWeight: '900' },
  loadingText: { color: 'rgba(255,255,255,0.7)', fontSize: 15, fontWeight: '700', marginTop: 14, textAlign: 'center' },

  // Login
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
  inputRow: { flexDirection: 'row-reverse', alignItems: 'center', backgroundColor: C.bg, borderRadius: 16, borderWidth: 1.5, borderColor: C.border, marginBottom: 14, paddingHorizontal: 14, minHeight: 56 },
  inputRowFocused: { borderColor: C.primary, backgroundColor: C.primaryLight },
  inputIconWrap: { marginLeft: 10 },
  inputField: { flex: 1, fontSize: 15, color: C.text, textAlign: 'right' },
  loginBtn: { marginTop: 8, borderRadius: 18, overflow: 'hidden' },
  loginBtnGrad: { minHeight: 56, alignItems: 'center', justifyContent: 'center' },
  loginBtnText: { color: '#fff', fontSize: 17, fontWeight: '900' },

  // Header
  header: { flexDirection: 'row-reverse', alignItems: 'center', paddingHorizontal: 18, paddingVertical: 12, backgroundColor: C.surface, borderBottomWidth: 1, borderBottomColor: C.border },
  headerLogoutBtn: { width: 38, height: 38, borderRadius: 13, backgroundColor: C.bg, alignItems: 'center', justifyContent: 'center' },
  headerCenter: { flex: 1, alignItems: 'center' },
  headerSchool: { color: C.text, fontSize: 14, fontWeight: '800', textAlign: 'center' },
  headerName: { color: C.muted, fontSize: 11, textAlign: 'center', marginTop: 1 },
  headerAvatarWrap: { position: 'relative' },
  headerAvatar: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center' },
  headerAvatarText: { color: '#fff', fontSize: 16, fontWeight: '900' },
  headerRoleDot: { position: 'absolute', bottom: 0, left: 0, width: 11, height: 11, borderRadius: 6, borderWidth: 2, borderColor: C.surface },

  // Screens
  screenPad: { padding: 18, paddingTop: 22 },

  // Hero
  heroCard: { borderRadius: 28, padding: 22, marginBottom: 20, minHeight: 200, overflow: 'hidden', position: 'relative' },
  heroDecor1: { position: 'absolute', width: 180, height: 180, borderRadius: 90, backgroundColor: 'rgba(255,255,255,0.055)', top: -50, left: -40 },
  heroDecor2: { position: 'absolute', width: 110, height: 110, borderRadius: 55, backgroundColor: 'rgba(255,255,255,0.07)', bottom: -20, right: 16 },
  heroPill: { flexDirection: 'row-reverse', alignItems: 'center', gap: 6, alignSelf: 'flex-end', backgroundColor: 'rgba(255,255,255,0.15)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 99, marginBottom: 20 },
  heroPillDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: C.green },
  heroPillText: { color: 'rgba(255,255,255,0.88)', fontSize: 12, fontWeight: '700' },
  heroGreeting: { color: 'rgba(255,255,255,0.65)', fontSize: 14, textAlign: 'right' },
  heroName: { color: '#fff', fontSize: 28, fontWeight: '900', textAlign: 'right', marginBottom: 8 },
  heroDesc: { color: 'rgba(255,255,255,0.6)', fontSize: 14, textAlign: 'right', lineHeight: 22 },

  // Stats
  statsRow: { flexDirection: 'row-reverse', gap: 10, marginBottom: 22 },
  statCard: { flex: 1, backgroundColor: C.surface, borderRadius: 20, padding: 14, alignItems: 'center', ...shadow(2) },
  statIconBg: { width: 42, height: 42, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginBottom: 10 },
  statValue: { color: C.text, fontSize: 26, fontWeight: '900', textAlign: 'center' },
  statLabel: { color: C.muted, fontSize: 11, textAlign: 'center', marginTop: 2, fontWeight: '600' },

  // List card (grouped rows)
  listCard: { backgroundColor: C.surface, borderRadius: 22, marginBottom: 22, overflow: 'hidden', ...shadow(2) },

  // Section label
  sectionLabel: { color: C.text, fontSize: 16, fontWeight: '900', textAlign: 'right', marginBottom: 10 },

  // Action Row
  actionRow: { flexDirection: 'row-reverse', alignItems: 'center', padding: 16, gap: 12, borderBottomWidth: 1, borderBottomColor: C.border },
  actionRowIcon: { width: 42, height: 42, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  actionRowText: { flex: 1, alignItems: 'flex-end' },
  actionRowTitle: { color: C.text, fontSize: 15, fontWeight: '800', textAlign: 'right' },
  actionRowSub: { color: C.muted, fontSize: 12, textAlign: 'right', marginTop: 3 },

  // Upload row (latest uploads)
  uploadRow: { flexDirection: 'row-reverse', alignItems: 'center', padding: 14, gap: 10, borderBottomWidth: 1, borderBottomColor: C.border },
  uploadRowIcon: { width: 36, height: 36, borderRadius: 12, backgroundColor: C.greenLight, alignItems: 'center', justifyContent: 'center' },
  uploadRowText: { flex: 1, alignItems: 'flex-end' },
  uploadRowTitle: { color: C.text, fontSize: 13, fontWeight: '800', textAlign: 'right' },
  uploadRowSub: { color: C.muted, fontSize: 11, textAlign: 'right', marginTop: 2 },
  uploadRowDate: { color: C.subtle, fontSize: 10 },

  // Evidence cards
  pageTitle: { color: C.text, fontSize: 24, fontWeight: '900', textAlign: 'right', marginBottom: 4 },
  pageSubtitle: { color: C.muted, fontSize: 14, textAlign: 'right', marginBottom: 18 },
  evidenceCard: { backgroundColor: C.surface, borderRadius: 22, marginBottom: 12, padding: 16, ...shadow(2) },
  evidenceCardTop: { flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  evidenceIconWrap: { },
  evidenceIcon: { width: 40, height: 40, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  evidenceBadge: { flexDirection: 'row-reverse', alignItems: 'center', gap: 5, backgroundColor: C.primaryLight, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 99 },
  evidenceBadgeText: { color: C.primary, fontSize: 12, fontWeight: '800' },
  evidenceTitle: { color: C.text, fontSize: 16, fontWeight: '900', textAlign: 'right', marginBottom: 6 },
  evidenceDesc: { color: C.muted, fontSize: 13, textAlign: 'right', lineHeight: 20, marginBottom: 12 },
  evidenceCardFooter: { flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'space-between', gap: 14, marginTop: 4 },
  evidenceOpenBtn: { flexDirection: 'row-reverse', alignItems: 'center', gap: 4 },
  evidenceOpenText: { color: C.primary, fontSize: 13, fontWeight: '800' },
  evidenceProgressBar: { flex: 1, height: 5, backgroundColor: C.border, borderRadius: 99, overflow: 'hidden' },
  evidenceProgressFill: { height: '100%', backgroundColor: C.teal, borderRadius: 99 },

  // Settings Screen
  settingsSectionLabel: { color: C.muted, fontSize: 12, fontWeight: '800', textAlign: 'right', marginBottom: 8, marginTop: 4, textTransform: 'uppercase', letterSpacing: 0.5 },

  profileCard: { borderRadius: 26, padding: 20, marginBottom: 22, overflow: 'hidden', position: 'relative' },
  profileCardDecor1: { position: 'absolute', width: 160, height: 160, borderRadius: 80, backgroundColor: 'rgba(255,255,255,0.055)', top: -40, left: -30 },
  profileCardDecor2: { position: 'absolute', width: 90, height: 90, borderRadius: 45, backgroundColor: 'rgba(255,255,255,0.065)', bottom: -20, right: 10 },
  profileAvatarRow: { flexDirection: 'row-reverse', alignItems: 'center', gap: 16 },
  profileAvatarWrap: { position: 'relative' },
  profileAvatarRing: { width: 72, height: 72, borderRadius: 36, borderWidth: 2.5, borderColor: 'rgba(255,255,255,0.35)', alignItems: 'center', justifyContent: 'center' },
  profileAvatarInner: { width: 62, height: 62, borderRadius: 31, backgroundColor: 'rgba(255,255,255,0.18)', alignItems: 'center', justifyContent: 'center' },
  profileAvatarLetter: { color: '#fff', fontSize: 30, fontWeight: '900' },
  profileRoleDot: { position: 'absolute', bottom: 2, left: 2, width: 14, height: 14, borderRadius: 7, borderWidth: 2.5, borderColor: 'rgba(30,10,96,0.6)' },
  profileInfo: { flex: 1, alignItems: 'flex-end', gap: 8 },
  profileName: { color: '#fff', fontSize: 20, fontWeight: '900', textAlign: 'right' },
  profileRolePill: { flexDirection: 'row-reverse', alignItems: 'center', gap: 6, backgroundColor: 'rgba(255,255,255,0.14)', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 99 },
  profileRolePillDot: { width: 7, height: 7, borderRadius: 4 },
  profileRoleText: { color: 'rgba(255,255,255,0.88)', fontSize: 12, fontWeight: '700' },
  profileDivider: { height: 1, backgroundColor: 'rgba(255,255,255,0.12)', marginVertical: 16 },
  profileSchoolRow: { flexDirection: 'row-reverse', alignItems: 'center', gap: 8 },
  profileSchoolName: { color: 'rgba(255,255,255,0.75)', fontSize: 13, fontWeight: '600', textAlign: 'right' },

  appVersionRow: { flexDirection: 'row-reverse', alignItems: 'center', padding: 16, gap: 12 },
  appVersionText: { flex: 1, alignItems: 'flex-end' },
  appVersionTitle: { color: C.text, fontSize: 15, fontWeight: '800', textAlign: 'right' },
  appVersionSub: { color: C.muted, fontSize: 12, textAlign: 'right', marginTop: 3 },
  appVersionValue: { color: C.subtle, fontSize: 13, fontWeight: '700' },

  logoutBtn: { flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'center', gap: 10, backgroundColor: '#FEE2E2', borderRadius: 18, minHeight: 54, marginTop: 6, borderWidth: 1.5, borderColor: '#FECACA' },
  logoutText: { color: C.red, fontSize: 16, fontWeight: '900' },

  // Bottom Nav
  bottomNavWrap: { paddingHorizontal: 16, paddingBottom: Platform.OS === 'ios' ? 8 : 14, paddingTop: 8, backgroundColor: C.bg },
  bottomNav: { flexDirection: 'row-reverse', backgroundColor: C.surface, borderRadius: 26, padding: 6, ...shadow(4) },
  navTab: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 10, borderRadius: 20, gap: 3 },
  navTabActive: { backgroundColor: C.primaryLight },
  navLabel: { color: C.muted, fontSize: 10, fontWeight: '700' },
  navLabelActive: { color: C.primary },
});
