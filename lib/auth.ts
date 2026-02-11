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
    const fallbackUrl = `${API_BASE_URL}/api/mobile/mobile/auth/whatsapp/send`

    let { res, json, text } = await postJson(primaryUrl, {
      phone: normalizedPhone,
      lang,
    })
    if (res.status === 404) {
      ;({ res, json, text } = await postJson(fallbackUrl, {
        phone: normalizedPhone,
        lang,
      }))
    }

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
    const normalizedArgs = { ...args, phone: normalizeIntl(args.phone) }
    const primaryUrl = `${API_BASE_URL}/api/mobile/auth/whatsapp/verify`
    const fallbackUrl = `${API_BASE_URL}/api/mobile/mobile/auth/whatsapp/verify`

    let { res, json, text } = await postJson(primaryUrl, normalizedArgs)
    if (res.status === 404) {
      ;({ res, json, text } = await postJson(fallbackUrl, normalizedArgs))
    }

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

    const session = json?.session
    if (session?.access_token && session?.refresh_token) {
      await supabase.auth.setSession({
        access_token: session.access_token,
        refresh_token: session.refresh_token,
      })
    }

    return {
      success: true,
      user: json?.user ?? null,
      profile: json?.profile ?? null,
    }
  } catch (e: any) {
    return { success: false, error: formatNetworkError(e, lang) }
  }
}

export async function getCurrentUser() {
  const { data, error } = await supabase.auth.getUser()
  if (error) return { user: null, error: error.message }
  return { user: data?.user ?? null }
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
