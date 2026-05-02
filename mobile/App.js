import React, { useMemo, useState } from 'react';
import {
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

const colors = {
  bg: '#EEF4FF',
  surface: '#FFFFFF',
  text: '#0F172A',
  muted: '#64748B',
  primary: '#2563EB',
  dark: '#0F172A',
  green: '#16A34A',
  red: '#DC2626',
  border: '#E2E8F0',
};

const mockStats = [
  { label: 'المعلمات', value: '31', icon: 'people-outline', tone: '#EEF2FF' },
  { label: 'معايير التقييم', value: '12', icon: 'checkmark-done-outline', tone: '#DBEAFE' },
  { label: 'إجمالي الملفات', value: '86', icon: 'folder-open-outline', tone: '#DCFCE7' },
];

const mockEvidence = [
  { id: 1, title: 'المعيار الأول', desc: 'ملفات الشواهد والإنجازات.', count: 8 },
  { id: 2, title: 'المعيار الثاني', desc: 'ممارسات التدريس والتقييم.', count: 14 },
  { id: 3, title: 'المعيار الثالث', desc: 'التطوير المهني والمبادرات.', count: 6 },
];

const mockTeachers = [
  { id: 1, name: 'أ. سارة محمد', username: 'teacher', uploads: 12 },
  { id: 2, name: 'أ. نورة أحمد', username: 'teacher2', uploads: 9 },
  { id: 3, name: 'أ. منال خالد', username: 'teacher3', uploads: 15 },
];

function AppHeader() {
  return (
    <View style={styles.header}>
      <View style={styles.headerProfile}>
        <LinearGradient colors={[colors.primary, colors.dark]} style={styles.logo}>
          <Text style={styles.logoText}>A</Text>
        </LinearGradient>
        <View style={styles.headerTextWrap}>
          <Text style={styles.appName}>Amal</Text>
          <Text style={styles.schoolName} numberOfLines={1}>مدرسة — المديرة</Text>
        </View>
      </View>
      <View style={styles.rolePill}>
        <Text style={styles.roleText}>مديرة</Text>
      </View>
    </View>
  );
}

function HeroCard() {
  return (
    <LinearGradient colors={[colors.primary, '#1D4ED8', colors.dark]} style={styles.hero}>
      <View style={styles.heroTopRow}>
        <View style={styles.heroPill}>
          <Text style={styles.heroPillText}>React Native</Text>
        </View>
        <Ionicons name="sparkles-outline" size={26} color="#DBEAFE" />
      </View>
      <Text style={styles.heroTitle}>مرحبًا المديرة</Text>
      <Text style={styles.heroText}>واجهة جوال حديثة لإدارة معايير التقييم وملفات المعلمات.</Text>
    </LinearGradient>
  );
}

function StatCard({ item }) {
  return (
    <View style={styles.statCard}>
      <View style={[styles.statIcon, { backgroundColor: item.tone }]}>
        <Ionicons name={item.icon} size={24} color={colors.primary} />
      </View>
      <View>
        <Text style={styles.statLabel}>{item.label}</Text>
        <Text style={styles.statValue}>{item.value}</Text>
      </View>
    </View>
  );
}

function SectionHeader({ title, subtitle }) {
  return (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {subtitle ? <Text style={styles.sectionSubtitle}>{subtitle}</Text> : null}
    </View>
  );
}

function ActionCard({ icon, title, subtitle, color = colors.primary }) {
  return (
    <TouchableOpacity activeOpacity={0.85} style={styles.actionCard}>
      <View style={[styles.actionIcon, { backgroundColor: `${color}18` }]}>
        <Ionicons name={icon} size={24} color={color} />
      </View>
      <View style={styles.actionText}>
        <Text style={styles.actionTitle}>{title}</Text>
        <Text style={styles.actionSubtitle}>{subtitle}</Text>
      </View>
      <Ionicons name="chevron-back" size={20} color={colors.muted} />
    </TouchableOpacity>
  );
}

function EvidenceCard({ item }) {
  return (
    <TouchableOpacity activeOpacity={0.88} style={styles.listCard}>
      <View style={styles.listTop}>
        <View style={styles.listIcon}>
          <Ionicons name="checkmark-done-outline" size={22} color={colors.primary} />
        </View>
        <View style={styles.listText}>
          <Text style={styles.listTitle}>{item.title}</Text>
          <Text style={styles.listSubtitle}>{item.desc}</Text>
        </View>
      </View>
      <View style={styles.listFooter}>
        <Text style={styles.countPill}>عدد الملفات: {item.count}</Text>
        <Text style={styles.linkText}>فتح المعيار</Text>
      </View>
    </TouchableOpacity>
  );
}

function TeacherCard({ item }) {
  return (
    <TouchableOpacity activeOpacity={0.88} style={styles.listCard}>
      <View style={styles.listTop}>
        <View style={[styles.listIcon, { backgroundColor: '#F3E8FF' }]}>
          <Ionicons name="person-outline" size={22} color="#7C3AED" />
        </View>
        <View style={styles.listText}>
          <Text style={styles.listTitle}>{item.name}</Text>
          <Text style={styles.listSubtitle}>اسم المستخدم: {item.username}</Text>
        </View>
      </View>
      <View style={styles.listFooter}>
        <Text style={styles.countPill}>عدد الملفات: {item.uploads}</Text>
        <Text style={styles.linkText}>عرض المعايير</Text>
      </View>
    </TouchableOpacity>
  );
}

function HomeScreen() {
  return (
    <ScrollView contentContainerStyle={styles.screenContent} showsVerticalScrollIndicator={false}>
      <HeroCard />
      <View style={styles.statsGrid}>
        {mockStats.map((item) => <StatCard key={item.label} item={item} />)}
      </View>
      <SectionHeader title="اختصارات سريعة" subtitle="الوصول لأهم الشاشات بلمسة واحدة" />
      <ActionCard icon="checkmark-done-outline" title="معايير التقييم" subtitle="عرض ورفع الملفات على المعايير" />
      <ActionCard icon="settings-outline" title="الإعدادات" subtitle="إدارة المعلمات ومتابعة الملفات" color="#7C3AED" />
      <SectionHeader title="آخر الملفات" subtitle="أحدث الملفات المرفوعة في النظام" />
      <ActionCard icon="document-attach-outline" title="ملف معيار التقييم" subtitle="تم الرفع قبل قليل" color={colors.green} />
    </ScrollView>
  );
}

function EvidenceScreen() {
  return (
    <ScrollView contentContainerStyle={styles.screenContent} showsVerticalScrollIndicator={false}>
      <SectionHeader title="معايير التقييم" subtitle="اختاري معيارًا لعرض الملفات أو رفع ملفات جديدة" />
      {mockEvidence.map((item) => <EvidenceCard key={item.id} item={item} />)}
    </ScrollView>
  );
}

function SettingsScreen() {
  return (
    <ScrollView contentContainerStyle={styles.screenContent} showsVerticalScrollIndicator={false}>
      <SectionHeader title="الإعدادات" subtitle="كل ما يخص إدارة المديرة" />
      <ActionCard icon="people-outline" title="المعلمات" subtitle="إضافة وتعديل وحذف حسابات المعلمات" />
      <ActionCard icon="folder-open-outline" title="متابعة ملفات المعلمات" subtitle="اختيار معلمة ثم معيار ثم عرض الملفات" color="#7C3AED" />
      <SectionHeader title="المعلمات" subtitle="معاينة سريعة" />
      {mockTeachers.map((item) => <TeacherCard key={item.id} item={item} />)}
    </ScrollView>
  );
}

function BottomTab({ active, icon, label, onPress }) {
  return (
    <TouchableOpacity activeOpacity={0.85} onPress={onPress} style={[styles.tabItem, active && styles.tabItemActive]}>
      <Ionicons name={icon} size={23} color={active ? colors.dark : '#CBD5E1'} />
      <Text style={[styles.tabLabel, active && styles.tabLabelActive]}>{label}</Text>
    </TouchableOpacity>
  );
}

export default function App() {
  const [tab, setTab] = useState('home');

  const screen = useMemo(() => {
    if (tab === 'evidence') return <EvidenceScreen />;
    if (tab === 'settings') return <SettingsScreen />;
    return <HomeScreen />;
  }, [tab]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.bg} />
      <AppHeader />
      <View style={styles.container}>{screen}</View>
      <View style={styles.bottomTabs}>
        <BottomTab active={tab === 'home'} icon="home-outline" label="الرئيسية" onPress={() => setTab('home')} />
        <BottomTab active={tab === 'evidence'} icon="checkmark-done-outline" label="المعايير" onPress={() => setTab('evidence')} />
        <BottomTab active={tab === 'settings'} icon="settings-outline" label="الإعدادات" onPress={() => setTab('settings')} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.bg, direction: 'rtl' },
  container: { flex: 1 },
  header: {
    paddingHorizontal: 18,
    paddingTop: 12,
    paddingBottom: 10,
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(248,251,255,0.96)',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  headerProfile: { flexDirection: 'row-reverse', alignItems: 'center', flex: 1, gap: 10 },
  logo: { width: 44, height: 44, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  logoText: { color: '#FFFFFF', fontSize: 22, fontWeight: '900' },
  headerTextWrap: { flex: 1, alignItems: 'flex-end' },
  appName: { color: colors.text, fontSize: 20, fontWeight: '900' },
  schoolName: { color: colors.muted, fontSize: 12, marginTop: 2 },
  rolePill: { backgroundColor: '#DBEAFE', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 99 },
  roleText: { color: '#1D4ED8', fontSize: 12, fontWeight: '900' },
  screenContent: { padding: 16, paddingBottom: 112 },
  hero: { borderRadius: 32, padding: 22, marginBottom: 14, minHeight: 172, justifyContent: 'space-between' },
  heroTopRow: { flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center' },
  heroPill: { alignSelf: 'flex-end', backgroundColor: 'rgba(255,255,255,0.16)', paddingHorizontal: 12, paddingVertical: 7, borderRadius: 99 },
  heroPillText: { color: '#EFF6FF', fontSize: 12, fontWeight: '700' },
  heroTitle: { color: '#FFFFFF', fontSize: 31, fontWeight: '900', textAlign: 'right', marginTop: 16 },
  heroText: { color: '#DBEAFE', fontSize: 15, lineHeight: 25, textAlign: 'right', marginTop: 8 },
  statsGrid: { gap: 12, marginBottom: 12 },
  statCard: {
    backgroundColor: colors.surface,
    borderRadius: 26,
    padding: 16,
    minHeight: 92,
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 14,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: '#0F172A',
    shadowOpacity: 0.08,
    shadowRadius: 18,
    elevation: 3,
  },
  statIcon: { width: 54, height: 54, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  statLabel: { color: colors.muted, fontSize: 13, textAlign: 'right' },
  statValue: { color: colors.text, fontSize: 30, fontWeight: '900', textAlign: 'right', marginTop: 2 },
  sectionHeader: { marginTop: 8, marginBottom: 10, alignItems: 'flex-end' },
  sectionTitle: { color: colors.text, fontSize: 21, fontWeight: '900', textAlign: 'right' },
  sectionSubtitle: { color: colors.muted, fontSize: 13, textAlign: 'right', marginTop: 4 },
  actionCard: {
    backgroundColor: colors.surface,
    borderRadius: 26,
    padding: 16,
    marginBottom: 10,
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  actionIcon: { width: 52, height: 52, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  actionText: { flex: 1, alignItems: 'flex-end' },
  actionTitle: { color: colors.text, fontSize: 16, fontWeight: '900', textAlign: 'right' },
  actionSubtitle: { color: colors.muted, fontSize: 12, marginTop: 4, textAlign: 'right' },
  listCard: {
    backgroundColor: colors.surface,
    borderRadius: 26,
    padding: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: colors.border,
  },
  listTop: { flexDirection: 'row-reverse', gap: 12, alignItems: 'center' },
  listIcon: { width: 52, height: 52, borderRadius: 20, backgroundColor: '#DBEAFE', alignItems: 'center', justifyContent: 'center' },
  listText: { flex: 1, alignItems: 'flex-end' },
  listTitle: { color: colors.text, fontSize: 16, fontWeight: '900', textAlign: 'right' },
  listSubtitle: { color: colors.muted, fontSize: 12, marginTop: 4, textAlign: 'right' },
  listFooter: { marginTop: 14, flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center' },
  countPill: { backgroundColor: '#EEF2FF', color: '#3730A3', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 99, fontSize: 12, fontWeight: '800' },
  linkText: { color: colors.primary, fontSize: 13, fontWeight: '900' },
  bottomTabs: {
    position: 'absolute',
    left: 12,
    right: 12,
    bottom: 14,
    minHeight: 76,
    backgroundColor: colors.dark,
    borderRadius: 28,
    padding: 8,
    flexDirection: 'row-reverse',
    gap: 6,
    shadowColor: '#0F172A',
    shadowOpacity: 0.22,
    shadowRadius: 22,
    elevation: 10,
  },
  tabItem: { flex: 1, borderRadius: 22, alignItems: 'center', justifyContent: 'center', gap: 4 },
  tabItemActive: { backgroundColor: '#FFFFFF' },
  tabLabel: { color: '#CBD5E1', fontSize: 11, fontWeight: '900' },
  tabLabelActive: { color: colors.dark },
});
