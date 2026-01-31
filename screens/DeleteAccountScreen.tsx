import { useEffect, useRef, useState } from "react"
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native"
import { useNavigation } from "@react-navigation/native"
import { Feather } from "@expo/vector-icons"

import { getCurrentUser, logout } from "../lib/auth"
import { supabase } from "../lib/supabase/client"
import { useLanguage } from "../hooks/useLanguage"

const STRINGS = {
  en: {
    errorTitle: "Error",
    userNotFound: "Could not find the current user. Please log in again.",
    deleteScheduled:
      "Your account has been scheduled for deletion. You can restore it within 20 days.",
    closeFailed: "Failed to close your account.",
    back: "Back",
    title: "Delete Account",
    bullet1: "You will be signed out from the app and the website after closing your account.",
    bullet2: "Your ads and profile data will not be visible to other users while your account is closed.",
    bullet3:
      "We keep your account data for 20 days. During this period you can restore your account by signing in again with the same credentials. After 20 days, your data may be permanently deleted and this action cannot be undone.",
    confirm: "Confirm Delete Account",
  },
  ar: {
    errorTitle: "خطأ",
    userNotFound: "تعذر العثور على المستخدم الحالي. يرجى تسجيل الدخول مرة أخرى.",
    deleteScheduled: "تمت جدولة حذف حسابك. يمكنك استعادته خلال 20 يوماً.",
    closeFailed: "تعذر إغلاق حسابك.",
    back: "رجوع",
    title: "حذف الحساب",
    bullet1: "سيتم تسجيل خروجك من التطبيق والموقع بعد إغلاق حسابك.",
    bullet2: "لن تكون إعلاناتك وبيانات ملفك الشخصي مرئية للمستخدمين الآخرين أثناء إغلاق الحساب.",
    bullet3:
      "نحتفظ ببيانات حسابك لمدة 20 يوماً. خلال هذه الفترة يمكنك استعادة حسابك بتسجيل الدخول مرة أخرى بنفس البيانات. بعد 20 يوماً قد يتم حذف بياناتك نهائياً ولا يمكن التراجع عن هذا الإجراء.",
    confirm: "تأكيد حذف الحساب",
  },
} as const

export default function DeleteAccountScreen() {
  const { language } = useLanguage("en")
  const t = STRINGS[language]
  const navigation = useNavigation()
  const [loading, setLoading] = useState(false)
  const [bannerVisible, setBannerVisible] = useState(false)
  const [bannerMessage, setBannerMessage] = useState<string | null>(null)

  const mountedRef = useRef(true)
  const navigateTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    mountedRef.current = true
    return () => {
      mountedRef.current = false
      if (navigateTimeoutRef.current) {
        clearTimeout(navigateTimeoutRef.current)
        navigateTimeoutRef.current = null
      }
    }
  }, [])

  const handleConfirmDelete = async () => {
    try {
      setLoading(true)

      const { user } = await getCurrentUser()
      if (!user) {
        Alert.alert(t.errorTitle, t.userNotFound)
        return
      }

      const { error } = await supabase
        .from("profiles")
        .update({ deleted_at: new Date().toISOString() })
        .eq("id", user.id)

      if (error) {
        // نحاول مطابقة سلوك الموقع: لا نمنع إغلاق الحساب حتى لو فشل تحديث deleted_at
        console.warn("Failed to mark profile as deleted:", error.message)
      }

      await logout(language)

      if (!mountedRef.current) {
        return
      }

      setBannerMessage(t.deleteScheduled)
      setBannerVisible(true)

      if (navigateTimeoutRef.current) {
        clearTimeout(navigateTimeoutRef.current)
      }

      navigateTimeoutRef.current = setTimeout(() => {
        navigateTimeoutRef.current = null
        navigation.navigate("Home" as never)
      }, 2000)
    } catch (e: any) {
      Alert.alert(t.errorTitle, e?.message || t.closeFailed)
    } finally {
      if (mountedRef.current) {
        setLoading(false)
      }
    }
  }

  return (
    <View style={styles.root}>
      {bannerVisible && bannerMessage && (
        <View style={styles.banner}>
          <Feather name="check-circle" size={16} color="#16A34A" />
          <Text style={styles.bannerText}>{bannerMessage}</Text>
        </View>
      )}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          activeOpacity={0.7}
          onPress={() => navigation.goBack()}
        >
          <Feather name="arrow-left" size={22} color="#111827" />
          <Text style={styles.backText}>{t.back}</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.title}>{t.title}</Text>

        <View style={styles.bulletList}>
          <View style={styles.bulletRow}>
            <Text style={styles.bulletDot}>{"\u2022"}</Text>
            <Text style={styles.bulletText}>
              {t.bullet1}
            </Text>
          </View>
          <View style={styles.bulletRow}>
            <Text style={styles.bulletDot}>{"\u2022"}</Text>
            <Text style={styles.bulletText}>
              {t.bullet2}
            </Text>
          </View>
          <View style={styles.bulletRow}>
            <Text style={styles.bulletDot}>{"\u2022"}</Text>
            <Text style={styles.bulletText}>
              {t.bullet3}
            </Text>
          </View>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.deleteButton, loading && styles.deleteButtonDisabled]}
          activeOpacity={0.85}
          onPress={handleConfirmDelete}
          disabled={loading}
        >
          <View style={{ alignItems: "center", justifyContent: "center" }}>
            <Text style={[styles.deleteButtonText, loading && { opacity: 0 }]}>
              {t.confirm}
            </Text>
            {loading && (
              <View style={{ position: "absolute" }}>
                <ActivityIndicator color="#ffffff" />
              </View>
            )}
          </View>
        </TouchableOpacity>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#ffffff",
  },
  banner: {
    position: "absolute",
    top: 12,
    left: 16,
    right: 16,
    zIndex: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 999,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(22,163,74,0.08)",
  },
  bannerText: {
    fontSize: 13,
    color: "#166534",
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  backButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  backText: {
    fontSize: 15,
    color: "#111827",
  },
  content: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 32,
  },
  scroll: {
    flex: 1,
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 12,
  },
  paragraph: {
    fontSize: 14,
    color: "#374151",
    lineHeight: 20,
    marginBottom: 20,
  },
  bulletList: {
    marginBottom: 32,
  },
  bulletRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 8,
  },
  bulletDot: {
    fontSize: 16,
    color: "#111827",
    marginRight: 8,
    lineHeight: 20,
  },
  bulletText: {
    flex: 1,
    fontSize: 14,
    color: "#374151",
    lineHeight: 20,
  },
  footer: {
    paddingHorizontal: 24,
    paddingBottom: 24,
  },
  deleteButton: {
    backgroundColor: "#EF4444",
    borderRadius: 999,
    paddingVertical: 14,
    paddingHorizontal: 40,
    alignItems: "center",
    alignSelf: "center",
  },
  deleteButtonDisabled: {
    opacity: 0.7,
  },
  deleteButtonText: {
    color: "#ffffff",
    fontSize: 15,
    fontWeight: "600",
  },
})
