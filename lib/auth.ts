import { supabase } from "./supabase/client"
import { Alert } from "react-native"
import { getStoredLanguage } from "../hooks/useLanguage"

const normalizeBaseUrl = (value: string) => value.replace(/\/+$/, "")

const normalizeIntl = (input: string) => {
  let p = (input || "").trim().replace(/\s+/g, "")
  if (p.startsWith("00")) p = "+" + p.slice(2)
  if (!p.startsWith("+") && p.startsWith("963")) p = "+" + p
  if (!p.startsWith("+")) p = "+" + p
  p = p.replace(/^\+0+(\d)/, "+$1")
  return p
}

const RAW_SITE_URL = String(process.env.EXPO_PUBLIC_SITE_URL || "").trim()
const API_BASE_URL = normalizeBaseUrl(
  RAW_SITE_URL && !/supabase\.co/i.test(RAW_SITE_URL)
    ? RAW_SITE_URL
    : "https://iron-metal.net",
)

function formatNetworkError(error: any, lang: string = "en") {
  const name = String(error?.name || "")
  const message = String(error?.message || "")
  const raw = `${name} ${message}`.toLowerCase()

  const isArabic = lang === "ar"

  if (
    message === "TIMEOUT" ||
    name === "AbortError" ||
    raw.includes("abort") ||
    raw.includes("timeout")
  ) {
    return isArabic
      ? "انتهت مهلة الاتصال. حاول مرة أخرى."
      : "Network timeout. Please try again."
  }

  if (raw.includes("network request failed") || raw.includes("failed to fetch")) {
    return isArabic
      ? "تعذر الاتصال بخادم تسجيل الدخول. تحقق من الشبكة أو حدّث التطبيق إلى آخر نسخة."
      : "Unable to reach the login server. Check your network or update the app to the latest version."
  }

  return message || (isArabic ? "خطأ في الاتصال" : "Network error")
}

async function postJson(url: string, body: unknown) {
  const controller = typeof AbortController !== "undefined" ? new AbortController() : null
  const timeoutMs = 15000
  let timeoutId: ReturnType<typeof setTimeout> | null = null

  const timeoutPromise = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => {
      try {
        controller?.abort()
      } catch {
      }
      reject(new Error("TIMEOUT"))
    }, timeoutMs)
  })

  const fetchPromise = (async () => {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
      signal: controller?.signal,
    })

    const text = await res.text().catch(() => "")
    let json: any = null
    try {
      json = text ? JSON.parse(text) : {}
    } catch {
      json = null
    }

    return { res, json, text }
  })()

  try {
    return await Promise.race([fetchPromise, timeoutPromise])
  } finally {
    if (timeoutId) clearTimeout(timeoutId)
  }
}

export async function sendWhatsappOtpMobile(phone: string, lang: string = "en") {
  try {
    const normalizedPhone = normalizeIntl(phone)
    const primaryUrl = `${API_BASE_URL}/api/mobile/auth/whatsapp/send`

    const { res, json, text } = await postJson(primaryUrl, {
      phone: normalizedPhone,
      lang,
    })

    if (!res.ok || json?.success === false) {
      const fallbackText =
        lang === "ar" ? `فشل إرسال كود واتساب (${res.status})` : `Failed to send WhatsApp code (${res.status})`

      const message =
        json?.error ||
        json?.message ||
        (text ? `${text}`.slice(0, 200) : null) ||
        fallbackText

      return { success: false, error: message }
    }

    const requestId =
      json?.requestId || json?.data?.requestId || json?.transactionId || ""

    return { success: true, requestId }
  } catch (e: any) {
    return {
      success: false,
      error: formatNetworkError(e, lang),
    }
  }
}

export async function verifyWhatsappOtpMobile(args: {
  phone: string
  code: string
  requestId?: string
}, lang: string = "en") {
  try {
    const normalizedCode = String(args.code || "").trim()
    const normalizedArgs = {
      ...args,
      phone: normalizeIntl(args.phone),
      code: normalizedCode,
      otp: normalizedCode,
    }
    const primaryUrl = `${API_BASE_URL}/api/mobile/auth/whatsapp/verify`

    const { res, json, text } = await postJson(primaryUrl, normalizedArgs)

    if (!res.ok || json?.success === false) {
      const fallbackText =
        lang === "ar" ? `رمز تحقق غير صحيح (${res.status})` : `Invalid verification code (${res.status})`

      const message =
        json?.error ||
        json?.message ||
        (text ? `${text}`.slice(0, 200) : null) ||
        fallbackText

      return { success: false, error: message }
    }

    const session =
      json?.session ||
      json?.data?.session ||
      null

    const accessToken =
      session?.access_token ||
      session?.accessToken ||
      null

    const refreshToken =
      session?.refresh_token ||
      session?.refreshToken ||
      null

    if (!accessToken || !refreshToken) {
      return {
        success: false,
        error:
          lang === "ar"
            ? "لم تكتمل جلسة تسجيل الدخول. حاول مرة أخرى."
            : "Login session was not created. Please try again.",
      }
    }

    const { error: setSessionError } = await supabase.auth.setSession({
      access_token: accessToken,
      refresh_token: refreshToken,
    })

    if (setSessionError) {
      const msg = setSessionError.message?.toLowerCase() || ""
      const isBlocked = msg.includes("network request failed") || msg.includes("failed to fetch")
      const fallbackError = isBlocked
        ? (lang === "ar"
          ? "اتصالك يحظر خوادم التطبيق (Supabase). يرجى تشغيل كاسر بروكسي (VPN) والمحاولة."
          : "Your connection blocks the app's servers (Supabase). Please enable a VPN.")
        : (lang === "ar"
          ? "فشل حفظ جلسة تسجيل الدخول. حاول مرة أخرى."
          : "Failed to persist login session. Please try again.")

      return {
        success: false,
        error: isBlocked ? fallbackError : (formatNetworkError(setSessionError, lang) || fallbackError),
      }
    }

    const verifiedUser =
      json?.user ||
      session?.user ||
      null

    return {
      success: true,
      user: verifiedUser,
      session,
    }
  } catch (e: any) {
    return { success: false, error: formatNetworkError(e, lang) }
  }
}

export async function getCurrentUser() {
  const { data: sessionData, error: sessionError } = await supabase.auth.getSession()

  if (sessionError) {
    const msg = String(sessionError.message || "").toLowerCase()
    const hasInvalidRefreshToken =
      msg.includes("invalid refresh token") ||
      msg.includes("refresh token not found") ||
      msg.includes("session not found")

    if (hasInvalidRefreshToken) {
      await supabase.auth.signOut().catch(() => null)
      return { user: null }
    }
  }

  if (sessionData?.session?.user) {
    return { user: sessionData.session.user }
  }

  const { data, error } = await supabase.auth.getUser()
  if (error) {
    return {
      user: null,
      error: error.message || sessionError?.message,
    }
  }

  return { user: data?.user ?? null, error: sessionError?.message }
}

export async function getUserProfile(userId: string) {
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .single()

  if (error) return { profile: null, error: error.message }
  return { profile: data }
}

export async function logout(lang?: "ar" | "en") {
  const { error } = await supabase.auth.signOut()
  if (error) {
    let resolvedLang: "ar" | "en" = lang === "ar" ? "ar" : "en"
    if (!lang) {
      const stored = await getStoredLanguage()
      resolvedLang = stored === "ar" ? "ar" : "en"
    }

    Alert.alert(resolvedLang === "ar" ? "خطأ" : "Error", error.message)
  }
}
