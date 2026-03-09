type DetectCountryOptions = {
  ipGeoApiKey?: string
  logPrefix?: string
}

const DEFAULT_LOG_PREFIX = "[currency]"

function normalizeCountryCode(value: unknown): string | null {
  if (typeof value !== "string") return null
  const normalized = value.trim().toUpperCase()
  if (normalized.length < 2) return null
  return normalized.slice(0, 2)
}

function detectCountryCodeFromLocale(): string | null {
  try {
    const locale = Intl?.DateTimeFormat?.().resolvedOptions?.().locale || ""
    const match = String(locale).match(/[-_]([A-Za-z]{2})$/)
    return normalizeCountryCode(match?.[1])
  } catch {
    return null
  }
}

function detectCountryCodeFromTimeZone(): string | null {
  try {
    const tz = Intl?.DateTimeFormat?.().resolvedOptions?.().timeZone || ""
    const normalizedTz = String(tz).trim()
    if (normalizedTz === "Asia/Damascus") return "SY"
    if (normalizedTz === "Asia/Riyadh") return "SA"
    if (normalizedTz === "Asia/Dubai") return "AE"
    if (normalizedTz === "Asia/Kuwait") return "KW"
    if (normalizedTz === "Asia/Qatar") return "QA"
    if (normalizedTz === "Asia/Bahrain") return "BH"
    if (normalizedTz === "Asia/Muscat") return "OM"
    if (normalizedTz === "Asia/Amman") return "JO"
    if (normalizedTz === "Asia/Beirut") return "LB"
    if (normalizedTz === "Africa/Cairo") return "EG"
    return null
  } catch {
    return null
  }
}

export async function detectCountryCodeByIp(options: DetectCountryOptions = {}): Promise<string | null> {
  const { ipGeoApiKey, logPrefix = DEFAULT_LOG_PREFIX } = options

  if (ipGeoApiKey) {
    try {
      console.log(`${logPrefix} fetching IP info from ipgeolocation.io ...`)
      const response = await fetch(
        `https://api.ipgeolocation.io/ipgeo?apiKey=${ipGeoApiKey}&fields=ip,country_name,country_code2`,
      )
      console.log(`${logPrefix} ipgeolocation status`, response.status)

      if (response.ok) {
        const data = await response.json().catch(() => null)
        const countryCode = normalizeCountryCode(data?.country_code2)
        if (countryCode) return countryCode
        console.warn(`${logPrefix} missing country_code2 in ipgeolocation payload`)
      } else {
        console.warn(`${logPrefix} ipgeolocation response not ok`)
      }
    } catch (error) {
      console.warn(`${logPrefix} ipgeolocation request failed`, error)
    }
  } else {
    console.warn(`${logPrefix} missing EXPO_PUBLIC_IPGEO_API_KEY, trying fallback provider`)
  }

  try {
    console.log(`${logPrefix} trying fallback provider ipapi.co ...`)
    const fallbackResponse = await fetch("https://ipapi.co/json/")
    console.log(`${logPrefix} ipapi.co status`, fallbackResponse.status)

    if (!fallbackResponse.ok) {
      console.warn(`${logPrefix} ipapi.co response not ok`)
    } else {
      const fallbackData = await fallbackResponse.json().catch(() => null)
      const fallbackCountryCode = normalizeCountryCode(fallbackData?.country_code)
      if (!fallbackCountryCode) {
        console.warn(`${logPrefix} missing country_code in ipapi.co payload`)
      } else {
        console.log(`${logPrefix} fallback resolved country`, fallbackCountryCode)
        return fallbackCountryCode
      }
    }
  } catch (error) {
    console.warn(`${logPrefix} fallback provider failed`, error)
  }

  try {
    console.log(`${logPrefix} trying fallback provider ipwho.is ...`)
    const fallbackResponse2 = await fetch("https://ipwho.is/")
    console.log(`${logPrefix} ipwho.is status`, fallbackResponse2.status)

    if (!fallbackResponse2.ok) {
      console.warn(`${logPrefix} ipwho.is response not ok`)
    } else {
      const fallbackData2 = await fallbackResponse2.json().catch(() => null)
      const fallbackCountryCode2 = normalizeCountryCode(fallbackData2?.country_code)
      if (!fallbackCountryCode2) {
        console.warn(`${logPrefix} missing country_code in ipwho.is payload`)
      } else {
        console.log(`${logPrefix} fallback resolved country`, fallbackCountryCode2)
        return fallbackCountryCode2
      }
    }
  } catch (error) {
    console.warn(`${logPrefix} ipwho.is failed`, error)
  }

  const localeCountry = detectCountryCodeFromLocale()
  if (localeCountry) {
    console.log(`${logPrefix} resolved country from locale`, localeCountry)
    return localeCountry
  }

  const timeZoneCountry = detectCountryCodeFromTimeZone()
  if (timeZoneCountry) {
    console.log(`${logPrefix} resolved country from timezone`, timeZoneCountry)
    return timeZoneCountry
  }

  return null
}