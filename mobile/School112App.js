import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  ActivityIndicator,
  Alert,
  BackHandler,
  Linking,
  Platform,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { WebView } from 'react-native-webview';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

const WEBSITE = 'https://amal.pm.sa/';
const HOST = 'amal.pm.sa';
const LAVENDER = '#7B6BAA';

export default function School112App() {
  const webView = useRef(null);
  const canGoBack = useRef(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  const returnBack = useCallback(() => {
    if (canGoBack.current) {
      webView.current?.goBack();
      return true;
    }
    Alert.alert('المتوسطة ١١٢', 'هل تريدين إغلاق التطبيق؟', [
      { text: 'إلغاء', style: 'cancel' },
      { text: 'إغلاق', onPress: () => BackHandler.exitApp() },
    ]);
    return true;
  }, []);

  useEffect(() => {
    if (Platform.OS !== 'android') return undefined;
    const subscription = BackHandler.addEventListener('hardwareBackPress', returnBack);
    return () => subscription.remove();
  }, [returnBack]);

  const handleNavigation = useCallback((request) => {
    const url = request.url || '';
    if (url === 'about:blank' || url.startsWith('data:') || url.startsWith('blob:')) {
      return true;
    }
    try {
      const parsed = new URL(url);
      if (parsed.protocol === 'https:' && parsed.hostname === HOST) return true;
      if (parsed.protocol === 'http:' || parsed.protocol === 'https:' ||
          parsed.protocol === 'mailto:' || parsed.protocol === 'tel:') {
        Linking.openURL(url).catch(() => {});
      }
      return false;
    } catch (_) {
      return false;
    }
  }, []);

  const reload = () => {
    setError(false);
    setLoading(true);
    setReloadKey((n) => n + 1);
  };

  return (
    <SafeAreaView style={styles.page}>
      <StatusBar backgroundColor="#F5EFFC" barStyle="dark-content" />
      <WebView
        key={reloadKey}
        ref={webView}
        source={{ uri: WEBSITE }}
        style={styles.web}
        originWhitelist={['https://*']}
        javaScriptEnabled
        domStorageEnabled
        sharedCookiesEnabled
        thirdPartyCookiesEnabled={false}
        setSupportMultipleWindows={false}
        allowsInlineMediaPlayback
        mediaPlaybackRequiresUserAction={false}
        pullToRefreshEnabled
        cacheEnabled
        mixedContentMode="never"
        allowFileAccess
        onShouldStartLoadWithRequest={handleNavigation}
        onNavigationStateChange={(nav) => {
          canGoBack.current = nav.canGoBack;
        }}
        onLoadEnd={() => setLoading(false)}
        onError={() => {
          setLoading(false);
          setError(true);
        }}
        onFileDownload={({ nativeEvent }) => {
          // Android uses the system's download handler for attachment links.
          // Session-protected links may require signing in from the browser.
          Linking.openURL(nativeEvent.downloadUrl).catch(() => {
            Alert.alert('تنزيل الشاهد', 'افتحي المنصة في المتصفح لتنزيل هذا الملف.');
          });
        }}
        renderLoading={() => null}
      />
      {loading && !error && (
        <LinearGradient colors={['#F9F6FF', '#EEE5F9', '#E2D5F3']} style={styles.loading}>
          <View style={styles.icon}><Ionicons name="school-outline" color={LAVENDER} size={45} /></View>
          <Text style={styles.title}>المتوسطة ١١٢</Text>
          <Text style={styles.subtitle}>منصة التميز المدرسي</Text>
          <ActivityIndicator color={LAVENDER} size="large" style={styles.spinner} />
        </LinearGradient>
      )}
      {error && (
        <View style={styles.offline}>
          <Ionicons name="cloud-offline-outline" color={LAVENDER} size={54} />
          <Text style={styles.errorTitle}>تعذر الاتصال بالمنصة</Text>
          <Text style={styles.errorDescription}>تحققي من اتصال الإنترنت ثم أعيدي المحاولة.</Text>
          <TouchableOpacity onPress={reload} style={styles.retry} accessibilityRole="button">
            <Ionicons name="refresh" color="#fff" size={20} />
            <Text style={styles.retryText}>إعادة المحاولة</Text>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: '#F5EFFC' },
  web: { flex: 1, backgroundColor: '#F5EFFC' },
  loading: {
    position: 'absolute', top: 0, bottom: 0, left: 0, right: 0,
    alignItems: 'center', justifyContent: 'center',
  },
  icon: {
    width: 104, height: 104, borderRadius: 30, backgroundColor: '#FFFFFF',
    justifyContent: 'center', alignItems: 'center', marginBottom: 22,
    borderWidth: 1, borderColor: '#DDCEF0',
  },
  title: { color: '#4A326D', fontWeight: '900', fontSize: 29 },
  subtitle: { color: '#796495', fontWeight: '700', fontSize: 16, marginTop: 7 },
  spinner: { marginTop: 32 },
  offline: {
    position: 'absolute', top: 0, bottom: 0, left: 0, right: 0,
    backgroundColor: '#F7F2FC', alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: 30,
  },
  errorTitle: { color: '#4A326D', fontSize: 22, fontWeight: '900', marginTop: 22 },
  errorDescription: { color: '#806E97', fontSize: 14, textAlign: 'center', marginTop: 9 },
  retry: {
    backgroundColor: LAVENDER, flexDirection: 'row', gap: 10, alignItems: 'center',
    paddingHorizontal: 25, paddingVertical: 13, borderRadius: 14, marginTop: 27,
  },
  retryText: { color: '#FFFFFF', fontSize: 16, fontWeight: '800' },
});
