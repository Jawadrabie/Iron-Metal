import { useEffect, useRef, useState } from "react"
import { Alert } from "react-native"
import * as ImagePicker from "expo-image-picker"
import * as FileSystem from "expo-file-system/legacy"
import { decode } from "base64-arraybuffer"

import { getCurrentUser, getUserProfile, logout } from "../lib/auth"
import { supabase } from "../lib/supabase/client"
import { COUNTRIES } from "../components/home/AccountModal"
import { useI18n } from "../contexts/I18nContext"
import { profileTexts } from "../locales/profile"
import { getStoredLanguage, setStoredLanguage, type AppLanguage } from "./useLanguage"

export type BannerType = "success" | "error" | null

type SaveBaseline = {
  fullName: string
  email: string
  phone: string
  country: string
}

export function useProfileScreen() {
  const { language: preferredLanguage, setLanguage } = useI18n()

  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<any | null>(null)
  const [profile, setProfile] = useState<any | null>(null)
  const [saving, setSaving] = useState(false)
  const [fullName, setFullName] = useState("")
  const [email, setEmail] = useState("")
  const [phone, setPhone] = useState("")
  const [country, setCountry] = useState("SA")
  const [avatarUrl, setAvatarUrl] = useState("")
  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const [hideStatus, setHideStatus] = useState(false)
  const [hideContacts, setHideContacts] = useState(false)
  const [marketing, setMarketing] = useState(false)
  const [emailVerified, setEmailVerified] = useState(false)
  const [showCountryPicker, setShowCountryPicker] = useState(false)
  const [showLanguagePicker, setShowLanguagePicker] = useState(false)
  const [bannerMessage, setBannerMessage] = useState<string | null>(null)
  const [bannerType, setBannerType] = useState<BannerType>(null)
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false)

  const saveBaselineRef = useRef<SaveBaseline | null>(null)

  const bannerTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const showBanner = (type: Exclude<BannerType, null>, message: string) => {
    setBannerType(type)
    setBannerMessage(message)

    if (bannerTimeoutRef.current) {
      clearTimeout(bannerTimeoutRef.current)
    }

    bannerTimeoutRef.current = setTimeout(() => {
      setBannerMessage(null)
      setBannerType(null)
      bannerTimeoutRef.current = null
    }, 2500)
  }

  useEffect(() => {
    let cancelled = false

    const load = async () => {
      setLoading(true)
      let lang: AppLanguage = preferredLanguage
      try {
        const storedLanguage = await getStoredLanguage()
        if (!cancelled && storedLanguage) {
          lang = storedLanguage
          setLanguage(storedLanguage)
        }

        const { user } = await getCurrentUser()
        if (!user || cancelled) {
          setUser(null)
          setProfile(null)
          return
        }

        const { profile } = await getUserProfile(user.id)
        if (cancelled) return

        const p = profile || null
        setUser(user)
        setProfile(p)
        const nextFullName = p?.full_name ?? ""
        const nextEmail = user.email ?? ""
        const nextPhone = p?.phone ?? ""

        setFullName(nextFullName)
        setEmail(nextEmail)
        setPhone(nextPhone)

        const profileLanguageRaw = p?.preferred_language
        const profileLanguage: AppLanguage | null =
          profileLanguageRaw === "ar" || profileLanguageRaw === "en"
            ? profileLanguageRaw
            : null

        const initialLanguage = storedLanguage ?? profileLanguage ?? "en"
        lang = initialLanguage
        setLanguage(initialLanguage)
        void setStoredLanguage(initialLanguage)

        const nextCountry = p?.country ?? "SA"
        setCountry(nextCountry)

        saveBaselineRef.current = {
          fullName: nextFullName,
          email: nextEmail,
          phone: nextPhone,
          country: nextCountry,
        }
        setAvatarUrl(
          p?.avatar_url ||
            (user.user_metadata && user.user_metadata.avatar_url) ||
            "",
        )
        setHideStatus(!(p?.show_status ?? true))
        setHideContacts(p?.hide_contacts ?? false)
        setMarketing(p?.marketing_opt_in ?? false)
        setEmailVerified(
          !!user.user_metadata?.email_verified || !!p?.is_verified,
        )
      } catch (e: any) {
        if (!cancelled) {
          const t = profileTexts[lang].messages
          Alert.alert(t.errorTitle, e?.message || t.loadAccountFailed)
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()

    return () => {
      cancelled = true

      if (bannerTimeoutRef.current) {
        clearTimeout(bannerTimeoutRef.current)
      }
    }
  }, [])

  const setPreferredLanguage = (value: string) => {
    const lang: AppLanguage = value === "en" ? "en" : "ar"
    setLanguage(lang)
  }

  const selectedCountry = (COUNTRIES as unknown as any[]).find(
    (c: any) => c.code === country,
  )

  const handleLogout = async () => {
    const t = profileTexts[preferredLanguage].messages
    await logout()
    setUser(null)
    setProfile(null)
    showBanner("success", t.logoutSuccess)
  }

  const handleSave = async () => {
    if (!user) return

    const t = profileTexts[preferredLanguage].messages

    try {
      setSaving(true)

      let nextEmail = user.email ?? ""

      if (email && email !== user.email) {
        const { error } = await supabase.auth.updateUser({ email })
        if (error) throw error
        nextEmail = email
      }

      const { error: upErr } = await supabase
        .from("profiles")
        .update({
          full_name: fullName,
          phone,
          preferred_language: preferredLanguage,
          country,
          show_status: !hideStatus,
          hide_contacts: hideContacts,
          marketing_opt_in: marketing,
        })
        .eq("id", user.id)

      if (upErr) throw upErr

      saveBaselineRef.current = {
        fullName,
        email: nextEmail,
        phone,
        country,
      }
      showBanner("success", t.saveSuccess)
    } catch (e: any) {
      showBanner("error", e?.message || t.saveFailed)
    } finally {
      setSaving(false)
    }
  }

  const handlePickAvatar = async () => {
    if (!user) return

    const t = profileTexts[preferredLanguage].messages

    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync()
      if (status !== "granted") {
        Alert.alert(t.noticeTitle, t.photosPermission)
        return
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      })

      if (result.canceled || !result.assets || result.assets.length === 0) return

      const asset = result.assets[0]
      if (!asset.uri) return

      setUploadingAvatar(true)

      const extFromName = asset.fileName?.split(".").pop()
      const fileExt = extFromName || "jpg"
      const fileName = `${user.id}-${Date.now()}.${fileExt}`

      const mimeType =
        (asset as any).mimeType ||
        (fileExt === "jpg" || fileExt === "jpeg" ? "image/jpeg" : `image/${fileExt}`)

      const base64 = await FileSystem.readAsStringAsync(asset.uri, {
        encoding: "base64" as any,
      })

      const arrayBuffer = decode(base64)

      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(fileName, arrayBuffer, { contentType: mimeType, upsert: true })
      if (uploadError) throw uploadError

      const { data } = supabase.storage.from("avatars").getPublicUrl(fileName)
      const publicUrl = data.publicUrl

      const { error: updateError } = await supabase
        .from("profiles")
        .update({ avatar_url: publicUrl })
        .eq("id", user.id)
      if (updateError) throw updateError

      setAvatarUrl(publicUrl)
      showBanner("success", t.avatarUpdated)
    } catch (e: any) {
      showBanner("error", e?.message || t.avatarUpdateFailed)
    } finally {
      setUploadingAvatar(false)
    }
  }

  return {
    loading,
    user,
    profile,
    saving,
    fullName,
    email,
    phone,
    preferredLanguage,
    country,
    avatarUrl,
    uploadingAvatar,
    hideStatus,
    hideContacts,
    marketing,
    emailVerified,
    showCountryPicker,
    showLanguagePicker,
    bannerMessage,
    bannerType,
    showLogoutConfirm,
    selectedCountry,
    canSave:
      !!user &&
      !!saveBaselineRef.current &&
      (fullName.trim() !== saveBaselineRef.current.fullName.trim() ||
        email.trim().toLowerCase() !== saveBaselineRef.current.email.trim().toLowerCase() ||
        phone.trim() !== saveBaselineRef.current.phone.trim() ||
        country !== saveBaselineRef.current.country),
    setFullName,
    setEmail,
    setPhone,
    setPreferredLanguage,
    setCountry,
    setShowCountryPicker,
    setShowLanguagePicker,
    setShowLogoutConfirm,
    handleSave,
    handlePickAvatar,
    handleLogout,
  }
}
