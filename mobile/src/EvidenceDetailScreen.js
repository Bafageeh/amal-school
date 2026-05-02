import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Linking, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';

const API = 'https://amal.pm.sa/mobile-api/v1';
const colors = { text:'#0F172A', muted:'#64748B', primary:'#2563EB', dark:'#0F172A', red:'#DC2626', border:'#E2E8F0', card:'#FFFFFF' };

async function getJson(path, token) {
  const response = await fetch(`${API}${path}`, { headers: { Accept: 'application/json', Authorization: `Bearer ${token}` } });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.message || `HTTP ${response.status}`);
  return data;
}

async function postForm(path, token, formData) {
  const response = await fetch(`${API}${path}`, { method: 'POST', headers: { Accept: 'application/json', Authorization: `Bearer ${token}` }, body: formData });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const firstError = data.errors ? Object.values(data.errors).flat()[0] : null;
    throw new Error(firstError || data.message || `HTTP ${response.status}`);
  }
  return data;
}

export default function EvidenceDetailScreen({ token, evidence, onBack }) {
  const [loading, setLoading] = useState(true);
  const [item, setItem] = useState(evidence);
  const [uploads, setUploads] = useState([]);
  const [title, setTitle] = useState('');
  const [notes, setNotes] = useState('');
  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);

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
      files.forEach((file) => form.append('files[]', { uri: file.uri, name: file.name || 'file', type: file.mimeType || 'application/octet-stream' }));
      const data = await postForm(`/evidence/${item.id}/uploads`, token, form);
      setUploads([...(data.uploads || []), ...uploads]);
      setTitle('');
      setNotes('');
      setFiles([]);
      Alert.alert('تم', data.message || 'تم رفع الملفات بنجاح');
    } catch (error) {
      Alert.alert('تعذر الرفع', error.message);
    } finally {
      setUploading(false);
    }
  }

  if (loading) return <View style={styles.center}><ActivityIndicator color={colors.primary} size="large" /></View>;

  return (
    <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <TouchableOpacity style={styles.back} onPress={onBack}><Text style={styles.backText}>رجوع للمعايير</Text></TouchableOpacity>
      <LinearGradient colors={[colors.primary, colors.dark]} style={styles.hero}>
        <Text style={styles.heroTitle}>{item?.title}</Text>
        <Text style={styles.heroText}>{item?.description || 'لا يوجد وصف لهذا المعيار.'}</Text>
      </LinearGradient>

      <View style={styles.formCard}>
        <Text style={styles.sectionTitle}>رفع ملفات</Text>
        <Text style={styles.sectionSubtitle}>يمكن اختيار أكثر من ملف دفعة واحدة</Text>
        <TextInput style={styles.input} placeholder="عنوان الملفات - اختياري" value={title} onChangeText={setTitle} textAlign="right" />
        <TextInput style={[styles.input, styles.textarea]} placeholder="ملاحظات - اختياري" value={notes} onChangeText={setNotes} textAlign="right" multiline />
        <TouchableOpacity style={styles.secondaryButton} onPress={pickFiles}>
          <Ionicons name="attach-outline" size={20} color={colors.primary} />
          <Text style={styles.secondaryText}>{files.length ? `تم اختيار ${files.length} ملف` : 'اختيار ملفات'}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.primaryButton} onPress={uploadFiles} disabled={uploading}>
          {uploading ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryText}>رفع الملفات</Text>}
        </TouchableOpacity>
      </View>

      <Text style={styles.sectionTitle}>الملفات المرفوعة</Text>
      {uploads.length ? uploads.map((upload) => (
        <View key={upload.id} style={styles.fileCard}>
          <Text style={styles.fileTitle}>{upload.title}</Text>
          <Text style={styles.fileSub}>{upload.notes || upload.created_at}</Text>
          {upload.uploader?.name ? <Text style={styles.teacherChip}>{upload.uploader.name}</Text> : null}
          <TouchableOpacity style={styles.secondaryButton} onPress={() => Linking.openURL(upload.download_url)}>
            <Ionicons name="download-outline" size={18} color={colors.primary} />
            <Text style={styles.secondaryText}>تحميل الملف</Text>
          </TouchableOpacity>
        </View>
      )) : <View style={styles.fileCard}><Text style={styles.fileSub}>لا توجد ملفات مرفوعة حتى الآن</Text></View>}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content:{padding:16,paddingBottom:112},center:{flex:1,alignItems:'center',justifyContent:'center'},back:{alignSelf:'flex-end',backgroundColor:'#fff',borderRadius:18,paddingHorizontal:14,paddingVertical:10,marginBottom:12,borderWidth:1,borderColor:colors.border},backText:{fontWeight:'900',color:colors.text},hero:{borderRadius:28,padding:20,marginBottom:14,minHeight:130,justifyContent:'center'},heroTitle:{color:'#fff',fontSize:24,fontWeight:'900',textAlign:'right'},heroText:{color:'#DBEAFE',fontSize:15,lineHeight:25,textAlign:'right',marginTop:8},formCard:{backgroundColor:colors.card,borderRadius:28,padding:18,borderWidth:1,borderColor:colors.border,marginBottom:14},sectionTitle:{fontSize:21,fontWeight:'900',color:colors.text,textAlign:'right',marginBottom:4},sectionSubtitle:{fontSize:13,color:colors.muted,textAlign:'right',marginBottom:8},input:{backgroundColor:'#F8FAFC',borderWidth:1,borderColor:colors.border,borderRadius:20,minHeight:52,paddingHorizontal:14,marginTop:12,fontSize:15,color:colors.text},textarea:{height:92,textAlignVertical:'top',paddingTop:14},primaryButton:{backgroundColor:colors.primary,borderRadius:20,minHeight:52,alignItems:'center',justifyContent:'center',marginTop:14},primaryText:{color:'#fff',fontSize:16,fontWeight:'900'},secondaryButton:{backgroundColor:'#EFF6FF',borderWidth:1,borderColor:'#BFDBFE',borderRadius:20,minHeight:48,alignItems:'center',justifyContent:'center',marginTop:12,flexDirection:'row-reverse',gap:8},secondaryText:{color:colors.primary,fontSize:15,fontWeight:'900'},fileCard:{backgroundColor:colors.card,borderRadius:26,padding:16,marginBottom:10,borderWidth:1,borderColor:colors.border},fileTitle:{fontSize:16,fontWeight:'900',color:colors.text,textAlign:'right'},fileSub:{fontSize:12,color:colors.muted,textAlign:'right',marginTop:4},teacherChip:{alignSelf:'flex-end',marginTop:8,backgroundColor:'#EEF2FF',color:'#3730A3',paddingHorizontal:10,paddingVertical:6,borderRadius:99,overflow:'hidden',fontSize:12,fontWeight:'800'}
});
