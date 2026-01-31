import { memo, useEffect, useMemo, useState } from "react"
import {
  ActivityIndicator,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from "react-native"
import { Feather } from "@expo/vector-icons"

import {
  sendWhatsappOtpMobile,
  verifyWhatsappOtpMobile,
  getCurrentUser,
  getUserProfile,
  logout,
} from "../../lib/auth"
import { supabase } from "../../lib/supabase/client"
import { useI18n } from "../../contexts/I18nContext"

const BRAND_PRIMARY = "#302C6D"
const BRAND_SECONDARY = "#F08C21"

export const COUNTRIES = [
  // نبدأ بالسعودية كخيار افتراضي كما في الموبايل
  { code: "SA", name: "Saudi Arabia", nameAr: "السعودية", dial: "+966", flag: "🇸🇦" },
  { code: "KW", name: "Kuwait", nameAr: "الكويت", dial: "+965", flag: "🇰🇼" },
  { code: "QA", name: "Qatar", nameAr: "قطر", dial: "+974", flag: "🇶🇦" },
  { code: "AE", name: "United Arab Emirates", nameAr: "الإمارات", dial: "+971", flag: "🇦🇪" },
  { code: "BH", name: "Bahrain", nameAr: "البحرين", dial: "+973", flag: "🇧🇭" },
  { code: "OM", name: "Oman", nameAr: "عمان", dial: "+968", flag: "🇴🇲" },
  // باقي الدول كما في نسخة الويب
  { code: "AF", name: "Afghanistan", nameAr: "أفغانستان", dial: "+93", flag: "🇦🇫" },
  { code: "AL", name: "Albania", nameAr: "ألبانيا", dial: "+355", flag: "🇦🇱" },
  { code: "DZ", name: "Algeria", nameAr: "الجزائر", dial: "+213", flag: "🇩🇿" },
  { code: "AR", name: "Argentina", nameAr: "الأرجنتين", dial: "+54", flag: "🇦🇷" },
  { code: "AU", name: "Australia", nameAr: "أستراليا", dial: "+61", flag: "🇦🇺" },
  { code: "AT", name: "Austria", nameAr: "النمسا", dial: "+43", flag: "🇦🇹" },
  { code: "BD", name: "Bangladesh", nameAr: "بنغلاديش", dial: "+880", flag: "🇧🇩" },
  { code: "BE", name: "Belgium", nameAr: "بلجيكا", dial: "+32", flag: "🇧🇪" },
  { code: "BR", name: "Brazil", nameAr: "البرازيل", dial: "+55", flag: "🇧🇷" },
  { code: "CA", name: "Canada", nameAr: "كندا", dial: "+1", flag: "🇨🇦" },
  { code: "CN", name: "China", nameAr: "الصين", dial: "+86", flag: "🇨🇳" },
  { code: "EG", name: "Egypt", nameAr: "مصر", dial: "+20", flag: "🇪🇬" },
  { code: "FR", name: "France", nameAr: "فرنسا", dial: "+33", flag: "🇫🇷" },
  { code: "DE", name: "Germany", nameAr: "ألمانيا", dial: "+49", flag: "🇩🇪" },
  { code: "IN", name: "India", nameAr: "الهند", dial: "+91", flag: "🇮🇳" },
  { code: "ID", name: "Indonesia", nameAr: "إندونيسيا", dial: "+62", flag: "🇮🇩" },
  { code: "IR", name: "Iran", nameAr: "إيران", dial: "+98", flag: "🇮🇷" },
  { code: "IQ", name: "Iraq", nameAr: "العراق", dial: "+964", flag: "🇮🇶" },
  { code: "IE", name: "Ireland", nameAr: "أيرلندا", dial: "+353", flag: "🇮🇪" },
  { code: "IT", name: "Italy", nameAr: "إيطاليا", dial: "+39", flag: "🇮🇹" },
  { code: "JP", name: "Japan", nameAr: "اليابان", dial: "+81", flag: "🇯🇵" },
  { code: "JO", name: "Jordan", nameAr: "الأردن", dial: "+962", flag: "🇯🇴" },
  { code: "LB", name: "Lebanon", nameAr: "لبنان", dial: "+961", flag: "🇱🇧" },
  { code: "LY", name: "Libya", nameAr: "ليبيا", dial: "+218", flag: "🇱🇾" },
  { code: "MY", name: "Malaysia", nameAr: "ماليزيا", dial: "+60", flag: "🇲🇾" },
  { code: "MX", name: "Mexico", nameAr: "المكسيك", dial: "+52", flag: "🇲🇽" },
  { code: "MA", name: "Morocco", nameAr: "المغرب", dial: "+212", flag: "🇲🇦" },
  { code: "NL", name: "Netherlands", nameAr: "هولندا", dial: "+31", flag: "🇳🇱" },
  { code: "NZ", name: "New Zealand", nameAr: "نيوزيلندا", dial: "+64", flag: "🇳🇿" },
  { code: "PK", name: "Pakistan", nameAr: "باكستان", dial: "+92", flag: "🇵🇰" },
  { code: "PS", name: "Palestine", nameAr: "فلسطين", dial: "+970", flag: "🇵🇸" },
  { code: "PH", name: "Philippines", nameAr: "الفلبين", dial: "+63", flag: "🇵🇭" },
  { code: "PL", name: "Poland", nameAr: "بولندا", dial: "+48", flag: "🇵🇱" },
  { code: "PT", name: "Portugal", nameAr: "البرتغال", dial: "+351", flag: "🇵🇹" },
  { code: "RU", name: "Russia", nameAr: "روسيا", dial: "+7", flag: "🇷🇺" },
  { code: "SG", name: "Singapore", nameAr: "سنغافورة", dial: "+65", flag: "🇸🇬" },
  { code: "ZA", name: "South Africa", nameAr: "جنوب أفريقيا", dial: "+27", flag: "🇿🇦" },
  { code: "KR", name: "South Korea", nameAr: "كوريا الجنوبية", dial: "+82", flag: "🇰🇷" },
  { code: "ES", name: "Spain", nameAr: "إسبانيا", dial: "+34", flag: "🇪🇸" },
  { code: "SD", name: "Sudan", nameAr: "السودان", dial: "+249", flag: "🇸🇩" },
  { code: "SE", name: "Sweden", nameAr: "السويد", dial: "+46", flag: "🇸🇪" },
  { code: "CH", name: "Switzerland", nameAr: "سويسرا", dial: "+41", flag: "🇨🇭" },
  { code: "SY", name: "Syria", nameAr: "سوريا", dial: "+963", flag: "🇸🇾" },
  { code: "TW", name: "Taiwan", nameAr: "تايوان", dial: "+886", flag: "🇹🇼" },
  { code: "TH", name: "Thailand", nameAr: "تايلاند", dial: "+66", flag: "🇹🇭" },
  { code: "TN", name: "Tunisia", nameAr: "تونس", dial: "+216", flag: "🇹🇳" },
  { code: "TR", name: "Turkey", nameAr: "تركيا", dial: "+90", flag: "🇹🇷" },
  { code: "GB", name: "United Kingdom", nameAr: "المملكة المتحدة", dial: "+44", flag: "🇬🇧" },
  { code: "US", name: "United States", nameAr: "الولايات المتحدة", dial: "+1", flag: "🇺🇸" },
  { code: "VN", name: "Vietnam", nameAr: "فيتنام", dial: "+84", flag: "🇻🇳" },
  { code: "YE", name: "Yemen", nameAr: "اليمن", dial: "+967", flag: "🇾🇪" },
] as const

export type Step = "phone" | "code"

async function withTimeout<T>(promise: Promise<T>, timeoutMs: number) {
  return new Promise<T>((resolve, reject) => {
    const timeoutId = setTimeout(() => {
      reject(new Error("TIMEOUT"))
    }, timeoutMs)

    promise.then(
      (value) => {
        clearTimeout(timeoutId)
        resolve(value)
      },
      (error) => {
        clearTimeout(timeoutId)
        reject(error)
      },
    )
  })
}

type AccountModalProps = {
  visible: boolean
  onClose: () => void
  onLoginRequest: () => void
}

export const AccountModal = memo(function AccountModal({ visible, onClose, onLoginRequest }: AccountModalProps) {
  const { language, t } = useI18n()
  const tt = t.auth.accountModal
  const [initialLoading, setInitialLoading] = useState(true)
  const [user, setUser] = useState<any | null>(null)
  const [profile, setProfile] = useState<any | null>(null)

  const [step, setStep] = useState<Step>("phone")
  const [country, setCountry] = useState<(typeof COUNTRIES)[number] | null>(COUNTRIES[0])
  const [dialCode, setDialCode] = useState<string>(COUNTRIES[0].dial.replace("+", ""))
  const [localPhone, setLocalPhone] = useState("")
  const [code, setCode] = useState("")
  const [requestId, setRequestId] = useState("")
  const [isPending, setIsPending] = useState(false)

  const fullPhone = useMemo(() => {
    const local = localPhone.replace(/\s+/g, "")
    const localNoLeadingZero = local.replace(/^0+/, "")
    const dial = dialCode || country?.dial.replace("+", "") || ""
    if (!dial) return ""
    return `+${dial}${localNoLeadingZero}`
  }, [country, dialCode, localPhone])

  useEffect(() => {
    if (!visible) return

    let cancelled = false

    const load = async () => {
      setInitialLoading(true)
      try {
        const { user } = await getCurrentUser()
        if (!user || cancelled) {
          setUser(null)
          setProfile(null)
          setStep("phone")
          return
        }

        const { profile } = await getUserProfile(user.id)
        if (cancelled) return
        setUser(user)
        setProfile(profile)
        setStep("phone")
      } finally {
        if (!cancelled) setInitialLoading(false)
      }
    }

    load()

    return () => {
      cancelled = true
    }
  }, [visible])

  const handleSendOtp = async () => {
    if (!fullPhone) {
      Alert.alert(tt.noticeTitle, tt.missingPhone)
      return
    }

    setIsPending(true)
    try {
      const res = await withTimeout(sendWhatsappOtpMobile(fullPhone, language), 20000)

      if (!res.success) {
        Alert.alert(tt.errorTitle, res.error || tt.sendOtpFailed)
        return
      }

      setRequestId(res.requestId || "")
      setStep("code")
    } catch (e: any) {
      const msg = String(e?.message || "")
      if (msg === "TIMEOUT") {
        Alert.alert(tt.errorTitle, tt.networkTimeout)
      } else {
        Alert.alert(tt.errorTitle, tt.sendOtpFailed)
      }
    } finally {
      setIsPending(false)
    }
  }

  const handleVerifyOtp = async () => {
    if (!code.trim()) {
      Alert.alert(tt.noticeTitle, tt.missingCode)
      return
    }

    setIsPending(true)
    let res: any
    try {
      res = await withTimeout(
        verifyWhatsappOtpMobile({
          phone: fullPhone,
          code: code.trim(),
          requestId,
        }, language),
        20000,
      )

      if (!res.success) {
        Alert.alert(tt.errorTitle, res.error || tt.invalidCode)
        return
      }
    } catch (e: any) {
      const msg = String(e?.message || "")
      if (msg === "TIMEOUT") {
        Alert.alert(tt.errorTitle, tt.networkTimeout)
      } else {
        Alert.alert(tt.errorTitle, tt.invalidCode)
      }
      return
    } finally {
      setIsPending(false)
    }

    const verifiedUser = res.user || null

    // بعد نجاح تسجيل الدخول برقم واتساب، نحدّث حقل الدولة في بروفايل المستخدم
    if (verifiedUser && country?.code) {
      try {
        await supabase
          .from("profiles")
          .update({ country: country.code })
          .eq("id", verifiedUser.id)
      } catch {
        // إذا فشل التحديث، نكتفي بترك البلد كما هو بدون إيقاف تسجيل الدخول
      }
    }

    setUser(verifiedUser)
    setProfile(res.profile || null)
    setStep("phone")
  }

  const handleLogout = async () => {
    await logout(language)
    setUser(null)
    setProfile(null)
    setStep("phone")
  }

  if (!visible) return null

  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={onClose}>
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.backdrop}>
          <TouchableWithoutFeedback>
            <KeyboardAvoidingView
              behavior={Platform.OS === "ios" ? "padding" : undefined}
              style={styles.centerWrapper}
            >
              <View style={styles.glow} />
              <View style={styles.card}>
                <ScrollView
                  contentContainerStyle={styles.cardContent}
                  showsVerticalScrollIndicator={false}
                  keyboardShouldPersistTaps="handled"
                >
                  {initialLoading ? (
                    <View style={styles.loadingBox}>
                      <ActivityIndicator size="large" color={BRAND_PRIMARY} />
                    </View>
                  ) : user ? (
                    <LoggedInView user={user} profile={profile} onLogout={handleLogout} />
                  ) : (
                    <LoggedOutView onLogin={onLoginRequest} />
                  )}
                </ScrollView>
              </View>
            </KeyboardAvoidingView>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  )
})

type LoggedInViewProps = {
  user: any
  profile: any
  onLogout: () => void
}

function LoggedInView({ user, profile, onLogout }: LoggedInViewProps) {
  const { t } = useI18n()
  const tt = t.auth.accountModal
  const name = profile?.full_name || "" 
  const email = user?.email || ""
  const phone = profile?.phone || ""
  const country = profile?.country || "SA"
  const preferredLanguage = profile?.preferred_language || "ar"

  return (
    <View>
      <Text style={styles.title}>{tt.title}</Text>
      <Text style={styles.subtitle}>{tt.loggedInSubtitle}</Text>

      <View style={styles.profileBox}>
        <View style={styles.avatarCircle}>
          <Feather name="user" size={36} color={BRAND_PRIMARY} />
        </View>
        <Text style={styles.profileName}>{name || tt.unnamedUser}</Text>
        {!!email && <Text style={styles.profileEmail}>{email}</Text>}
      </View>

      <View style={styles.infoRow}>
        <Text style={styles.infoLabel}>{tt.phoneLabel}</Text>
        <Text style={styles.infoValue}>{phone}</Text>
      </View>
      <View style={styles.infoRow}>
        <Text style={styles.infoLabel}>{tt.countryLabel}</Text>
        <Text style={styles.infoValue}>{country}</Text>
      </View>
      <View style={styles.infoRow}>
        <Text style={styles.infoLabel}>{tt.preferredLanguageLabel}</Text>
        <Text style={styles.infoValue}>
          {preferredLanguage === "ar" ? tt.languageArabic : tt.languageEnglish}
        </Text>
      </View>

      <TouchableOpacity style={styles.logoutButton} activeOpacity={0.85} onPress={onLogout}>
        <Text style={styles.logoutText}>{tt.logout}</Text>
      </TouchableOpacity>
    </View>
  )
}

type LoggedOutViewProps = {
  onLogin: () => void
}

function LoggedOutView({ onLogin }: LoggedOutViewProps) {
  const { t } = useI18n()
  const tt = t.auth.accountModal
  return (
    <View>
      <Text style={styles.title}>{tt.title}</Text>
      <Text style={styles.subtitle}>{tt.guestSubtitle}</Text>

      <View style={styles.profileBox}>
        <View style={styles.avatarCircle}>
          <Feather name="user" size={36} color={BRAND_PRIMARY} />
        </View>
        <Text style={styles.profileName}>{tt.guestName}</Text>
      </View>

      <TouchableOpacity
        style={[styles.primaryButton, { marginTop: 24 }]}
        activeOpacity={0.9}
        onPress={onLogin}
      >
        <Text style={styles.primaryButtonText}>{tt.login}</Text>
      </TouchableOpacity>
    </View>
  )
}

export const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 16,
  },
  centerWrapper: {
    width: "100%",
    maxWidth: 420,
  },
  glow: {
    position: "absolute",
    left: -12,
    right: -12,
    top: -12,
    bottom: -12,
    borderRadius: 32,
    backgroundColor: "rgba(244, 114, 182, 0.2)",
  },
  card: {
    borderRadius: 24,
    backgroundColor: "#ffffff",
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 10,
  },
  cardContent: {
    paddingBottom: 8,
  },
  loadingBox: {
    paddingVertical: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
    color: "#111827",
    textAlign: "center",
  },
  subtitle: {
    marginTop: 8,
    fontSize: 13,
    color: "#4B5563",
    textAlign: "center",
  },
  profileBox: {
    marginTop: 20,
    alignItems: "center",
  },
  avatarCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#F3F4F6",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  profileName: {
    fontSize: 18,
    fontWeight: "600",
    color: "#111827",
  },
  profileEmail: {
    marginTop: 4,
    fontSize: 13,
    color: "#6B7280",
  },
  infoRow: {
    marginTop: 12,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  infoLabel: {
    fontSize: 13,
    color: "#6B7280",
  },
  infoValue: {
    fontSize: 13,
    color: "#111827",
    fontWeight: "500",
  },
  logoutButton: {
    marginTop: 24,
    backgroundColor: "#ef4444",
    paddingVertical: 10,
    borderRadius: 999,
    alignItems: "center",
  },
  logoutText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "600",
  },
  fieldLabel: {
    fontSize: 13,
    color: "#374151",
    marginBottom: 6,
  },
  countryScroll: {
    paddingVertical: 4,
  },
  countryChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: "#F3F4F6",
    marginRight: 8,
  },
  countryChipActive: {
    backgroundColor: BRAND_SECONDARY,
  },
  countryChipText: {
    fontSize: 12,
    color: "#374151",
  },
  countryChipTextActive: {
    color: "#ffffff",
    fontWeight: "600",
  },
  phoneRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: "#111827",
    backgroundColor: "#ffffff",
  },
  dialInput: {
    width: 90,
    textAlign: "center",
  },
  phoneInput: {
    flex: 1,
  },
  codeInput: {
    textAlign: "center",
    letterSpacing: 4,
  },
  primaryButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: BRAND_SECONDARY,
    borderRadius: 999,
    paddingVertical: 12,
  },
  primaryButtonText: {
    color: "#ffffff",
    fontSize: 15,
    fontWeight: "600",
  },
  linkText: {
    fontSize: 13,
    color: BRAND_PRIMARY,
    textAlign: "center",
  },
  linkTextSecondary: {
    fontSize: 12,
    color: "#6B7280",
    textAlign: "center",
  },
})
