import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Linking,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';

const API = 'https://amal.pm.sa/mobile-api/v1';

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
  red:          '#EF4444',
  redLight:     '#FEE2E2',
};

const shadow = (depth = 2) => Platform.select({
  ios:     { shadowColor: '#1A1060', shadowOffset: { width: 0, height: depth }, shadowOpacity: 0.08, shadowRadius: depth * 4 },
  android: { elevation: depth + 1 },
});

// ─── API ──────────────────────────────────────────────────────────────────────
async function getJson(path, token) {
  const response = await fetch(`${API}${path}`, {
    headers: { Accept: 'application/json', Authorization: `Bearer ${token}` },
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.message || `HTTP ${response.status}`);
  return data;
}

async function postForm(path, token, formData) {
  const response = await fetch(`${API}${path}`, {
    method: 'POST',
    headers: { Accept: 'application/json', Authorization: `Bearer ${token}` },
    body: formData,
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const firstError = data.errors ? Object.values(data.errors).flat()[0] : null;
    throw new Error(firstError || data.message || `HTTP ${response.status}`);
  }
  return data;
}

// ─── File type helpers ────────────────────────────────────────────────────────
function getFileStyle(name = '') {
  const ext = name.split('.').pop().toLowerCase();
  if (ext === 'pdf')                              return { icon: 'document-text-outline', bg: C.redLight,   color: C.red   };
  if (['jpg','jpeg','png','gif','webp'].includes(ext)) return { icon: 'image-outline',        bg: C.tealLight, color: C.teal  };
  if (['doc','docx'].includes(ext))               return { icon: 'document-outline',      bg: C.primaryLight, color: C.primary };
  return { icon: 'document-outline', bg: C.primaryLight, color: C.primary };
}

// ─── Sub-components ───────────────────────────────────────────────────────────
function PickedFileRow({ file, onRemove }) {
  const { icon, bg, color } = getFileStyle(file.name);
  const sizeKb = file.size ? `${Math.round(file.size / 1024)} KB` : '';

  return (
    <View style={styles.pickedRow}>
      <TouchableOpacity onPress={onRemove} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
        <Ionicons name="close-circle" size={20} color={C.red} />
      </TouchableOpacity>
      <View style={styles.pickedText}>
        <Text style={styles.pickedName} numberOfLines={1}>{file.name}</Text>
        {sizeKb ? <Text style={styles.pickedSize}>{sizeKb}</Text> : null}
      </View>
      <View style={[styles.pickedIcon, { backgroundColor: bg }]}>
        <Ionicons name={icon} size={18} color={color} />
      </View>
    </View>
  );
}

function UploadCard({ upload, onDelete }) {
  return (
    <View style={styles.uploadCard}>
      <View style={styles.uploadCardBody}>
        {/* Meta row */}
        <View style={styles.uploadMeta}>
          {upload.uploader?.name ? (
            <View style={styles.uploaderChip}>
              <Ionicons name="person-outline" size={11} color={C.primary} />
              <Text style={styles.uploaderName}>{upload.uploader.name}</Text>
            </View>
          ) : null}
          <Text style={styles.uploadDate}>{upload.created_at}</Text>
        </View>

        <Text style={styles.uploadTitle} numberOfLines={2}>{upload.title}</Text>
        {upload.notes ? <Text style={styles.uploadNotes} numberOfLines={2}>{upload.notes}</Text> : null}
      </View>

      {/* Actions */}
      <View style={styles.uploadActions}>
        <TouchableOpacity
          style={styles.downloadBtn}
          onPress={() => Linking.openURL(upload.download_url)}
          activeOpacity={0.8}
        >
          <Ionicons name="download-outline" size={16} color={C.primary} />
          <Text style={styles.downloadText}>تحميل</Text>
        </TouchableOpacity>

        {onDelete && (
          <TouchableOpacity style={styles.deleteBtn} onPress={() => onDelete(upload)} activeOpacity={0.8}>
            <Ionicons name="trash-outline" size={16} color={C.red} />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function EvidenceDetailScreen({ token, evidence, onBack }) {
  const [loading, setLoading] = useState(true);
  const [item, setItem] = useState(evidence);
  const [uploads, setUploads] = useState([]);

  const [title, setTitle] = useState('');
  const [notes, setNotes] = useState('');
  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [formOpen, setFormOpen] = useState(true);

  async function load() {
    setLoading(true);
    try {
      const data = await getJson(`/evidence/${evidence.id}`, token);
      setItem(data.item);
      setUploads(data.uploads || []);
    } catch (error) {
      Alert.alert('تعذر تحميل المعيار', error.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, [evidence.id]);

  async function pickFiles() {
    const result = await DocumentPicker.getDocumentAsync({ multiple: true, copyToCacheDirectory: true });
    if (!result.canceled) setFiles(result.assets || []);
  }

  async function uploadFiles() {
    if (!files.length) return Alert.alert('تنبيه', 'اختاري ملفًا واحدًا على الأقل');
    setUploading(true);
    try {
      const form = new FormData();
      if (title.trim()) form.append('title', title.trim());
      if (notes.trim()) form.append('notes', notes.trim());
      files.forEach((f) =>
        form.append('files[]', { uri: f.uri, name: f.name || 'file', type: f.mimeType || 'application/octet-stream' })
      );
      const data = await postForm(`/evidence/${item.id}/uploads`, token, form);
      setUploads([...(data.uploads || []), ...uploads]);
      setTitle('');
      setNotes('');
      setFiles([]);
      setFormOpen(false);
      Alert.alert('تم الرفع', data.message || 'تم رفع الملفات بنجاح');
    } catch (error) {
      Alert.alert('تعذر الرفع', error.message);
    } finally {
      setUploading(false);
    }
  }

  if (loading) {
    return (
      <View style={styles.loadingWrap}>
        <ActivityIndicator color={C.primary} size="large" />
        <Text style={styles.loadingText}>جاري التحميل...</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.root}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      {/* Back button */}
      <TouchableOpacity style={styles.backBtn} onPress={onBack} activeOpacity={0.8}>
        <Ionicons name="arrow-forward-outline" size={18} color={C.primary} />
        <Text style={styles.backText}>المعايير</Text>
      </TouchableOpacity>

      {/* Hero */}
      <LinearGradient colors={C.grad} style={styles.hero}>
        <View style={styles.heroDecor1} />
        <View style={styles.heroDecor2} />

        <View style={styles.heroBadge}>
          <Ionicons name="checkmark-done-circle-outline" size={13} color="rgba(255,255,255,0.75)" />
          <Text style={styles.heroBadgeText}>معيار التقييم</Text>
        </View>

        <Text style={styles.heroTitle}>{item?.title}</Text>
        {item?.description ? (
          <Text style={styles.heroDesc}>{item.description}</Text>
        ) : null}

        <View style={styles.heroCountRow}>
          <View style={styles.heroCountItem}>
            <Text style={styles.heroCountNum}>{uploads.length}</Text>
            <Text style={styles.heroCountLabel}>ملف مرفوع</Text>
          </View>
        </View>
      </LinearGradient>

      {/* Upload section header */}
      <TouchableOpacity
        style={styles.sectionToggle}
        onPress={() => setFormOpen(!formOpen)}
        activeOpacity={0.8}
      >
        <Ionicons name={formOpen ? 'chevron-up' : 'chevron-down'} size={18} color={C.muted} />
        <View style={styles.sectionToggleText}>
          <Text style={styles.sectionToggleTitle}>رفع ملفات جديدة</Text>
          {files.length > 0 && (
            <View style={styles.fileCountBadge}>
              <Text style={styles.fileCountText}>{files.length}</Text>
            </View>
          )}
        </View>
        <View style={styles.sectionToggleIcon}>
          <Ionicons name="cloud-upload-outline" size={18} color={C.primary} />
        </View>
      </TouchableOpacity>

      {/* Upload form */}
      {formOpen && (
        <View style={styles.formCard}>
          <View style={styles.inputWrap}>
            <TextInput
              style={styles.input}
              placeholder="عنوان الملفات — اختياري"
              placeholderTextColor={C.subtle}
              value={title}
              onChangeText={setTitle}
              textAlign="right"
            />
          </View>

          <View style={[styles.inputWrap, { marginTop: 10 }]}>
            <TextInput
              style={[styles.input, styles.textarea]}
              placeholder="ملاحظات — اختياري"
              placeholderTextColor={C.subtle}
              value={notes}
              onChangeText={setNotes}
              textAlign="right"
              multiline
              textAlignVertical="top"
            />
          </View>

          {/* Picked files list */}
          {files.map((f, i) => (
            <PickedFileRow key={i} file={f} onRemove={() => setFiles(files.filter((_, j) => j !== i))} />
          ))}

          {/* Pick button */}
          <TouchableOpacity style={styles.pickBtn} onPress={pickFiles} activeOpacity={0.82}>
            <Ionicons name="attach-outline" size={19} color={C.primary} />
            <Text style={styles.pickBtnText}>
              {files.length ? `تغيير الملفات (${files.length})` : 'اختيار ملفات'}
            </Text>
          </TouchableOpacity>

          {/* Upload button — shown only when files are ready */}
          {files.length > 0 && (
            <TouchableOpacity style={styles.uploadBtn} onPress={uploadFiles} disabled={uploading} activeOpacity={0.88}>
              <LinearGradient colors={[C.primary, C.primaryDark]} style={styles.uploadBtnGrad}>
                {uploading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <>
                    <Ionicons name="cloud-upload-outline" size={19} color="#fff" />
                    <Text style={styles.uploadBtnText}>
                      رفع {files.length === 1 ? 'ملف واحد' : `${files.length} ملفات`}
                    </Text>
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* Uploaded files list */}
      <View style={styles.uploadsHeader}>
        <Text style={styles.uploadsTitle}>الملفات المرفوعة</Text>
        {uploads.length > 0 && (
          <View style={styles.uploadCountBadge}>
            <Text style={styles.uploadCountText}>{uploads.length}</Text>
          </View>
        )}
      </View>

      {uploads.length === 0 ? (
        <View style={styles.emptyBox}>
          <View style={styles.emptyIconWrap}>
            <Ionicons name="folder-open-outline" size={30} color={C.muted} />
          </View>
          <Text style={styles.emptyTitle}>لا توجد ملفات بعد</Text>
          <Text style={styles.emptySubtitle}>ارفعي أول ملف لهذا المعيار من النموذج أعلاه</Text>
        </View>
      ) : (
        uploads.map((u) => <UploadCard key={u.id} upload={u} />)
      )}

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
  content: { padding: 18, paddingTop: 16, paddingBottom: 100 },

  // Loading
  loadingWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: C.bg },
  loadingText: { color: C.muted, marginTop: 14, fontSize: 14, fontWeight: '700' },

  // Back
  backBtn: { flexDirection: 'row-reverse', alignItems: 'center', gap: 6, alignSelf: 'flex-end', backgroundColor: C.surface, paddingHorizontal: 14, paddingVertical: 9, borderRadius: 14, borderWidth: 1, borderColor: C.border, marginBottom: 16, ...shadow(1) },
  backText: { color: C.primary, fontSize: 14, fontWeight: '800' },

  // Hero
  hero: { borderRadius: 28, padding: 22, marginBottom: 20, minHeight: 190, overflow: 'hidden', position: 'relative' },
  heroDecor1: { position: 'absolute', width: 200, height: 200, borderRadius: 100, backgroundColor: 'rgba(255,255,255,0.05)', top: -60, left: -50 },
  heroDecor2: { position: 'absolute', width: 120, height: 120, borderRadius: 60, backgroundColor: 'rgba(255,255,255,0.06)', bottom: -30, right: 20 },
  heroBadge: { flexDirection: 'row-reverse', alignItems: 'center', gap: 6, alignSelf: 'flex-end', backgroundColor: 'rgba(255,255,255,0.14)', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 99, marginBottom: 16 },
  heroBadgeText: { color: 'rgba(255,255,255,0.82)', fontSize: 12, fontWeight: '700' },
  heroTitle: { color: '#fff', fontSize: 22, fontWeight: '900', textAlign: 'right', marginBottom: 8 },
  heroDesc: { color: 'rgba(255,255,255,0.62)', fontSize: 14, textAlign: 'right', lineHeight: 22, marginBottom: 16 },
  heroCountRow: { flexDirection: 'row-reverse', gap: 24 },
  heroCountItem: { alignItems: 'center' },
  heroCountNum: { color: '#fff', fontSize: 28, fontWeight: '900' },
  heroCountLabel: { color: 'rgba(255,255,255,0.62)', fontSize: 12, marginTop: 2 },

  // Section toggle
  sectionToggle: { flexDirection: 'row-reverse', alignItems: 'center', gap: 10, backgroundColor: C.surface, padding: 16, borderRadius: 18, marginBottom: 3, ...shadow(1) },
  sectionToggleIcon: { width: 38, height: 38, borderRadius: 13, backgroundColor: C.primaryLight, alignItems: 'center', justifyContent: 'center' },
  sectionToggleText: { flex: 1, alignItems: 'flex-end', flexDirection: 'row-reverse', gap: 8 },
  sectionToggleTitle: { color: C.text, fontSize: 15, fontWeight: '800' },
  fileCountBadge: { backgroundColor: C.primary, borderRadius: 99, minWidth: 20, height: 20, paddingHorizontal: 6, alignItems: 'center', justifyContent: 'center' },
  fileCountText: { color: '#fff', fontSize: 11, fontWeight: '900' },

  // Form card
  formCard: { backgroundColor: C.surface, borderRadius: 4, borderBottomLeftRadius: 18, borderBottomRightRadius: 18, padding: 16, marginBottom: 20, ...shadow(2) },
  inputWrap: { backgroundColor: C.bg, borderRadius: 14, borderWidth: 1.5, borderColor: C.border },
  input: { paddingHorizontal: 14, paddingVertical: 14, fontSize: 15, color: C.text, textAlign: 'right' },
  textarea: { minHeight: 82, textAlignVertical: 'top' },

  // Picked file row
  pickedRow: { flexDirection: 'row-reverse', alignItems: 'center', gap: 10, backgroundColor: C.bg, borderRadius: 12, padding: 12, marginTop: 10 },
  pickedIcon: { width: 36, height: 36, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  pickedText: { flex: 1, alignItems: 'flex-end' },
  pickedName: { color: C.text, fontSize: 13, fontWeight: '700', textAlign: 'right' },
  pickedSize: { color: C.muted, fontSize: 11, marginTop: 2 },

  // Pick & Upload buttons
  pickBtn: { flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: C.primaryLight, borderWidth: 1.5, borderColor: '#BFDBFE', borderRadius: 14, minHeight: 48, marginTop: 14 },
  pickBtnText: { color: C.primary, fontSize: 15, fontWeight: '800' },
  uploadBtn: { marginTop: 12, borderRadius: 16, overflow: 'hidden' },
  uploadBtnGrad: { minHeight: 52, flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'center', gap: 8 },
  uploadBtnText: { color: '#fff', fontSize: 16, fontWeight: '900' },

  // Uploads list header
  uploadsHeader: { flexDirection: 'row-reverse', alignItems: 'center', gap: 10, marginBottom: 12 },
  uploadsTitle: { color: C.text, fontSize: 18, fontWeight: '900', textAlign: 'right' },
  uploadCountBadge: { backgroundColor: C.primaryLight, borderRadius: 99, paddingHorizontal: 10, paddingVertical: 3 },
  uploadCountText: { color: C.primary, fontSize: 13, fontWeight: '900' },

  // Empty state
  emptyBox: { backgroundColor: C.surface, borderRadius: 20, padding: 36, alignItems: 'center', ...shadow(1) },
  emptyIconWrap: { width: 64, height: 64, borderRadius: 20, backgroundColor: C.bg, alignItems: 'center', justifyContent: 'center', marginBottom: 14 },
  emptyTitle: { color: C.text, fontSize: 16, fontWeight: '800', marginBottom: 6 },
  emptySubtitle: { color: C.muted, fontSize: 13, textAlign: 'center', lineHeight: 20 },

  // Upload card
  uploadCard: { backgroundColor: C.surface, borderRadius: 18, marginBottom: 10, overflow: 'hidden', ...shadow(2) },
  uploadCardBody: { padding: 14 },
  uploadMeta: { flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  uploaderChip: { flexDirection: 'row-reverse', alignItems: 'center', gap: 5, backgroundColor: C.primaryLight, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 99 },
  uploaderName: { color: C.primary, fontSize: 11, fontWeight: '700' },
  uploadDate: { color: C.subtle, fontSize: 11 },
  uploadTitle: { color: C.text, fontSize: 15, fontWeight: '800', textAlign: 'right' },
  uploadNotes: { color: C.muted, fontSize: 13, textAlign: 'right', marginTop: 4, lineHeight: 20 },
  uploadActions: { flexDirection: 'row-reverse', alignItems: 'center', gap: 8, padding: 12, paddingTop: 0 },
  downloadBtn: { flexDirection: 'row-reverse', alignItems: 'center', gap: 6, backgroundColor: C.primaryLight, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 9 },
  downloadText: { color: C.primary, fontSize: 13, fontWeight: '800' },
  deleteBtn: { width: 36, height: 36, borderRadius: 11, backgroundColor: C.redLight, alignItems: 'center', justifyContent: 'center' },
});
