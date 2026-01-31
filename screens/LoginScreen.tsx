// شاشة تسجيل الدخول الكاملة (تصميم قريب من صفحة /login في الموقع)
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
} from "react-native"

import { useNavigation } from "@react-navigation/native"

import { useLoginScreen } from "../hooks/useLoginScreen"
import { useI18n } from "../contexts/I18nContext"
import { LoginBackButtonRow } from "../components/auth/LoginBackButtonRow"
import { LoginHeader } from "../components/auth/LoginHeader"
import { LoginAlerts } from "../components/auth/LoginAlerts"
import { LoginPhoneForm } from "../components/auth/LoginPhoneForm"
import { LoginCodeForm } from "../components/auth/LoginCodeForm"
import { colors } from "../constants/colors"
import { useTheme } from "../contexts/ThemeContext"

type LoginScreenProps = {
  onClose?: () => void
}

export default function LoginScreen({ onClose }: LoginScreenProps) {
  const navigation = useNavigation<any>()
  const theme = useTheme()
  const isDark = theme.isDark
  const { language, toggleLanguage, t } = useI18n()
  const isArabic = language === "ar"

  const {
    step,
    phoneRaw,
    phoneFormatted,
    code,
    isPending,
    successMessage,
    errorMessage,
    fullPhone,
    handleBack,
    handleSendOtp,
    handleVerifyOtp,
    handleChangePhoneRaw,
    handleChangePhoneFormatted,
    handleChangeCode,
    handleUseDifferentNumber,
  } = useLoginScreen({ onClose })

  const uiStyles = isDark
    ? {
        ...stylesScreen,
        container: [stylesScreen.container, { backgroundColor: theme.colors.background }],
        cardInner: [
          stylesScreen.cardInner,
          {
            backgroundColor: theme.colors.surface,
            borderColor: theme.colors.border,
            borderWidth: 1,
            shadowOpacity: 0,
            shadowRadius: 0,
            elevation: 0,
          },
        ],
        languageToggleButton: [stylesScreen.languageToggleButton, { borderColor: theme.colors.border }],
        languageToggleText: [stylesScreen.languageToggleText, { color: theme.colors.text }],
        titleText: [stylesScreen.titleText, { color: theme.colors.text }],
        subtitleText: [stylesScreen.subtitleText, { color: theme.colors.textSecondary }],
        label: [stylesScreen.label, { color: theme.colors.textSecondary }],
        input: [
          stylesScreen.input,
          {
            backgroundColor: theme.colors.surface2,
            borderColor: theme.colors.border,
            color: theme.colors.text,
          },
        ],
        secondaryLinkText: [stylesScreen.secondaryLinkText, { color: theme.colors.textSecondary }],
        privacyLinkText: [stylesScreen.privacyLinkText, { color: theme.colors.textSecondary }],
        errorBanner: [stylesScreen.errorBanner, { backgroundColor: "rgba(239,68,68,0.12)" }],
        errorBannerText: [stylesScreen.errorBannerText, { color: theme.colors.error }],
        successBanner: [stylesScreen.successBanner, { backgroundColor: "rgba(34,197,94,0.12)" }],
        successBannerText: [stylesScreen.successBannerText, { color: theme.colors.success }],
        cardGlowTop: [stylesScreen.cardGlowTop, { backgroundColor: "rgba(240,140,33,0.05)" }],
        cardGlowBottom: [stylesScreen.cardGlowBottom, { backgroundColor: "rgba(240,140,33,0.05)" }],
      }
    : stylesScreen

  const body = (
    <>
      <LoginBackButtonRow onPress={handleBack} styles={uiStyles} />

      <View style={uiStyles.cardOuter}>
        <View style={uiStyles.cardGlowTop} />
        <View style={uiStyles.cardGlowBottom} />
        <View style={uiStyles.cardInner}>
          <View style={uiStyles.languageToggleRow}>
            <TouchableOpacity
              style={uiStyles.languageToggleButton}
              activeOpacity={0.85}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              onPress={toggleLanguage}
            >
              <Text style={uiStyles.languageToggleText}>
                {isArabic ? "en" : "ar"}
              </Text>
            </TouchableOpacity>
          </View>

          <LoginHeader
            step={step}
            fullPhone={fullPhone}
            styles={uiStyles}
          />

          <LoginAlerts
            errorMessage={errorMessage}
            successMessage={successMessage}
            styles={uiStyles}
          />

          {step === "phone" ? (
            <LoginPhoneForm
              phoneRaw={phoneRaw}
              isPending={isPending}
              styles={uiStyles}
              onChangePhoneRaw={handleChangePhoneRaw}
              onChangePhoneFormatted={handleChangePhoneFormatted}
              onSubmit={handleSendOtp}
            />
          ) : (
            <LoginCodeForm
              code={code}
              isPending={isPending}
              styles={uiStyles}
              onChangeCode={handleChangeCode}
              onSubmit={handleVerifyOtp}
              onUseDifferentNumber={handleUseDifferentNumber}
            />
          )}

          {step === "phone" && (
            <TouchableOpacity
              onPress={() => navigation.navigate("PrivacyPolicy" as never)}
              activeOpacity={0.7}
              style={uiStyles.privacyLink}
            >
              <Text style={uiStyles.privacyLinkText}>
                {t.profile.content.privacyPolicy}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </>
  )

  return (
    <KeyboardAvoidingView
      style={uiStyles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 24}
    >
      {step === "phone" ? (
        <ScrollView
          contentContainerStyle={uiStyles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          overScrollMode="never"
          bounces={false}
        >
          {body}
        </ScrollView>
      ) : (
        <View style={[uiStyles.content, { flex: 1 }]}>{body}</View>
      )}
    </KeyboardAvoidingView>
  )
}

const stylesScreen = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#ffffff",
  },
  content: {
    flexGrow: 1,
    paddingHorizontal: 16,
    paddingVertical: 24,
    justifyContent: "center",
  },
  backRow: {
    position: "absolute",
    top: 16,
    left: 16,
    zIndex: 100,
  },
  cardOuter: {
    width: "100%",
    maxWidth: 380,
    alignSelf: "center",
    alignItems: "center",
    justifyContent: "center",
  },
  cardGlowTop: {
    position: "absolute",
    width: "100%",
    maxWidth: 380,
    height: 160,
    top: -20,
    alignSelf: "center",
    borderTopLeftRadius: 40,
    borderTopRightRadius: 40,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    backgroundColor: "rgba(255,106,0,0.10)",
  },
  cardGlowBottom: {
    position: "absolute",
    width: "100%",
    maxWidth: 380,
    height: 160,
    bottom: -20,
    alignSelf: "center",
    borderTopLeftRadius: 0,
    borderTopRightRadius: 0,
    borderBottomLeftRadius: 40,
    borderBottomRightRadius: 40,
    backgroundColor: "rgba(255,106,0,0.10)",
  },
  cardInner: {
    width: "100%",
    maxWidth: 380,
    borderRadius: 24,
    backgroundColor: "#ffffff",
    padding: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
    zIndex: 50,
  },
  languageToggleRow: {
    alignItems: "flex-end",
  },
  languageToggleButton: {
    alignSelf: "flex-end",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    marginBottom: 8,
  },
  languageToggleText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#4b5563",
  },
  logoBox: {
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  logoImage: {
    width: 120,
    height: 80,
  },
  logoCircle: {
    width: 72,
    height: 72,
    borderRadius: 16,
    backgroundColor: "#f97316",
    alignItems: "center",
    justifyContent: "center",
  },
  logoText: {
    color: "#ffffff",
    fontWeight: "700",
    fontSize: 18,
  },
  headerTextBox: {
    marginTop: 8,
    marginBottom: 16,
    alignItems: "center",
  },
  titleText: {
    fontSize: 22,
    fontWeight: "700",
    color: "#111827",
  },
  subtitleText: {
    marginTop: 4,
    fontSize: 13,
    color: "#6b7280",
    textAlign: "center",
  },
  errorBanner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: "#fef2f2",
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginBottom: 8,
  },
  errorBannerText: {
    fontSize: 13,
    color: "#991b1b",
  },
  successBanner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: "#ecfdf3",
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginBottom: 12,
  },
  successBannerText: {
    fontSize: 13,
    color: "#166534",
    fontWeight: "500",
  },
  formBox: {
    marginTop: 8,
  },
  fieldGroup: {
    marginBottom: 16,
  },
  countryFieldGroup: {
    // تأكد أن مجموعة الدولة بالكامل فوق باقي الحقول
    zIndex: 30,
  },
  label: {
    fontSize: 13,
    fontWeight: "500",
    color: "#374151",
    marginBottom: 6,
  },
  countryWrapper: {
    marginTop: 4,
    position: "relative",
    zIndex: 40,
  },
  countryButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    backgroundColor: "#ffffff",
  },
  countryName: {
    fontSize: 14,
    color: "#111827",
  },
  countryDial: {
    fontSize: 12,
    color: "#6b7280",
  },
  countryDropdown: {
    position: "absolute",
    top: 52,
    left: 0,
    right: 0,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    backgroundColor: "#ffffff",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 16,
    overflow: "hidden",
    zIndex: 50,
  },
  countryModalBackdrop: {
    flex: 1,
    backgroundColor: "transparent",
    justifyContent: "flex-start",
    alignItems: "center",
    paddingTop: 430,
  },
  countryDropdownModal: {
    width: "80%",
    maxWidth: 360,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    backgroundColor: "#ffffff",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 16,
    overflow: "hidden",
  },
  countryItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  countryItemName: {
    fontSize: 14,
    color: "#111827",
  },
  countryItemDial: {
    fontSize: 12,
    color: "#6b7280",
  },
  phoneRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: "#111827",
    backgroundColor: "#ffffff",
  },
  dialInput: {
    flex: 1,
    textAlign: "left",
  },
  dialInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 0,
    gap: 4,
    width: 100,
  },
  dialFlag: {
    fontSize: 18,
  },
  phoneInput: {
    flex: 1,
  },
  codeInput: {
    textAlign: "center",
    letterSpacing: 4,
    writingDirection: "ltr",
  },
  primaryButton: {
    marginTop: 8,
    borderRadius: 999,
    paddingVertical: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.secondary,
  },
  primaryButtonDisabled: {
    opacity: 0.6,
  },
  primaryButtonContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  primaryButtonText: {
    color: "#ffffff",
    fontSize: 15,
    fontWeight: "700",
  },
  secondaryLink: {
    marginTop: 12,
    alignItems: "center",
  },
  secondaryLinkText: {
    fontSize: 13,
    color: "#4b5563",
    textAlign: "center",
  },
  privacyLink: {
    marginTop: 12,
    alignItems: "center",
  },
  privacyLinkText: {
    fontSize: 13,
    color: "#4b5563",
    textAlign: "center",
  },
})
