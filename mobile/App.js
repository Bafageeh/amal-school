import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
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

const API_BASE_URL = 'https://amal.pm.sa/mobile-api/v1';
const TOKEN_KEY = 'amal_mobile_token';

const colors = {
  bg: '#EEF4FF', surface: '#FFFFFF', text: '#0F172A', muted: '#64748B', primary: '#2563EB',
  dark: '#0F172A', green: '#16A34A', red: '#DC2626', border: '#E2E8F0', purple: '#7C3AED',
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

function AppHeader({ user, onLogout }) {
  return (
    <View style={styles.header}>
      <View style={styles.headerProfile}>
        <LinearGradient colors={[colors.primary, colors.dark]} style={styles.logo}>
          <Text style={styles.logoText}>A</Text>
        </LinearGradient>
        <View style={styles.headerTextWrap}>
          <Text style={styles.appName}>Amal</Text>
          <Text style={styles.schoolName} numberOfLines={1}>{user?.school?.name || 'مدرسة'} — {user?.name || user?.username}</Text>
        </View>
      </View>
      <TouchableOpacity activeOpacity={0.85} onPress={onLogout} style={styles.rolePill}>
        <Text style={styles.roleText}>{user?.role === 'principal' ? 'مديرة' : 'معلمة'}</Text>
      </TouchableOpacity>
    </View>
  );
}

function LoadingScreen() {
  return <SafeAreaView style={styles.centerScreen}><ActivityIndicator color={colors.primary} size="large" /><Text style={styles.loadingText}>جاري التحميل...</Text></SafeAreaView>;
}

function LoginScreen({ onLoggedIn }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

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
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.bg} />
      <ScrollView contentContainerStyle={styles.loginContent} keyboardShouldPersistTaps="handled">
        <LinearGradient colors={[colors.primary, colors.dark]} style={styles.loginHero}>
          <Text style={styles.loginLogo}>A</Text>
          <Text style={styles.loginTitle}>Amal</Text>
          <Text style={styles.loginSubtitle}>تطبيق معايير التقييم وملفات المعلمات</Text>
        </LinearGradient>
        <View style={styles.formCard}>
          <Text style={styles.sectionTitle}>تسجيل الدخول</Text>
          <Text style={styles.sectionSubtitle}>ادخلي باسم المستخدم والرقم السري</Text>
          <TextInput style={styles.input} placeholder="اسم المستخدم" value={username} onChangeText={setUsername} autoCapitalize="none" textAlign="right" />
          <TextInput style={styles.input} placeholder="الرقم السري" value={password} onChangeText={setPassword} secureTextEntry keyboardType="number-pad" textAlign="right" />
          <TouchableOpacity activeOpacity={0.86} style={styles.primaryButton} onPress={login} disabled={loading}>
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryButtonText}>دخول</Text>}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
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
      const data = await requestJson('/setup-password', { method: 'POST', token, body: { name, password, password_confirmation: confirm } });
      onDone(data.user);
    } catch (error) {
      Alert.alert('تعذر الاعتماد', error.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.loginContent} keyboardShouldPersistTaps="handled">
        <View style={styles.formCard}>
          <Text style={styles.sectionTitle}>اعتماد الحساب</Text>
          <Text style={styles.sectionSubtitle}>فضلاً أدخلي الاسم والرقم السري الجديد من 4 خانات.</Text>
          <TextInput style={styles.input} placeholder="الاسم" value={name} onChangeText={setName} textAlign="right" />
          <TextInput style={styles.input} placeholder="رقم سري من 4 خانات" value={password} onChangeText={setPassword} keyboardType="number-pad" secureTextEntry maxLength={4} textAlign="right" />
          <TextInput style={styles.input} placeholder="تأكيد الرقم السري" value={confirm} onChangeText={setConfirm} keyboardType="number-pad" secureTextEntry maxLength={4} textAlign="right" />
          <TouchableOpacity activeOpacity={0.86} style={styles.primaryButton} onPress={submit} disabled={loading}>
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryButtonText}>حفظ واعتماد</Text>}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function HeroCard({ user }) {
  return (
    <LinearGradient colors={[colors.primary, '#1D4ED8', colors.dark]} style={styles.hero}>
      <View style={styles.heroTopRow}><View style={styles.heroPill}><Text style={styles.heroPillText}>React Native + API</Text></View><Ionicons name="sparkles-outline" size={26} color="#DBEAFE" /></View>
      <Text style={styles.heroTitle}>مرحبًا {user?.name}</Text>
      <Text style={styles.heroText}>{user?.is_principal ? 'واجهة جوال لإدارة معايير التقييم وملفات المعلمات.' : 'واجهة جوال لرفع ومتابعة ملفات معايير التقييم الخاصة بك.'}</Text>
    </LinearGradient>
  );
}

function StatCard({ label, value, icon, tone }) {
  return <View style={styles.statCard}><View style={[styles.statIcon, { backgroundColor: tone }]}><Ionicons name={icon} size={24} color={colors.primary} /></View><View><Text style={styles.statLabel}>{label}</Text><Text style={styles.statValue}>{value}</Text></View></View>;
}

function SectionHeader({ title, subtitle }) {
  return <View style={styles.sectionHeader}><Text style={styles.sectionTitle}>{title}</Text>{subtitle ? <Text style={styles.sectionSubtitle}>{subtitle}</Text> : null}</View>;
}

function ActionCard({ icon, title, subtitle, color = colors.primary, onPress }) {
  return <TouchableOpacity activeOpacity={0.85} style={styles.actionCard} onPress={onPress}><View style={[styles.actionIcon, { backgroundColor: `${color}18` }]}><Ionicons name={icon} size={24} color={color} /></View><View style={styles.actionText}><Text style={styles.actionTitle}>{title}</Text><Text style={styles.actionSubtitle}>{subtitle}</Text></View><Ionicons name="chevron-back" size={20} color={colors.muted} /></TouchableOpacity>;
}

function HomeScreen({ user, dashboard, setTab }) {
  const stats = dashboard?.stats || {};
  return (
    <ScrollView contentContainerStyle={styles.screenContent} showsVerticalScrollIndicator={false}>
      <HeroCard user={user} />
      <View style={styles.statsGrid}>
        {user?.is_principal && <StatCard label="المعلمات" value={String(stats.teachers_count ?? 0)} icon="people-outline" tone="#EEF2FF" />}
        <StatCard label="معايير التقييم" value={String(stats.evidence_count ?? 0)} icon="checkmark-done-outline" tone="#DBEAFE" />
        <StatCard label={user?.is_principal ? 'إجمالي الملفات' : 'ملفاتي'} value={String(stats.uploads_count ?? 0)} icon="folder-open-outline" tone="#DCFCE7" />
      </View>
      <SectionHeader title="اختصارات سريعة" subtitle="الوصول لأهم الشاشات بلمسة واحدة" />
      <ActionCard icon="checkmark-done-outline" title="معايير التقييم" subtitle="عرض ورفع الملفات على المعايير" onPress={() => setTab('evidence')} />
      {user?.is_principal && <ActionCard icon="settings-outline" title="الإعدادات" subtitle="إدارة المعلمات ومتابعة الملفات" color={colors.purple} onPress={() => setTab('settings')} />}
      <SectionHeader title="آخر الملفات" subtitle="أحدث الملفات المرفوعة" />
      {(dashboard?.latest_uploads || []).slice(0, 5).map((upload) => <ActionCard key={upload.id} icon="document-attach-outline" title={upload.title} subtitle={upload.evidence?.title || upload.created_at} color={colors.green} />)}
    </ScrollView>
  );
}

function EvidenceScreen({ evidence }) {
  return <ScrollView contentContainerStyle={styles.screenContent} showsVerticalScrollIndicator={false}><SectionHeader title="معايير التقييم" subtitle="اختاري معيارًا لعرض الملفات أو رفع ملفات جديدة" />{(evidence || []).map((item) => <View key={item.id} style={styles.listCard}><View style={styles.listTop}><View style={styles.listIcon}><Ionicons name="checkmark-done-outline" size={22} color={colors.primary} /></View><View style={styles.listText}><Text style={styles.listTitle}>{item.title}</Text><Text style={styles.listSubtitle}>{item.description || 'لا يوجد وصف.'}</Text></View></View><View style={styles.listFooter}><Text style={styles.countPill}>عدد الملفات: {item.uploads_count ?? 0}</Text><Text style={styles.linkText}>فتح المعيار</Text></View></View>)}</ScrollView>;
}

function SettingsScreen({ user }) {
  return <ScrollView contentContainerStyle={styles.screenContent} showsVerticalScrollIndicator={false}><SectionHeader title="الإعدادات" subtitle="كل ما يخص إدارة الحساب" />{user?.is_principal ? <><ActionCard icon="people-outline" title="المعلمات" subtitle="إضافة وتعديل حسابات المعلمات" /><ActionCard icon="folder-open-outline" title="متابعة ملفات المعلمات" subtitle="اختيار معلمة ثم معيار ثم الملفات" color={colors.purple} /></> : <ActionCard icon="person-outline" title="حسابي" subtitle="بيانات المعلمة وملفاتها" />}</ScrollView>;
}

function BottomTab({ active, icon, label, onPress }) {
  return <TouchableOpacity activeOpacity={0.85} onPress={onPress} style={[styles.tabItem, active && styles.tabItemActive]}><Ionicons name={icon} size={23} color={active ? colors.dark : '#CBD5E1'} /><Text style={[styles.tabLabel, active && styles.tabLabelActive]}>{label}</Text></TouchableOpacity>;
}

function MainApp({ token, user, setUser, onLogout }) {
  const [tab, setTab] = useState('home');
  const [loading, setLoading] = useState(true);
  const [dashboard, setDashboard] = useState(null);
  const [evidence, setEvidence] = useState([]);

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

  const screen = useMemo(() => {
    if (loading) return <LoadingScreen />;
    if (tab === 'evidence') return <EvidenceScreen evidence={evidence} />;
    if (tab === 'settings') return <SettingsScreen user={user} />;
    return <HomeScreen user={user} dashboard={dashboard} setTab={setTab} />;
  }, [tab, loading, dashboard, evidence, user]);

  return <SafeAreaView style={styles.safeArea}><StatusBar barStyle="dark-content" backgroundColor={colors.bg} /><AppHeader user={user} onLogout={onLogout} /><View style={styles.container}>{screen}</View><View style={styles.bottomTabs}><BottomTab active={tab === 'home'} icon="home-outline" label="الرئيسية" onPress={() => setTab('home')} /><BottomTab active={tab === 'evidence'} icon="checkmark-done-outline" label="المعايير" onPress={() => setTab('evidence')} /><BottomTab active={tab === 'settings'} icon="settings-outline" label="الإعدادات" onPress={() => setTab('settings')} /></View></SafeAreaView>;
}

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
    setToken(null); setUser(null); setNeedsSetup(false);
  }

  if (booting) return <LoadingScreen />;
  if (!token) return <LoginScreen onLoggedIn={(newToken, newUser, setup) => { setToken(newToken); setUser(newUser); setNeedsSetup(setup); }} />;
  if (needsSetup) return <SetupPasswordScreen token={token} user={user} onDone={(newUser) => { setUser(newUser); setNeedsSetup(false); }} />;
  return <MainApp token={token} user={user} setUser={setUser} onLogout={logout} />;
}

const styles = StyleSheet.create({
  safeArea:{flex:1,backgroundColor:colors.bg,direction:'rtl'},container:{flex:1},centerScreen:{flex:1,alignItems:'center',justifyContent:'center',backgroundColor:colors.bg},loadingText:{marginTop:12,color:colors.muted,fontWeight:'700'},loginContent:{padding:18,paddingTop:40},loginHero:{borderRadius:34,padding:28,minHeight:210,alignItems:'center',justifyContent:'center',marginBottom:16},loginLogo:{color:'#fff',fontSize:54,fontWeight:'900'},loginTitle:{color:'#fff',fontSize:34,fontWeight:'900'},loginSubtitle:{color:'#DBEAFE',fontSize:14,marginTop:8,textAlign:'center'},formCard:{backgroundColor:colors.surface,borderRadius:28,padding:18,borderWidth:1,borderColor:colors.border},input:{backgroundColor:'#F8FAFC',borderWidth:1,borderColor:colors.border,borderRadius:20,minHeight:52,paddingHorizontal:14,marginTop:12,fontSize:15,color:colors.text},primaryButton:{backgroundColor:colors.primary,borderRadius:20,minHeight:52,alignItems:'center',justifyContent:'center',marginTop:16},primaryButtonText:{color:'#fff',fontSize:16,fontWeight:'900'},header:{paddingHorizontal:18,paddingTop:12,paddingBottom:10,flexDirection:'row-reverse',alignItems:'center',justifyContent:'space-between',backgroundColor:'rgba(248,251,255,0.96)',borderBottomWidth:1,borderBottomColor:'#E2E8F0'},headerProfile:{flexDirection:'row-reverse',alignItems:'center',flex:1,gap:10},logo:{width:44,height:44,borderRadius:16,alignItems:'center',justifyContent:'center'},logoText:{color:'#fff',fontSize:22,fontWeight:'900'},headerTextWrap:{flex:1,alignItems:'flex-end'},appName:{color:colors.text,fontSize:20,fontWeight:'900'},schoolName:{color:colors.muted,fontSize:12,marginTop:2},rolePill:{backgroundColor:'#DBEAFE',paddingHorizontal:12,paddingVertical:8,borderRadius:99},roleText:{color:'#1D4ED8',fontSize:12,fontWeight:'900'},screenContent:{padding:16,paddingBottom:112},hero:{borderRadius:32,padding:22,marginBottom:14,minHeight:172,justifyContent:'space-between'},heroTopRow:{flexDirection:'row-reverse',justifyContent:'space-between',alignItems:'center'},heroPill:{alignSelf:'flex-end',backgroundColor:'rgba(255,255,255,0.16)',paddingHorizontal:12,paddingVertical:7,borderRadius:99},heroPillText:{color:'#EFF6FF',fontSize:12,fontWeight:'700'},heroTitle:{color:'#fff',fontSize:31,fontWeight:'900',textAlign:'right',marginTop:16},heroText:{color:'#DBEAFE',fontSize:15,lineHeight:25,textAlign:'right',marginTop:8},statsGrid:{gap:12,marginBottom:12},statCard:{backgroundColor:colors.surface,borderRadius:26,padding:16,minHeight:92,flexDirection:'row-reverse',alignItems:'center',gap:14,borderWidth:1,borderColor:colors.border,elevation:3},statIcon:{width:54,height:54,borderRadius:20,alignItems:'center',justifyContent:'center'},statLabel:{color:colors.muted,fontSize:13,textAlign:'right'},statValue:{color:colors.text,fontSize:30,fontWeight:'900',textAlign:'right',marginTop:2},sectionHeader:{marginTop:8,marginBottom:10,alignItems:'flex-end'},sectionTitle:{color:colors.text,fontSize:21,fontWeight:'900',textAlign:'right'},sectionSubtitle:{color:colors.muted,fontSize:13,textAlign:'right',marginTop:4},actionCard:{backgroundColor:colors.surface,borderRadius:26,padding:16,marginBottom:10,flexDirection:'row-reverse',alignItems:'center',gap:12,borderWidth:1,borderColor:colors.border},actionIcon:{width:52,height:52,borderRadius:20,alignItems:'center',justifyContent:'center'},actionText:{flex:1,alignItems:'flex-end'},actionTitle:{color:colors.text,fontSize:16,fontWeight:'900',textAlign:'right'},actionSubtitle:{color:colors.muted,fontSize:12,marginTop:4,textAlign:'right'},listCard:{backgroundColor:colors.surface,borderRadius:26,padding:16,marginBottom:10,borderWidth:1,borderColor:colors.border},listTop:{flexDirection:'row-reverse',gap:12,alignItems:'center'},listIcon:{width:52,height:52,borderRadius:20,backgroundColor:'#DBEAFE',alignItems:'center',justifyContent:'center'},listText:{flex:1,alignItems:'flex-end'},listTitle:{color:colors.text,fontSize:16,fontWeight:'900',textAlign:'right'},listSubtitle:{color:colors.muted,fontSize:12,marginTop:4,textAlign:'right'},listFooter:{marginTop:14,flexDirection:'row-reverse',justifyContent:'space-between',alignItems:'center'},countPill:{backgroundColor:'#EEF2FF',color:'#3730A3',paddingHorizontal:10,paddingVertical:6,borderRadius:99,fontSize:12,fontWeight:'800'},linkText:{color:colors.primary,fontSize:13,fontWeight:'900'},bottomTabs:{position:'absolute',left:12,right:12,bottom:14,minHeight:76,backgroundColor:colors.dark,borderRadius:28,padding:8,flexDirection:'row-reverse',gap:6,elevation:10},tabItem:{flex:1,borderRadius:22,alignItems:'center',justifyContent:'center',gap:4},tabItemActive:{backgroundColor:'#fff'},tabLabel:{color:'#CBD5E1',fontSize:11,fontWeight:'900'},tabLabelActive:{color:colors.dark},
});
