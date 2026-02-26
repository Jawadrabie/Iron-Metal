import { useEffect, useRef } from "react"
import {
  Animated,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  Pressable,
  View,
} from "react-native"
import { Feather } from "@expo/vector-icons"
import { useNavigation } from "@react-navigation/native"
import { useProfileScreen } from "../hooks/useProfileScreen"
import { ProfileContent } from "../components/profile/ProfileContent"
import { LogoutConfirmModal } from "../components/profile/LogoutConfirmModal"
import { CountryModal } from "../components/profile/CountryModal"
import { LanguageModal } from "../components/profile/LanguageModal"
import { colors } from "../constants/colors"
import { useTheme } from "../contexts/ThemeContext"
import { ErrorState } from "../components/ui/ErrorState"

export default function ProfileScreen() {
  const theme = useTheme()
  const isDark = theme.isDark
  const navigation = useNavigation<any>()
  const {
    loading,
    profileLoadError,
    user,
    saving,
    fullName,
    phone,
    preferredLanguage,
    country,
    avatarUrl,
    uploadingAvatar,
    showCountryPicker,
    showLanguagePicker,
    bannerMessage,
    bannerType,
    showLogoutConfirm,
    setFullName,
    setPhone,
    setCountry,
    setShowCountryPicker,
    setShowLanguagePicker,
    setShowLogoutConfirm,
    setPreferredLanguage,
    retryLoadProfile,
    handleSave,
    handlePickAvatar,
    handleLogout,
    canSave,
  } = useProfileScreen()
  const contentOpacity = useRef(new Animated.Value(1)).current
  const isLanguageSwitchingRef = useRef(false)

  const isRTL = preferredLanguage !== "en"

  const handleSelectLanguage = (language: "en" | "ar") => {
    if (isLanguageSwitchingRef.current) return
    if (preferredLanguage === language) return

    isLanguageSwitchingRef.current = true

    Animated.timing(contentOpacity, {
      toValue: 0.6,
      duration: 140,
      useNativeDriver: true,
    }).start(() => {
      setPreferredLanguage(language)
      requestAnimationFrame(() => {
        Animated.timing(contentOpacity, {
          toValue: 1,
          duration: 180,
          useNativeDriver: true,
        }).start(() => {
          isLanguageSwitchingRef.current = false
        })
      })
    })
  }

  const showBanner = (type: "success" | "error", message: string) => {
    // ...
  }

  if (profileLoadError && !loading) {
    return (
      <View style={[styles.root, isDark ? { backgroundColor: theme.colors.background } : null]}>
        <View style={styles.profileErrorContainer}>
          <ErrorState message={profileLoadError} onRetry={() => { void retryLoadProfile() }} />
        </View>
      </View>
    )
  }

  return (
    <View style={[styles.root, isDark ? { backgroundColor: theme.colors.background } : null]}>
      <Animated.View
        style={{
          flex: 1,
          opacity: contentOpacity,
        }}
      >
        {user && (
          <View
            style={[
              styles.headerLogoutContainer,
              isRTL ? styles.headerLogoutContainerRTL : styles.headerLogoutContainerLTR,
            ]}
          >
            <TouchableOpacity
              style={styles.headerLogoutButton}
              activeOpacity={0.9}
              onPress={() => setShowLogoutConfirm(true)}
            >
              <Feather name="log-out" size={18} color="#dc2626" />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.headerDeleteButton}
              activeOpacity={0.9}
              onPress={() => navigation.navigate("DeleteAccount" as never)}
            >
              <Feather name="trash-2" size={18} color="#dc2626" />
            </TouchableOpacity>
          </View>
        )}

        {bannerMessage && (
          <View
            style={[
              styles.banner,
              bannerType === "success" ? styles.bannerSuccess : styles.bannerError,
              isRTL ? styles.bannerRTL : null,
            ]}
          >
            <Feather
              name={bannerType === "success" ? "check-circle" : "alert-circle"}
              size={16}
              color={bannerType === "success" ? "#16A34A" : "#b91c1b"}
            />
            <Text
              style={[
                styles.bannerText,
                bannerType === "error" && styles.bannerTextError,
                isRTL ? styles.bannerTextRTL : null,
              ]}
            >
              {bannerMessage}
            </Text>
          </View>
        )}

        {(showCountryPicker || showLanguagePicker) && (
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={() => {
              setShowCountryPicker(false)
              setShowLanguagePicker(false)
            }}
          />
        )}

        <ScrollView
          style={[styles.scroll, { flex: 1 }]}
          contentContainerStyle={[
            styles.content,
            !loading && !user && styles.contentGuest,
          ]}
          keyboardShouldPersistTaps="handled"
          nestedScrollEnabled
          showsVerticalScrollIndicator={false}
          overScrollMode="never"
        >
          <ProfileContent
            loading={loading}
            user={user}
            fullName={fullName}
            avatarUrl={avatarUrl}
            uploadingAvatar={uploadingAvatar}
            phone={phone}
            country={country}
            saving={saving}
            canSave={canSave}
            onPickAvatar={handlePickAvatar}
            onChangeFullName={setFullName}
            onChangePhone={setPhone}
            onSelectCountry={(code) => setCountry(code)}
            onSave={handleSave}
            styles={styles}
          />
        </ScrollView>
      </Animated.View>

      <LanguageModal
        visible={showLanguagePicker}
        onClose={() => setShowLanguagePicker(false)}
        onSelectLanguage={handleSelectLanguage}
        styles={styles}
      />

      <CountryModal
        visible={showCountryPicker}
        country={country}
        onSelectCountry={(code) => setCountry(code)}
        onClose={() => setShowCountryPicker(false)}
        styles={styles}
      />

      <LogoutConfirmModal
        visible={showLogoutConfirm}
        onClose={() => setShowLogoutConfirm(false)}
        onConfirm={async () => {
          setShowLogoutConfirm(false)
          await handleLogout()
        }}
        styles={styles}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#f9fafb",
  },
  profileErrorContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  headerLogoutContainer: {
    position: "absolute",
    top: 16,
    zIndex: 50,
    alignItems: "center",
  },
  headerLogoutContainerLTR: {
    right: 16,
  },
  headerLogoutContainerRTL: {
    left: 16,
  },
  headerLogoutButton: {
    padding: 4,
    alignItems: "center",
    justifyContent: "center",
  },
  headerDeleteButton: {
    marginTop: 10,
    padding: 4,
    alignItems: "center",
    justifyContent: "center",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 0,
    paddingBottom: 8,
  },
  headerBack: {
    width: 32,
    alignItems: "flex-start",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111827",
  },
  banner: {
    position: "absolute",
    alignSelf: "center",
    top: 0,
    zIndex: 40,
    pointerEvents: "none",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 999,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  bannerRTL: {
    flexDirection: "row-reverse",
  },
  bannerSuccess: {
    backgroundColor: "rgba(22,163,74,0.08)",
  },
  bannerError: {
    backgroundColor: "rgba(220,38,38,0.08)",
  },
  bannerText: {
    fontSize: 13,
    color: "#166534",
  },
  bannerTextRTL: {
    textAlign: "right",
    writingDirection: "rtl",
  },
  bannerTextError: {
    color: "#991b1b",
  },
  scroll: {
    flex: 1,
  },
  content: {
    flexGrow: 1,
    paddingHorizontal: 16,
    paddingBottom: 120,
    justifyContent: "flex-start",
  },
  contentGuest: {
    justifyContent: "center",
  },
  loadingBox: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  card: {
    marginTop: 16,
    paddingHorizontal: 0,
    paddingVertical: 4,
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
    color: "#6B7280",
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
  profileHeader: {
    alignItems: "center",
    marginBottom: 16,
  },
  avatarWrapper: {
    position: "relative",
  },
  avatarImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  avatarCameraBadge: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.secondary,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#ffffff",
  },
  verifiedRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
  },
  verifiedText: {
    marginLeft: 4,
    fontSize: 12,
    color: "#16A34A",
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
  formSection: {
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 12,
  },
  fieldGroup: {
    marginBottom: 12,
  },
  fieldGroupWithDropdown: {
    marginBottom: 64,
  },
  fieldLabel: {
    fontSize: 13,
    color: "#374151",
    marginBottom: 4,
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
  selectWrapper: {
    marginTop: 4,
    position: "relative",
    zIndex: 20,
  },
  selectInput: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: "#ffffff",
  },
  selectValue: {
    fontSize: 14,
    color: "#111827",
  },
  dropdownCard: {
    position: "absolute",
    top: "100%",
    left: 0,
    right: 0,
    marginTop: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    backgroundColor: "#ffffff",
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 8,
    paddingVertical: 4,
    paddingHorizontal: 4,
    overflow: "hidden",
  },
  dropdownOption: {
    paddingVertical: 6,
    paddingHorizontal: 10,
  },
  dropdownOptionActive: {
    backgroundColor: "#F3F4F6",
  },
  dropdownOptionText: {
    fontSize: 13,
    color: "#111827",
    textAlign: "left",
  },
  dropdownOptionTextActive: {
    fontWeight: "600",
  },
  pillRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  pill: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    backgroundColor: "#F9FAFB",
  },
  pillActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  pillText: {
    fontSize: 13,
    color: "#374151",
  },
  pillTextActive: {
    color: "#ffffff",
    fontWeight: "600",
  },
  primaryButton: {
    marginTop: 24,
    backgroundColor: colors.secondary,
    paddingVertical: 12,
    paddingHorizontal: 40,
    borderRadius: 999,
    alignItems: "center",
    alignSelf: "center",
  },
  primaryButtonDisabled: {
    backgroundColor: "rgba(240,140,33,0.35)",
  },
  guestPrimaryButton: {
    paddingVertical: 8,
    paddingHorizontal: 28,
  },
  primaryButtonText: {
    color: "#ffffff",
    fontSize: 15,
    fontWeight: "600",
  },
  primaryButtonContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  primaryButtonSpinner: {
    position: "absolute",
  },
  primaryButtonTextHidden: {
    opacity: 0,
  },
  toggleRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    paddingVertical: 8,
    gap: 8,
  },
  toggleLabel: {
    flex: 1,
    fontSize: 13,
    color: "#374151",
  },
  toggleBox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: "#F08C21",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 2,
  },
  toggleDot: {
    width: 12,
    height: 12,
    borderRadius: 2,
    backgroundColor: "#F08C21",
  },
  logoutButton: {
    marginTop: 24,
    backgroundColor: "#ef4444",
    paddingVertical: 10,
    paddingHorizontal: 40,
    borderRadius: 999,
    alignItems: "center",
    alignSelf: "center",
  },
  logoutText: {
    color: "#ffffff",
    fontSize: 15,
    fontWeight: "600",
  },
  privacyLinkText: {
    marginTop: 12,
    fontSize: 13,
    color: "#4B5563",
    textDecorationLine: "underline",
    textAlign: "center",
  },
  confirmBackdrop: {
    flex: 1,
    backgroundColor: "rgba(15,23,42,0.45)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
  },
  confirmCard: {
    width: "100%",
    maxWidth: 360,
    borderRadius: 16,
    backgroundColor: "#ffffff",
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 12,
    alignItems: "center",
  },
  confirmIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#fee2e2",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  confirmTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 4,
    textAlign: "center",
  },
  confirmSubtitle: {
    fontSize: 13,
    color: "#6B7280",
    textAlign: "center",
    marginBottom: 16,
  },
  confirmButtonsRow: {
    flexDirection: "row",
    gap: 8,
    width: "100%",
  },
  confirmCancelButton: {
    flex: 1,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    paddingVertical: 10,
    alignItems: "center",
    backgroundColor: "#F9FAFB",
  },
  confirmCancelText: {
    fontSize: 14,
    color: "#374151",
    fontWeight: "500",
  },
  confirmLogoutButton: {
    flex: 1,
    borderRadius: 999,
    paddingVertical: 10,
    alignItems: "center",
    backgroundColor: "#ef4444",
  },
  confirmLogoutText: {
    fontSize: 14,
    color: "#ffffff",
    fontWeight: "600",
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "transparent",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
  },
  // يمكن التحكم في مكان Dialog اللغة عبر تغيير paddingTop هنا
  languageModalBackdrop: {
  },
  // يمكن التحكم في مكان Dialog الدولة عبر تغيير paddingTop هنا
  countryModalBackdrop: {
  },
  modalCard: {
    width: "100%",
    maxWidth: 360,
    borderRadius: 16,
    backgroundColor: "#ffffff",
    padding: 0,
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 10,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111827",
    marginBottom: 12,
    textAlign: "center",
  },
  modalOption: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    backgroundColor: "#F9FAFB",
    marginBottom: 8,
  },
  modalOptionActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  modalOptionText: {
    fontSize: 14,
    color: "#374151",
    textAlign: "center",
  },
  modalOptionTextActive: {
    color: "#ffffff",
    fontWeight: "600",
  },
  languageDropdownContainer: {
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    backgroundColor: "#ffffff",
    paddingVertical: 0,
  },
  languageItemContainer: {
    paddingVertical: 0,
    minHeight: 10,
    justifyContent: "center",
  },
  languageItemText: {
    fontSize: 14,
    color: "#111827",
  },
  languageRow: {
    height: 30,
    justifyContent: "center",
    paddingHorizontal: 12,
  },
  countryModalCard: {
    // يمكن أن تحتوي على قائمة طويلة؛ الحد الأقصى للارتفاع يُضبط على ScrollView
  },
  countryList: {
    maxHeight: 248,
  },
  countryListContent: {
    paddingVertical: 4,
  },
  countryRow: {
    // backgroundColor:"red",
    flexDirection: "row",
    alignItems: "center",
    height: 30,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginBottom: 4,
  },
  countryRowActive: {
    backgroundColor: "#F3F4F6",
  },
  countryFlag: {
    fontSize: 16,
    marginRight: 8,
  },
  countryRowText: {
    fontSize: 14,
    color: "#111827",
  },
  countryRowTextActive: {
    fontWeight: "600",
  },
  countryValueRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  countryDropdownContainer: {
    borderRadius: 12,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    backgroundColor: "#ffffff",
  },
})
