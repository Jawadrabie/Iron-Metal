import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import {
  ActivityIndicator,
  Image,
  Linking,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native"
import { Feather, FontAwesome } from "@expo/vector-icons"
import { useFocusEffect, useNavigation } from "@react-navigation/native"
import * as ImagePicker from "expo-image-picker"
import * as FileSystem from "expo-file-system/legacy"

import { useI18n } from "../contexts/I18nContext"
import { useTheme } from "../contexts/ThemeContext"
import { getCurrentUser } from "../lib/auth"
import { supabase } from "../lib/supabase/client"
import { sendSupportRequest } from "../lib/api/support"

const WHATSAPP_NUMBER = "+966 11 269 0999"
const WHATSAPP_NUMBER_DIGITS = "966112690999"
const SUPPORT_EMAIL = "info@akafi.net"
const WEBSITE_URL = "https://iron-metal.net/"

const WHATSAPP_GREETING_EN = "Hello! I need technical support for the Iron & Metal app."
const EMAIL_SUBJECT_EN = "Technical Support Request - Iron & Metal App"

const MAX_IMG_DATA_URI_LENGTH = 2_000_000

function isValidDataUriImage(value: string) {
  return /^data:image\/[a-z0-9.+-]+;base64,/i.test(value)
}

type SupportScreenVariant = "support" | "suggestions"

type SupportScreenProps = {
  variant?: SupportScreenVariant
}

export default function SupportScreen({ variant = "support" }: SupportScreenProps) {
  const navigation = useNavigation<any>()
  const theme = useTheme()
  const { isRTL, t } = useI18n()
  const tt = t.support.ui
  const screenTitle = variant === "suggestions" ? tt.suggestionsTitle : tt.title
  const screenIntro = variant === "suggestions" ? tt.suggestionsIntro : tt.intro
  const loginRequiredBody = variant === "suggestions" ? tt.loginRequiredBodySuggestions : tt.loginRequiredBody
  const messagePlaceholder = variant === "suggestions" ? tt.messagePlaceholderSuggestions : tt.messagePlaceholder

  const [modalVisible, setModalVisible] = useState(false)
  const [modalTitle, setModalTitle] = useState("")
  const [modalMessage, setModalMessage] = useState("")
  const [modalVariant, setModalVariant] = useState<"error" | "success" | "info">("info")
  const [modalPrimaryLabel, setModalPrimaryLabel] = useState<string | null>(null)
  const modalPrimaryActionRef = useRef<(() => void) | null>(null)

  const [checkingAuth, setCheckingAuth] = useState(true)
  const [isLoggedIn, setIsLoggedIn] = useState(false)

  const authRefreshInFlightRef = useRef(false)
  const authLoadedOnceRef = useRef(false)

  const [message, setMessage] = useState("")
  const [imageDataUri, setImageDataUri] = useState<string | null>(null)
  const [imagePreviewUri, setImagePreviewUri] = useState<string | null>(null)
  const [imageSourceSheetVisible, setImageSourceSheetVisible] = useState(false)
  const [imagePreviewVisible, setImagePreviewVisible] = useState(false)

  const [sending, setSending] = useState(false)

  const refreshAuth = useCallback(
    async (cancelledRef: { cancelled: boolean }, opts?: { showLoader?: boolean }) => {
      if (authRefreshInFlightRef.current) return
      authRefreshInFlightRef.current = true

      const showLoader = opts?.showLoader === true
      if (showLoader) setCheckingAuth(true)

      try {
        const { user } = await getCurrentUser()
        if (cancelledRef.cancelled) return
        setIsLoggedIn(!!user)
        authLoadedOnceRef.current = true
      } finally {
        authRefreshInFlightRef.current = false
        if (!cancelledRef.cancelled && showLoader) setCheckingAuth(false)
      }
    },
    [],
  )

  const closeImageSourceSheet = useCallback(() => setImageSourceSheetVisible(false), [])
  const openImageSourceSheet = useCallback(() => setImageSourceSheetVisible(true), [])

  useEffect(() => {
    const cancelledRef = { cancelled: false }
    void refreshAuth(cancelledRef, { showLoader: true })
    return () => {
      cancelledRef.cancelled = true
    }
  }, [refreshAuth])

  useFocusEffect(
    useCallback(() => {
      const cancelledRef = { cancelled: false }

      const shouldShowLoader = !authLoadedOnceRef.current
      void refreshAuth(cancelledRef, { showLoader: shouldShowLoader })

      return () => {
        cancelledRef.cancelled = true
      }
    }, [refreshAuth]),
  )

  const rtlText = useMemo(
    () => ({
      textAlign: isRTL ? ("right" as const) : ("left" as const),
      writingDirection: isRTL ? ("rtl" as const) : ("ltr" as const),
    }),
    [isRTL],
  )

  const ltrText = useMemo(
    () => ({
      textAlign: "left" as const,
      writingDirection: "ltr" as const,
    }),
    [],
  )

  const closeModal = useCallback(() => {
    setModalVisible(false)
    setModalPrimaryLabel(null)
    modalPrimaryActionRef.current = null
  }, [])

  const openModal = useCallback(
    (args: {
      title: string
      message: string
      variant?: "error" | "success" | "info"
      primaryLabel?: string
      onPrimary?: () => void
    }) => {
      setModalTitle(args.title)
      setModalMessage(args.message)
      setModalVariant(args.variant ?? "info")
      setModalPrimaryLabel(args.primaryLabel ?? null)
      modalPrimaryActionRef.current = args.onPrimary ?? null
      setModalVisible(true)
    },
    [],
  )

  const handleModalPrimary = useCallback(() => {
    const fn = modalPrimaryActionRef.current
    closeModal()
    fn?.()
  }, [closeModal])

  const modalOverlayColor = theme.isDark ? "rgba(0,0,0,0.72)" : "rgba(0,0,0,0.52)"

  const modalIcon =
    modalVariant === "success" ? "check-circle" : modalVariant === "error" ? "alert-circle" : "info"

  const modalIconColor =
    modalVariant === "success"
      ? theme.colors.success
      : modalVariant === "error"
        ? theme.colors.error
        : theme.colors.secondary

  const modalNode = (
    <Modal
      transparent
      visible={modalVisible}
      animationType="fade"
      onRequestClose={closeModal}
    >
      <View style={[styles.modalOverlay, { backgroundColor: modalOverlayColor }]}>
        <View
          style={[
            styles.modalCard,
            {
              backgroundColor: theme.colors.surface,
              borderColor: theme.colors.border,
            },
          ]}
        >
          <View style={[styles.modalHeaderRow, isRTL ? styles.rowRTL : styles.rowLTR]}>
            <Feather name={modalIcon as any} size={20} color={modalIconColor} />
            <Text style={[styles.modalTitle, { color: theme.colors.text }, rtlText]}>{modalTitle}</Text>
          </View>

          <Text style={[styles.modalMessage, { color: theme.colors.textSecondary }, rtlText]}>{modalMessage}</Text>

          <View style={[styles.modalActions, isRTL ? styles.rowRTL : styles.rowLTR]}>
            {modalPrimaryLabel ? (
              <TouchableOpacity
                activeOpacity={0.9}
                onPress={handleModalPrimary}
                style={[styles.modalPrimaryButton, { backgroundColor: theme.colors.secondary }]}
              >
                <Text style={styles.modalPrimaryText}>{modalPrimaryLabel}</Text>
              </TouchableOpacity>
            ) : null}

            <TouchableOpacity activeOpacity={0.9} onPress={closeModal} style={styles.modalOkButton}>
              <Text style={[styles.modalOkText, { color: theme.colors.secondary }]}>{tt.ok}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  )

  const handlePickImage = async (source: "camera" | "gallery") => {
    try {
      if (source === "gallery") {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync()
        if (status !== "granted") {
          openModal({ title: tt.errorTitle, message: tt.imagePermission, variant: "error" })
          return
        }
      } else {
        const { status } = await ImagePicker.requestCameraPermissionsAsync()
        if (status !== "granted") {
          openModal({ title: tt.errorTitle, message: tt.cameraPermission, variant: "error" })
          return
        }
      }

      const commonOpts = {
        mediaTypes: ["images"] as ImagePicker.MediaType[],
        allowsEditing: true,
        quality: 0.7,
        base64: true,
        ...(Platform.OS === "android" ? { legacy: true } : {}),
      }

      const result =
        source === "camera"
          ? await ImagePicker.launchCameraAsync(commonOpts)
          : await ImagePicker.launchImageLibraryAsync(commonOpts)

      if (result.canceled || !result.assets || result.assets.length === 0) return

      const asset = result.assets[0]
      if (!asset?.uri) return

      const extFromName = asset.fileName?.split(".").pop()?.toLowerCase()
      const fileExt = extFromName || "jpg"

      const mimeType =
        (asset as any).mimeType ||
        (fileExt === "jpg" || fileExt === "jpeg" ? "image/jpeg" : `image/${fileExt}`)

      let base64 = asset.base64

      if (!base64) {
        base64 = await FileSystem.readAsStringAsync(asset.uri, {
          encoding: "base64" as any,
        })
      }

      if (!base64) return

      const dataUri = `data:${mimeType};base64,${base64}`

      if (!isValidDataUriImage(dataUri)) {
        openModal({ title: tt.errorTitle, message: tt.invalidImage, variant: "error" })
        return
      }

      if (dataUri.length > MAX_IMG_DATA_URI_LENGTH) {
        openModal({ title: tt.errorTitle, message: tt.imageTooLarge, variant: "error" })
        return
      }

      setImageDataUri(dataUri)
      setImagePreviewUri(asset.uri)
    } catch (e: any) {
      openModal({ title: tt.errorTitle, message: e?.message || tt.imagePermission, variant: "error" })
    }
  }

  const handleRemoveImage = () => {
    setImageDataUri(null)
    setImagePreviewUri(null)
    setImagePreviewVisible(false)
  }

  const imageSourceSheetNode = (
    <Modal
      transparent
      visible={imageSourceSheetVisible}
      animationType="fade"
      onRequestClose={closeImageSourceSheet}
    >
      <TouchableOpacity
        activeOpacity={1}
        onPress={closeImageSourceSheet}
        style={[styles.sheetOverlay, { backgroundColor: modalOverlayColor }]}
      >
        <TouchableOpacity activeOpacity={1} style={[styles.sheetCard, { backgroundColor: theme.colors.surface }]}>
          <Text style={[styles.sheetTitle, { color: theme.colors.text }, rtlText]}>{tt.chooseImageSourceTitle}</Text>

          <TouchableOpacity
            style={[styles.sheetRow, { borderColor: theme.colors.border }]}
            activeOpacity={0.85}
            onPress={() => {
              closeImageSourceSheet()
              void handlePickImage("camera")
            }}
          >
            <Feather name="camera" size={18} color={theme.colors.secondary} />
            <Text style={[styles.sheetRowText, { color: theme.colors.text }, rtlText]}>{tt.chooseImageCamera}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.sheetRow, { borderColor: theme.colors.border }]}
            activeOpacity={0.85}
            onPress={() => {
              closeImageSourceSheet()
              void handlePickImage("gallery")
            }}
          >
            <Feather name="image" size={18} color={theme.colors.secondary} />
            <Text style={[styles.sheetRowText, { color: theme.colors.text }, rtlText]}>{tt.chooseImageGallery}</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.sheetCancel} activeOpacity={0.85} onPress={closeImageSourceSheet}>
            <Text style={[styles.sheetCancelText, { color: theme.colors.textSecondary }, rtlText]}>
              {tt.chooseImageCancel}
            </Text>
          </TouchableOpacity>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  )

  const imagePreviewNode = (
    <Modal
      transparent
      visible={imagePreviewVisible}
      animationType="fade"
      onRequestClose={() => setImagePreviewVisible(false)}
    >
      <View style={[styles.previewOverlay, { backgroundColor: "rgba(0,0,0,0.85)" }]}>
        <TouchableOpacity style={styles.previewClose} activeOpacity={0.85} onPress={() => setImagePreviewVisible(false)}>
          <Feather name="x" size={22} color="#ffffff" />
        </TouchableOpacity>

        {imagePreviewUri ? (
          <Image source={{ uri: imagePreviewUri }} style={styles.previewImage} resizeMode="contain" />
        ) : null}
      </View>
    </Modal>
  )

  const overlaysNode = (
    <>
      {modalNode}
      {imageSourceSheetNode}
      {imagePreviewNode}
    </>
  )

  const handleSend = async () => {
    if (sending) return

    const trimmed = message.trim()
    if (trimmed.length < 10) {
      openModal({ title: tt.errorTitle, message: tt.messageTooShort, variant: "error" })
      return
    }

    if (!isLoggedIn) {
      openModal({
        title: tt.loginRequiredTitle,
        message: loginRequiredBody,
        variant: "info",
        primaryLabel: tt.login,
        onPrimary: () => navigation.navigate("Login"),
      })
      return
    }

    try {
      setSending(true)

      const { data, error } = await supabase.auth.getSession()
      if (error || !data?.session?.access_token) {
        openModal({
          title: tt.loginRequiredTitle,
          message: loginRequiredBody,
          variant: "info",
          primaryLabel: tt.login,
          onPrimary: () => navigation.navigate("Login"),
        })
        return
      }

      const result = await sendSupportRequest({
        token: data.session.access_token,
        message: variant === "suggestions" ? `[SUGGESTIONS] ${trimmed}` : trimmed,
        img: imageDataUri,
      })

      if (!result.success) {
        openModal({ title: tt.errorTitle, message: result.error, variant: "error" })
        return
      }

      setMessage("")
      setImageDataUri(null)
      setImagePreviewUri(null)
      openModal({ title: tt.successTitle, message: tt.successBody, variant: "success" })
    } catch (e: any) {
      openModal({ title: tt.errorTitle, message: e?.message || tt.unknownError, variant: "error" })
    } finally {
      setSending(false)
    }
  }

  const handleWhatsapp = () => {
    const text = encodeURIComponent(WHATSAPP_GREETING_EN)
    const url = `https://wa.me/${WHATSAPP_NUMBER_DIGITS}?text=${text}`
    Linking.openURL(url).catch(() => null)
  }

  const handleEmail = () => {
    const subject = encodeURIComponent(EMAIL_SUBJECT_EN)
    const body = encodeURIComponent("")
    const url = `mailto:${SUPPORT_EMAIL}?subject=${subject}&body=${body}`
    Linking.openURL(url).catch(() => null)
  }

  const handleWebsite = () => {
    Linking.openURL(WEBSITE_URL).catch(() => null)
  }

  const contactRowDirection = styles.rowLTR

  if (checkingAuth) {
    return (
      <View style={[styles.root, { backgroundColor: theme.colors.background }]}>
        <View style={styles.loadingBox}>
          <ActivityIndicator size="large" color={theme.colors.secondary} />
        </View>
        {overlaysNode}
      </View>
    )
  }

  if (!isLoggedIn) {
    return (
      <View style={[styles.root, { backgroundColor: theme.colors.background }]}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            activeOpacity={0.7}
            onPress={() => navigation.goBack()}
          >
            <Feather name="arrow-left" size={22} color={theme.colors.text} />
            <Text style={[styles.backText, { color: theme.colors.text }]}>{tt.back}</Text>
          </TouchableOpacity>

          <Text pointerEvents="none" style={[styles.headerTitle, { color: theme.colors.text }]}>
            {screenTitle}
          </Text>
        </View>

        <View style={styles.guestLayout}>
          <View style={styles.guestMain}>
            <Text style={[styles.title, { color: theme.colors.text }, rtlText]}>{tt.loginRequiredTitle}</Text>
            <Text style={[styles.subtitle, { color: theme.colors.textSecondary }, rtlText]}>{loginRequiredBody}</Text>

            <TouchableOpacity
              style={[styles.signInButton, { backgroundColor: theme.colors.secondary }]}
              activeOpacity={0.9}
              onPress={() => navigation.navigate("Login" as never)}
            >
              <Text style={[styles.signInButtonText, rtlText]}>{tt.login}</Text>
            </TouchableOpacity>
          </View>

          <View style={[styles.guestFooter, { borderTopColor: theme.colors.border }]}>
            <View style={styles.contactList}>
              <TouchableOpacity
                style={[styles.contactRow, contactRowDirection]}
                activeOpacity={0.85}
                onPress={handleWhatsapp}
              >
                <FontAwesome name="whatsapp" size={20} color="#25D366" />
                <Text style={[styles.contactText, { color: theme.colors.text }, ltrText]}>{WHATSAPP_NUMBER}</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.contactRow, contactRowDirection]}
                activeOpacity={0.85}
                onPress={handleEmail}
              >
                <FontAwesome name="envelope" size={18} color={theme.colors.secondary} />
                <Text style={[styles.contactText, { color: theme.colors.text }, ltrText]}>{SUPPORT_EMAIL}</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.contactRow, contactRowDirection]}
                activeOpacity={0.85}
                onPress={handleWebsite}
              >
                <FontAwesome name="globe" size={19} color={theme.colors.secondary} />
                <Text style={[styles.contactText, { color: theme.colors.text }, ltrText]}>{WEBSITE_URL}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
    )
  }

  return (
    <View style={[styles.root, { backgroundColor: theme.colors.background }]}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          activeOpacity={0.7}
          onPress={() => navigation.goBack()}
        >
          <Feather name="arrow-left" size={22} color={theme.colors.text} />
          <Text style={[styles.backText, { color: theme.colors.text }]}>{tt.back}</Text>
        </TouchableOpacity>

        <Text pointerEvents="none" style={[styles.headerTitle, { color: theme.colors.text }]}>
          {screenTitle}
        </Text>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.loggedContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        overScrollMode="never"
      >
        <View style={styles.formContainer}>
          <Text
            style={[
              styles.introText,
              { color: theme.colors.textSecondary, writingDirection: isRTL ? ("rtl" as const) : ("ltr" as const) },
            ]}
          >
            {screenIntro}
          </Text>

          <Text style={[styles.label, { color: theme.colors.textSecondary }, rtlText]}>{tt.messageLabel}</Text>
          <TextInput
            value={message}
            onChangeText={setMessage}
            placeholder={messagePlaceholder}
            placeholderTextColor={theme.colors.textSecondary}
            multiline
            style={[
              styles.textArea,
              {
                borderColor: theme.colors.border,
                color: theme.colors.text,
                textAlignVertical: "top",
                writingDirection: isRTL ? ("rtl" as const) : ("ltr" as const),
                textAlign: isRTL ? ("right" as const) : ("left" as const),
              },
            ]}
          />

          <Text style={[styles.label, { color: theme.colors.textSecondary }, rtlText]}>{tt.imageLabel}</Text>

          {imagePreviewUri ? (
            <View style={styles.imageBox}>
              <TouchableOpacity activeOpacity={0.9} onPress={() => setImagePreviewVisible(true)}>
                <Image source={{ uri: imagePreviewUri }} style={styles.imagePreview} />
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.imageRemoveButton, { backgroundColor: theme.isDark ? "rgba(0,0,0,0.55)" : "rgba(0,0,0,0.45)" }]}
                activeOpacity={0.85}
                onPress={handleRemoveImage}
              >
                <Feather name="x" size={18} color="#ffffff" />
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity
              style={[styles.secondaryButton, { borderColor: theme.colors.border }]}
              activeOpacity={0.85}
              onPress={openImageSourceSheet}
            >
              <Feather name="image" size={18} color={theme.colors.secondary} />
              <Text style={[styles.secondaryButtonText, { color: theme.colors.text }, rtlText]}>{tt.pickImage}</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={[styles.primaryButton, { backgroundColor: theme.colors.secondary }, sending && styles.primaryButtonDisabled]}
            activeOpacity={0.9}
            onPress={handleSend}
            disabled={sending}
          >
            <View style={{ alignItems: "center", justifyContent: "center" }}>
              <Text style={[styles.primaryButtonText, sending && { opacity: 0 }, rtlText]}>{tt.send}</Text>
              {sending && (
                <View style={{ position: "absolute" }}>
                  <ActivityIndicator color="#ffffff" />
                </View>
              )}
            </View>
          </TouchableOpacity>
        </View>
      </ScrollView>

      <View style={[styles.supportFooter, { borderTopColor: theme.colors.border }]}>
        <View style={styles.contactList}>
          <TouchableOpacity
            style={[styles.contactRow, contactRowDirection]}
            activeOpacity={0.85}
            onPress={handleWhatsapp}
          >
            <FontAwesome name="whatsapp" size={20} color="#25D366" />
            <Text style={[styles.contactText, { color: theme.colors.text }, ltrText]}>{WHATSAPP_NUMBER}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.contactRow, contactRowDirection]}
            activeOpacity={0.85}
            onPress={handleEmail}
          >
            <FontAwesome name="envelope" size={18} color={theme.colors.secondary} />
            <Text style={[styles.contactText, { color: theme.colors.text }, ltrText]}>{SUPPORT_EMAIL}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.contactRow, contactRowDirection]}
            activeOpacity={0.85}
            onPress={handleWebsite}
          >
            <FontAwesome name="globe" size={19} color={theme.colors.secondary} />
            <Text style={[styles.contactText, { color: theme.colors.text }, ltrText]}>{WEBSITE_URL}</Text>
          </TouchableOpacity>
        </View>
      </View>

      {overlaysNode}
    </View>
  )
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  loadingBox: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
    flexDirection: "row",
    alignItems: "center",
  },
  headerTitle: {
    position: "absolute",
    left: 0,
    right: 0,
    textAlign: "center",
    fontSize: 16,
    fontWeight: "700",
  },
  introText: {
    fontSize: 13,
    lineHeight: 18,
    textAlign: "center",
    marginBottom: 14,
  },
  backButton: {
    zIndex: 2,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  backText: {
    fontSize: 15,
  },
  scroll: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  loggedContent: {
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  formContainer: {
    paddingTop: 4,
    paddingBottom: 8,
  },
  card: {
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  cardNoBorder: {
    borderWidth: 0,
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 12,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 14,
    marginBottom: 14,
    textAlign: "center",
  },
  guestLayout: {
    flex: 1,
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  guestMain: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingBottom: 10,
  },
  guestFooter: {
    borderTopWidth: 1,
    paddingTop: 10,
    paddingBottom: 10,
  },
  supportFooter: {
    borderTopWidth: 1,
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 10,
  },
  rowLTR: {
    flexDirection: "row",
  },
  rowRTL: {
    flexDirection: "row-reverse",
  },
  signInButton: {
    alignSelf: "center",
    borderRadius: 999,
    paddingVertical: 10,
    paddingHorizontal: 28,
    marginBottom: 14,
  },
  signInButtonText: {
    color: "#ffffff",
    fontSize: 15,
    fontWeight: "700",
  },
  label: {
    fontSize: 13,
    marginBottom: 6,
  },
  textArea: {
    minHeight: 120,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 12,
  },
  secondaryButton: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginBottom: 12,
  },
  secondaryButtonText: {
    fontSize: 14,
    fontWeight: "700",
  },
  imageBox: {
    position: "relative",
    borderRadius: 12,
    overflow: "hidden",
    marginBottom: 12,
  },
  imagePreview: {
    width: "100%",
    height: 220,
    borderRadius: 12,
  },
  imageRemoveButton: {
    position: "absolute",
    top: 10,
    right: 10,
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  smallButton: {
    alignSelf: "flex-start",
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  smallButtonText: {
    fontSize: 13,
    fontWeight: "600",
  },
  primaryButton: {
    borderRadius: 12,
    paddingVertical: 14,
    marginBottom: 14,
  },
  primaryButtonDisabled: {
    opacity: 0.85,
  },
  primaryButtonText: {
    color: "#ffffff",
    fontSize: 15,
    fontWeight: "700",
    textAlign: "center",
  },
  contactList: {
    borderRadius: 12,
    paddingVertical: 6,
  },
  contactRow: {
    alignItems: "center",
    gap: 10,
    paddingVertical: 10,
  },
  contactText: {
    fontSize: 14,
    flex: 1,
  },
  modalOverlay: {
    flex: 1,
    paddingHorizontal: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  modalCard: {
    width: "100%",
    maxWidth: 420,
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 10,
  },
  modalHeaderRow: {
    alignItems: "center",
    gap: 8,
    marginBottom: 8,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: "800",
  },
  modalMessage: {
    fontSize: 13,
    lineHeight: 18,
  },
  modalActions: {
    marginTop: 12,
    alignItems: "center",
    justifyContent: "flex-end",
    gap: 10,
  },
  modalPrimaryButton: {
    borderRadius: 10,
    paddingVertical: 9,
    paddingHorizontal: 14,
  },
  modalPrimaryText: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "700",
  },
  modalOkButton: {
    paddingVertical: 8,
    paddingHorizontal: 10,
  },
  modalOkText: {
    fontSize: 14,
    fontWeight: "700",
  },
  sheetOverlay: {
    flex: 1,
    justifyContent: "flex-end",
  },
  sheetCard: {
    paddingTop: 10,
    paddingBottom: 14,
    paddingHorizontal: 16,
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
  },
  sheetTitle: {
    fontSize: 14,
    fontWeight: "800",
    marginBottom: 10,
    textAlign: "center",
  },
  sheetRow: {
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 10,
  },
  sheetRowText: {
    fontSize: 14,
    fontWeight: "700",
    flex: 1,
  },
  sheetCancel: {
    paddingVertical: 10,
    alignItems: "center",
  },
  sheetCancelText: {
    fontSize: 14,
    fontWeight: "700",
  },
  previewOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  previewImage: {
    width: "100%",
    height: "100%",
  },
  previewClose: {
    position: "absolute",
    top: 18,
    right: 18,
    zIndex: 2,
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "rgba(0,0,0,0.35)",
    alignItems: "center",
    justifyContent: "center",
  },
})
