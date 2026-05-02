import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Linking,
  Modal,
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
import * as DocumentPicker from 'expo-document-picker';
import { WebView } from 'react-native-webview';

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
  if (ext === 'pdf') return { icon: 'document-text-outline', bg: C.redLight, color: C.red };
  if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext)) return { icon: 'image-outline', bg: C.tealLight, color: C.teal };
  if (['doc', 'docx'].includes(ext)) return { icon: 'document-outline', bg: C.primaryLight, color: C.primary };
  return { icon: 'document-outline', bg: C.primaryLight, color: C.primary };
}

function resolveFileUrl(upload) {
  return upload?.preview_url || upload?.public_url || upload?.download_url || upload?.file_url || upload?.url || upload?.file?.url || null;
}

function resolveDownloadUrl(upload) {
  return upload?.download_url || upload?.public_url || upload?.preview_url || upload?.file_url || upload?.url || upload?.file?.url || null;
}

function resolveFileName(upload) {
  return upload?.original_name || upload?.file_name || upload?.filename || upload?.title || `file-${upload?.id || Date.now()}`;
}

function getFileExtension(upload) {
  const mime = String(upload?.file_type || '').toLowerCase();
  if (mime.includes('pdf')) return 'pdf';
  if (mime.includes('image/jpeg')) return 'jpg';
  if (mime.includes('image/png')) return 'png';
  if (mime.includes('image/gif')) return 'gif';
  if (mime.includes('image/webp')) return 'webp';

  const source = `${resolveFileName(upload)} ${resolveFileUrl(upload) || ''}`;
  const clean = source.split('?')[0].split('#')[0];
  const parts = clean.split('.');
  return parts.length > 1 ? parts.pop().toLowerCase() : '';
}

function getPreviewType(upload) {
  const ext = getFileExtension(upload);
  const mime = String(upload?.file_type || '').toLowerCase();

  if (mime.startsWith('image/') || ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp'].includes(ext)) return 'image';
  if (mime.includes('pdf') || ext === 'pdf') return 'pdf';
  if (['doc', 'docx', 'ppt', 'pptx', 'xls', 'xlsx'].includes(ext)) return 'office';
  return 'web';
}

function getPreviewUrl(upload) {
  const fileUrl = resolveFileUrl(upload);
  if (!fileUrl) return null;

  const type = getPreviewType(upload);

  if (type === 'pdf') {
    return `https://mozilla.github.io/pdf.js/web/viewer.html?file=${encodeURIComponent(fileUrl)}`;
  }

  if (type === 'office') {
    return `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(fileUrl)}`;
  }

  return fileUrl;
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

function UploadCard({ upload, onPreview, onDownload }) {
  const fileName = resolveFileName(upload);
  const { icon, bg, color } = getFileStyle(fileName);

  return (
    <TouchableOpacity style={styles.uploadCard} onPress={onPreview} activeOpacity={0.88}>
      <View style={styles.uploadCardBody}>
        <View style={styles.uploadMeta}>
          {upload.uploader?.name ? (
            <View style={styles.uploaderChip}>
              <Ionicons name="person-outline" size={11} color={C.primary} />
              <Text style={styles.uploaderName}>{upload.uploader.name}</Text>
            </View>
          ) : null}
          <Text style={styles.uploadDate}>{upload.created_at}</Text>
        </View>

        <View style={styles.uploadTitleRow}>
          <View style={[styles.uploadFileIcon, { backgroundColor: bg }]}>
            <Ionicons name={icon} size={18} color={color} />
          </View>
          <View style={styles.uploadTitleTextWrap}>
            <Text style={styles.uploadTitle} numberOfLines={2}>{upload.title || fileName}</Text>
            {upload.title && fileName && upload.title !== fileName ? (
              <Text style={styles.uploadFileName} numberOfLines={1}>{fileName}</Text>
            ) : null}
          </View>
        </View>

        {upload.notes ? <Text style={styles.uploadNotes} numberOfLines={2}>{upload.notes}</Text> : null}
      </View>

      <View style={styles.uploadActions}>
        <TouchableOpacity style={styles.previewBtn} onPress={onPreview} activeOpacity={0.8}>
          <Ionicons name="eye-outline" size={16} color={C.primary} />
          <Text style={styles.previewText}>معاينة</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.downloadBtn} onPress={onDownload} activeOpacity={0.8}>
          <Ionicons name="download-outline" size={16} color={C.primary} />
          <Text style={styles.downloadText}>تحميل</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function EvidenceDetailScreen({ token, evidence, onBack }) {
  const [loading, setLoading] = useState(true);
  const [item, setItem] = useState(evidence);
  const [uploads, setUploads] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);

  const [title, setTitle] = useState('');
  const [notes, setNotes] = useState('');
  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [formOpen, setFormOpen] = useState(true);

  const [previewUpload, setPreviewUpload] = useState(null);
  const [previewVisible, setPreviewVisible] = useState(false);
  const [previewLoading, setPreviewLoading] = useState(false);

  const isPrincipal = currentUser?.is_principal || currentUser?.role === 'principal';

  async function load() {
    setLoading(true);
    try {
      const [data, me] = await Promise.all([
        getJson(`/evidence/${evidence.id}`, token),
        getJson('/me', token),
      ]);
      setItem(data.item);
      setUploads(data.uploads || []);
      setCurrentUser(me.user || null);
    } catch (error) {
      Alert.alert('تعذر تحميل المعيار', error.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, [evidence.id]);

  async function pickFiles() {
    if (isPrincipal) return;
    const result = await DocumentPicker.getDocumentAsync({ multiple: true, copyToCacheDirectory: true });
    if (!result.canceled) setFiles(result.assets || []);
  }

  async function uploadFiles() {
    if (isPrincipal) return Alert.alert('تنبيه', 'رفع الملفات متاح للمعلمات فقط');
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

  function openPreview(upload) {
    const url = getPreviewUrl(upload);
    if (!url) {
      Alert.alert('تنبيه', 'رابط الملف غير متوفر');
      return;
    }
    setPreviewUpload(upload);
    setPreviewLoading(true);
    setPreviewVisible(true);
  }

  function closePreview() {
    setPreviewVisible(false);
    setPreviewUpload(null);
    setPreviewLoading(false);
  }

  function downloadUpload(upload) {
    const url = resolveDownloadUrl(upload);
    if (!url) {
      Alert.alert('تنبيه', 'رابط الملف غير متوفر');
      return;
    }
    Linking.openURL(url).catch((error) => {
      Alert.alert('تعذر فتح رابط التحميل', error.message);
    });
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
    <>
      <ScrollView
        style={styles.root}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <TouchableOpacity style={styles.backBtn} onPress={onBack} activeOpacity={0.8}>
          <Ionicons name="arrow-forward-outline" size={18} color={C.primary} />
          <Text style={styles.backText}>المعايير</Text>
        </TouchableOpacity>

        <LinearGradient colors={C.grad} style={styles.hero}>
          <View style={styles.heroDecor1} />
          <View style={styles.heroDecor2} />

          <View style={styles.heroBadge}>
            <Ionicons name="checkmark-done-circle-outline" size={13} color="rgba(255,255,255,0.75)" />
            <Text style={styles.heroBadgeText}>معيار التقييم</Text>
          </View>

          <Text style={styles.heroTitle}>{item?.title}</Text>
          {item?.description ? <Text style={styles.heroDesc}>{item.description}</Text> : null}

          <View style={styles.heroCountRow}>
            <View style={styles.heroCountItem}>
              <Text style={styles.heroCountNum}>{uploads.length}</Text>
              <Text style={styles.heroCountLabel}>ملف مرفوع</Text>
            </View>
          </View>
        </LinearGradient>

        {!isPrincipal && (
          <>
            <TouchableOpacity style={styles.sectionToggle} onPress={() => setFormOpen(!formOpen)} activeOpacity={0.8}>
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

                {files.map((f, i) => (
                  <PickedFileRow key={i} file={f} onRemove={() => setFiles(files.filter((_, j) => j !== i))} />
                ))}

                <TouchableOpacity style={styles.pickBtn} onPress={pickFiles} activeOpacity={0.82}>
                  <Ionicons name="attach-outline" size={19} color={C.primary} />
                  <Text style={styles.pickBtnText}>{files.length ? `تغيير الملفات (${files.length})` : 'اختيار ملفات'}</Text>
                </TouchableOpacity>

                {files.length > 0 && (
                  <TouchableOpacity style={styles.uploadBtn} onPress={uploadFiles} disabled={uploading} activeOpacity={0.88}>
                    <LinearGradient colors={[C.primary, C.primaryDark]} style={styles.uploadBtnGrad}>
                      {uploading ? (
                        <ActivityIndicator color="#fff" />
                      ) : (
                        <>
                          <Ionicons name="cloud-upload-outline" size={19} color="#fff" />
                          <Text style={styles.uploadBtnText}>رفع {files.length === 1 ? 'ملف واحد' : `${files.length} ملفات`}</Text>
                        </>
                      )}
                    </LinearGradient>
                  </TouchableOpacity>
                )}
              </View>
            )}
          </>
        )}

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
            <Text style={styles.emptySubtitle}>{isPrincipal ? 'لا توجد ملفات مرفوعة لهذا المعيار' : 'ارفعي أول ملف لهذا المعيار من النموذج أعلاه'}</Text>
          </View>
        ) : (
          uploads.map((u) => (
            <UploadCard
              key={u.id}
              upload={u}
              onPreview={() => openPreview(u)}
              onDownload={() => downloadUpload(u)}
            />
          ))
        )}

        <View style={{ height: 40 }} />
      </ScrollView>

      <Modal visible={previewVisible} animationType="slide" onRequestClose={closePreview}>
        <SafeAreaView style={styles.previewModalContainer}>
          <StatusBar barStyle="dark-content" backgroundColor={C.surface} />
          <View style={styles.previewHeader}>
            <TouchableOpacity style={styles.previewHeaderBtn} onPress={closePreview} activeOpacity={0.85}>
              <Ionicons name="close-outline" size={26} color={C.text} />
            </TouchableOpacity>

            <Text numberOfLines={1} style={styles.previewHeaderTitle}>
              {previewUpload ? resolveFileName(previewUpload) : 'معاينة الملف'}
            </Text>

            <TouchableOpacity style={styles.previewHeaderBtn} onPress={() => previewUpload && downloadUpload(previewUpload)} activeOpacity={0.85}>
              <Ionicons name="download-outline" size={24} color={C.primary} />
            </TouchableOpacity>
          </View>

          <View style={styles.previewBody}>
            {previewUpload && getPreviewType(previewUpload) === 'image' ? (
              <Image
                source={{ uri: getPreviewUrl(previewUpload) }}
                style={styles.previewImage}
                resizeMode="contain"
                onLoadStart={() => setPreviewLoading(true)}
                onLoadEnd={() => setPreviewLoading(false)}
              />
            ) : previewUpload ? (
              <WebView
                source={{ uri: getPreviewUrl(previewUpload) }}
                style={styles.previewWebView}
                startInLoadingState
                onLoadStart={() => setPreviewLoading(true)}
                onLoadEnd={() => setPreviewLoading(false)}
                renderLoading={() => (
                  <View style={styles.previewLoadingOverlay}>
                    <ActivityIndicator size="large" color={C.primary} />
                    <Text style={styles.previewLoadingText}>جاري فتح المعاينة...</Text>
                  </View>
                )}
              />
            ) : null}

            {previewLoading && (
              <View style={styles.previewLoadingOverlay}>
                <ActivityIndicator size="large" color={C.primary} />
                <Text style={styles.previewLoadingText}>جاري فتح المعاينة...</Text>
              </View>
            )}
          </View>

          <View style={styles.previewFooter}>
            <TouchableOpacity style={styles.previewDownloadMainBtn} activeOpacity={0.88} onPress={() => previewUpload && downloadUpload(previewUpload)}>
              <LinearGradient colors={[C.primary, C.primaryDark]} style={styles.previewDownloadMainBtnGrad}>
                <Ionicons name="download-outline" size={19} color="#fff" />
                <Text style={styles.previewDownloadMainBtnText}>تحميل الملف</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </Modal>
    </>
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
  uploadTitleRow: { flexDirection: 'row-reverse', alignItems: 'center', gap: 10 },
  uploadFileIcon: { width: 38, height: 38, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  uploadTitleTextWrap: { flex: 1, alignItems: 'flex-end' },
  uploadTitle: { color: C.text, fontSize: 15, fontWeight: '800', textAlign: 'right' },
  uploadFileName: { color: C.subtle, fontSize: 11, marginTop: 3, textAlign: 'right' },
  uploadNotes: { color: C.muted, fontSize: 13, textAlign: 'right', marginTop: 8, lineHeight: 20 },
  uploadActions: { flexDirection: 'row-reverse', alignItems: 'center', gap: 8, padding: 12, paddingTop: 0 },
  previewBtn: { flexDirection: 'row-reverse', alignItems: 'center', gap: 6, backgroundColor: '#EEF2FF', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 9 },
  previewText: { color: C.primary, fontSize: 13, fontWeight: '800' },
  downloadBtn: { flexDirection: 'row-reverse', alignItems: 'center', gap: 6, backgroundColor: C.primaryLight, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 9 },
  downloadText: { color: C.primary, fontSize: 13, fontWeight: '800' },

  // Preview modal
  previewModalContainer: { flex: 1, backgroundColor: C.surface },
  previewHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 14, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: C.border, backgroundColor: C.surface },
  previewHeaderBtn: { width: 42, height: 42, borderRadius: 14, backgroundColor: C.bg, alignItems: 'center', justifyContent: 'center' },
  previewHeaderTitle: { flex: 1, color: C.text, fontSize: 15, fontWeight: '800', textAlign: 'center', marginHorizontal: 12 },
  previewBody: { flex: 1, backgroundColor: '#F8FAFF' },
  previewImage: { flex: 1, width: '100%', height: '100%', backgroundColor: C.surface },
  previewWebView: { flex: 1, backgroundColor: C.surface },
  previewLoadingOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(255,255,255,0.78)', alignItems: 'center', justifyContent: 'center' },
  previewLoadingText: { marginTop: 10, color: C.muted, fontSize: 14, fontWeight: '700' },
  previewFooter: { padding: 14, borderTopWidth: 1, borderTopColor: C.border, backgroundColor: C.surface },
  previewDownloadMainBtn: { borderRadius: 18, overflow: 'hidden' },
  previewDownloadMainBtnGrad: { minHeight: 54, flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'center', gap: 8 },
  previewDownloadMainBtnText: { color: '#fff', fontSize: 16, fontWeight: '900' },
});
