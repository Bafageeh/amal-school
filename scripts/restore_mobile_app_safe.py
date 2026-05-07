from pathlib import Path
import os

project = os.environ.get('PROJECT_PATH', '')
paths = []
if project:
    paths.append(Path(project) / 'mobile' / 'App.js')
paths += [Path('mobile/App.js'), Path('/mnt/home-storage/home/pmsa/apps/amal-school/amal-school-api/mobile/App.js'), Path('/home/pmsa/apps/amal-school/amal-school-api/mobile/App.js')]

content = r'''import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, SafeAreaView, ScrollView, StatusBar, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as SecureStore from 'expo-secure-store';

const API_BASE_URL = 'https://amal.pm.sa/mobile-api/v1';
const TOKEN_KEY = 'amal_mobile_token';

const C = {
  bg: '#F4F7FF', surface: '#FFFFFF', text: '#111827', muted: '#6B7280', border: '#E5E7EB',
  primary: '#4361EE', primaryDark: '#1A1060', primaryLight: '#EEF1FF', teal: '#0EA5E9', gold: '#F59E0B', red: '#EF4444',
  grad: ['#4361EE', '#2D46C9', '#1A1060'],
};

async function requestJson(path, { method = 'GET', token = null, body = null } = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method,
    headers: { Accept: 'application/json', 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
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
  return <View style={styles.loading}><ActivityIndicator size="large" color={C.primary} /><Text style={styles.loadingText}>جاري التحميل...</Text></View>;
}

function LoginScreen({ onLoggedIn }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  async function login() {
    if (!username.trim()) return Alert.alert('تنبيه', 'أدخلي اسم المستخدم');
    setLoading(true);
    try {
      const data = await requestJson('/login', { method: 'POST', body: { username: username.trim(), password } });
      await SecureStore.setItemAsync(TOKEN_KEY, data.token);
      onLoggedIn(data.token, data.user, data.requires_password_setup);
    } catch (e) { Alert.alert('تعذر تسجيل الدخول', e.message); } finally { setLoading(false); }
  }
  return <SafeAreaView style={styles.fill}><StatusBar barStyle="dark-content" /><View style={styles.loginTop}><View style={styles.logo}><Text style={styles.logoText}>أ</Text></View><Text style={styles.loginTitle}>أمل</Text><Text style={styles.loginSub}>منصة معايير التقييم وملفات المعلمات</Text></View><View style={styles.loginBox}><TextInput style={styles.input} placeholder="اسم المستخدم" value={username} onChangeText={setUsername} textAlign="right" autoCapitalize="none" /><TextInput style={styles.input} placeholder="الرقم السري" value={password} onChangeText={setPassword} secureTextEntry textAlign="right" /><TouchableOpacity style={styles.primaryBtn} onPress={login} disabled={loading}>{loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryBtnText}>دخول</Text>}</TouchableOpacity></View></SafeAreaView>;
}

function Header({ user, onLogout }) {
  return <View style={styles.header}><TouchableOpacity onPress={onLogout} style={styles.iconBtn}><Ionicons name="log-out-outline" size={22} color={C.muted} /></TouchableOpacity><View style={styles.headerText}><Text style={styles.schoolName}>{user?.school?.name || 'مدرسة المراسلات'}</Text><Text style={styles.userName}>{user?.name || 'مديرة المدرسة'}</Text></View><View style={styles.avatar}><Text style={styles.avatarText}>{(user?.name || 'م').charAt(0)}</Text></View></View>;
}

function ActionRow({ icon, title, subtitle, onPress, color = C.primary }) {
  return <TouchableOpacity style={styles.row} onPress={onPress} activeOpacity={0.85}><Ionicons name="chevron-back" size={18} color={C.border} /><View style={styles.rowText}><Text style={styles.rowTitle}>{title}</Text>{subtitle ? <Text style={styles.rowSub}>{subtitle}</Text> : null}</View><View style={[styles.rowIcon, { backgroundColor: color + '18' }]}><Ionicons name={icon} size={22} color={color} /></View></TouchableOpacity>;
}

function HomeScreen({ user, setTab }) {
  return <ScrollView contentContainerStyle={styles.pad}><LinearGradient colors={C.grad} style={styles.hero}><Text style={styles.heroTitle}>{user?.name || 'مديرة المدرسة'}</Text><Text style={styles.heroSub}>{user?.school?.name || 'مدرسة المراسلات'}</Text></LinearGradient><Text style={styles.sectionTitle}>اختصارات سريعة</Text><View style={styles.card}><ActionRow icon="list-outline" title="حسب المعايير" subtitle="عرض معايير التقييم" color={C.teal} onPress={() => setTab('criteria')} /><ActionRow icon="folder-open-outline" title="متابعة المعلمات" subtitle="عرض ملفات كل معلمة" color={C.gold} onPress={() => setTab('teachers')} /><ActionRow icon="settings-outline" title="الإعدادات" subtitle="إدارة المدرسة" onPress={() => setTab('settings')} /></View></ScrollView>;
}

function CriteriaScreen({ token }) {
  const [loading, setLoading] = useState(true); const [items, setItems] = useState([]);
  useEffect(() => { requestJson('/evidence', { token }).then(d => setItems(d.items || [])).catch(e => Alert.alert('تعذر التحميل', e.message)).finally(() => setLoading(false)); }, [token]);
  return <ScrollView contentContainerStyle={styles.pad}><Text style={styles.pageTitle}>حسب المعايير</Text>{loading ? <ActivityIndicator color={C.primary} /> : <View style={styles.card}>{items.map((it, i) => <View key={it.id || i} style={styles.simpleItem}><Text style={styles.rowTitle}>{it.title}</Text><Text style={styles.rowSub}>الملفات: {it.uploads_count ?? 0}</Text></View>)}</View>}</ScrollView>;
}

function TeachersScreen({ token }) {
  const [loading, setLoading] = useState(true); const [teachers, setTeachers] = useState([]); const [selected, setSelected] = useState(null); const [criteria, setCriteria] = useState([]); const [loadingCriteria, setLoadingCriteria] = useState(false);
  useEffect(() => { requestJson('/teacher-evidence', { token }).then(d => setTeachers(d.teachers || [])).catch(e => Alert.alert('تعذر التحميل', e.message)).finally(() => setLoading(false)); }, [token]);
  async function openTeacher(t) { setSelected(t); setLoadingCriteria(true); setCriteria([]); try { const d = await requestJson('/teacher-evidence/' + t.id, { token }); setCriteria(d.items || []); } catch (e) { Alert.alert('تعذر تحميل المعايير', e.message); } finally { setLoadingCriteria(false); } }
  if (selected) return <ScrollView contentContainerStyle={styles.pad}><TouchableOpacity onPress={() => setSelected(null)} style={styles.backBtn}><Ionicons name="arrow-forward-outline" size={20} color={C.primary} /><Text style={styles.backText}>رجوع</Text></TouchableOpacity><Text style={styles.pageTitle}>{selected.name}</Text>{loadingCriteria ? <ActivityIndicator color={C.primary} /> : <View style={styles.card}>{criteria.map((it, i) => <View key={it.id || i} style={styles.simpleItem}><Text style={styles.rowTitle}>{it.title}</Text><Text style={styles.rowSub}>ملفات هذه المعلمة: {it.teacher_uploads_count ?? 0}</Text></View>)}</View>}</ScrollView>;
  return <ScrollView contentContainerStyle={styles.pad}><Text style={styles.pageTitle}>متابعة المعلمات</Text>{loading ? <ActivityIndicator color={C.primary} /> : <View style={styles.card}>{teachers.map((t, i) => <ActionRow key={t.id || i} icon="person-outline" title={t.name} subtitle={`عدد الملفات: ${t.uploads_count ?? 0}`} onPress={() => openTeacher(t)} />)}</View>}</ScrollView>;
}

function SettingsScreen({ user, setTab }) {
  return <ScrollView contentContainerStyle={styles.pad}><LinearGradient colors={C.grad} style={styles.hero}><Text style={styles.heroTitle}>{user?.name || 'مديرة المدرسة'}</Text><Text style={styles.heroSub}>{user?.school?.name || 'مدرسة المراسلات'}</Text></LinearGradient><Text style={styles.sectionTitle}>إدارة المدرسة</Text><View style={styles.card}><ActionRow icon="people-outline" title="إدارة المعلمات" subtitle="إضافة أو تعديل أو حذف المعلمات" onPress={() => setTab('teachers')} /><ActionRow icon="list-outline" title="إدارة المعايير" subtitle="إنشاء وتعديل وحذف المعايير" color={C.teal} onPress={() => setTab('criteria')} /></View><Text style={styles.sectionTitle}>عام</Text><View style={styles.card}><ActionRow icon="help-circle-outline" title="الدعم والمساعدة" subtitle="تواصلي مع فريق الدعم" color={C.muted} /><View style={styles.versionRow}><Text style={styles.rowTitle}>إصدار التطبيق</Text><Text style={styles.rowSub}>Amal School App 1.0.3</Text></View></View></ScrollView>;
}

function BottomNav({ tab, setTab }) {
  const tabs = [{ id: 'home', label: 'الرئيسية', icon: 'home-outline' }, { id: 'criteria', label: 'حسب المعايير', icon: 'list-outline' }, { id: 'teachers', label: 'متابعة المعلمات', icon: 'folder-open-outline' }, { id: 'settings', label: 'الإعدادات', icon: 'settings-outline' }];
  return <View style={styles.nav}>{tabs.map(t => <TouchableOpacity key={t.id} style={[styles.navItem, tab === t.id && styles.navActive]} onPress={() => setTab(t.id)}><Ionicons name={t.icon} size={22} color={tab === t.id ? C.primary : C.muted} /><Text style={[styles.navText, tab === t.id && styles.navTextActive]}>{t.label}</Text></TouchableOpacity>)}</View>;
}

function MainApp({ token, user, setUser, onLogout }) {
  const [tab, setTab] = useState('home'); const [loading, setLoading] = useState(true);
  useEffect(() => { requestJson('/me', { token }).then(d => setUser(d.user)).catch(e => Alert.alert('تعذر تحميل الحساب', e.message)).finally(() => setLoading(false)); }, [token]);
  if (loading) return <LoadingScreen />;
  let screen = tab === 'settings' ? <SettingsScreen user={user} setTab={setTab} /> : tab === 'teachers' ? <TeachersScreen token={token} /> : tab === 'criteria' ? <CriteriaScreen token={token} /> : <HomeScreen user={user} setTab={setTab} />;
  return <SafeAreaView style={styles.fill}><StatusBar barStyle="dark-content" /><Header user={user} onLogout={onLogout} /><View style={styles.body}>{screen}</View><BottomNav tab={tab} setTab={setTab} /></SafeAreaView>;
}

export default function App() {
  const [booting, setBooting] = useState(true); const [token, setToken] = useState(null); const [user, setUser] = useState(null);
  useEffect(() => { SecureStore.getItemAsync(TOKEN_KEY).then(async t => { if (t) { try { const me = await requestJson('/me', { token: t }); setToken(t); setUser(me.user); } catch { await SecureStore.deleteItemAsync(TOKEN_KEY); } } }).finally(() => setBooting(false)); }, []);
  async function logout() { if (token) requestJson('/logout', { method: 'POST', token }).catch(() => {}); await SecureStore.deleteItemAsync(TOKEN_KEY); setToken(null); setUser(null); }
  if (booting) return <LoadingScreen />; if (!token) return <LoginScreen onLoggedIn={(t, u) => { setToken(t); setUser(u); }} />; return <MainApp token={token} user={user} setUser={setUser} onLogout={logout} />;
}

const styles = StyleSheet.create({
  fill: { flex: 1, backgroundColor: C.bg }, body: { flex: 1 }, loading: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: C.bg }, loadingText: { marginTop: 12, color: C.muted, fontWeight: '700' },
  loginTop: { alignItems: 'center', paddingTop: 80, paddingBottom: 30 }, logo: { width: 92, height: 92, borderRadius: 28, backgroundColor: C.primary, alignItems: 'center', justifyContent: 'center' }, logoText: { color: '#fff', fontSize: 42, fontWeight: '900' }, loginTitle: { fontSize: 30, fontWeight: '900', marginTop: 12, color: C.text }, loginSub: { color: C.muted, marginTop: 6 }, loginBox: { margin: 24, padding: 20, borderRadius: 24, backgroundColor: C.surface, gap: 12 }, input: { height: 52, borderWidth: 1, borderColor: C.border, borderRadius: 16, paddingHorizontal: 16, fontSize: 16, backgroundColor: '#fff' }, primaryBtn: { height: 52, borderRadius: 16, backgroundColor: C.primary, alignItems: 'center', justifyContent: 'center', marginTop: 6 }, primaryBtnText: { color: '#fff', fontSize: 17, fontWeight: '900' },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 18, paddingVertical: 12, backgroundColor: C.surface, borderBottomWidth: 1, borderBottomColor: C.border }, iconBtn: { width: 44, height: 44, borderRadius: 14, backgroundColor: C.primaryLight, alignItems: 'center', justifyContent: 'center' }, headerText: { flex: 1, alignItems: 'center' }, schoolName: { color: C.muted, fontSize: 13 }, userName: { color: C.text, fontSize: 20, fontWeight: '900' }, avatar: { width: 52, height: 52, borderRadius: 16, backgroundColor: C.primary, alignItems: 'center', justifyContent: 'center' }, avatarText: { color: '#fff', fontSize: 24, fontWeight: '900' },
  pad: { padding: 18, paddingBottom: 120 }, hero: { borderRadius: 28, padding: 28, marginBottom: 24, minHeight: 150, justifyContent: 'center' }, heroTitle: { color: '#fff', fontSize: 28, fontWeight: '900', textAlign: 'right' }, heroSub: { color: 'rgba(255,255,255,.85)', fontSize: 17, fontWeight: '700', textAlign: 'right', marginTop: 12 }, sectionTitle: { color: C.text, fontSize: 21, fontWeight: '900', textAlign: 'right', marginBottom: 12 }, pageTitle: { color: C.text, fontSize: 25, fontWeight: '900', textAlign: 'right', marginBottom: 16 }, card: { backgroundColor: C.surface, borderRadius: 24, overflow: 'hidden', borderWidth: 1, borderColor: C.border, marginBottom: 24 }, row: { minHeight: 82, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: C.border }, rowText: { flex: 1, alignItems: 'flex-end', paddingHorizontal: 12 }, rowTitle: { fontSize: 19, fontWeight: '900', color: C.text, textAlign: 'right' }, rowSub: { fontSize: 14, color: C.muted, marginTop: 6, textAlign: 'right' }, rowIcon: { width: 52, height: 52, borderRadius: 16, alignItems: 'center', justifyContent: 'center' }, simpleItem: { padding: 18, borderBottomWidth: 1, borderBottomColor: C.border, alignItems: 'flex-end' }, versionRow: { padding: 18, alignItems: 'flex-end' }, backBtn: { flexDirection: 'row-reverse', alignItems: 'center', gap: 8, marginBottom: 18 }, backText: { color: C.primary, fontWeight: '900' },
  nav: { position: 'absolute', left: 14, right: 14, bottom: 16, backgroundColor: C.surface, borderRadius: 26, padding: 8, flexDirection: 'row-reverse', borderWidth: 1, borderColor: C.border }, navItem: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 10, borderRadius: 20 }, navActive: { backgroundColor: C.primaryLight }, navText: { color: C.muted, fontSize: 12, fontWeight: '800', marginTop: 4 }, navTextActive: { color: C.primary },
});
'''

for p in paths:
    if p.parent.exists():
        p.write_text(content)
        print('restored safe mobile app:', p)
