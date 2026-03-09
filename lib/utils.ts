import { Alert, Linking, Platform } from "react-native"
import * as IntentLauncher from "expo-intent-launcher"

export const WEBSITE_URL = "https://iron-metal.net"

function normalizeWebsiteUrl(url?: string): string {
  const raw = String(url ?? WEBSITE_URL).trim()
  if (!raw) return WEBSITE_URL

  if (/^https?:\/\//i.test(raw)) {
    if (/^https:\/\/iron-metal\.net\/?$/i.test(raw)) return WEBSITE_URL
    return raw
  }

  if (/^iron-metal\.net\/?$/i.test(raw)) return WEBSITE_URL
  return `https://${raw}`
}

export const openWebsite = async (url?: string) => {
  try {
    const targetUrl = normalizeWebsiteUrl(url)

    if (Platform.OS === "android") {
      // Prefer opening an external browser by targeting a known browser package.
      // This avoids App Links re-opening the app when the URL is https://iron-metal.net.
      // Note: expo-intent-launcher requires className to target a package.
      
      const browserTargets = [
        { pkg: "com.android.chrome", cls: "com.google.android.apps.chrome.Main" },
        { pkg: "com.microsoft.emmx", cls: "com.microsoft.ruby.Main" },
        { pkg: "com.sec.android.app.sbrowser", cls: "com.sec.android.app.sbrowser.SBrowserMainActivity" },
        { pkg: "org.mozilla.firefox", cls: "org.mozilla.firefox.App" },
      ]

      const externalUrl = targetUrl
      for (const target of browserTargets) {
        try {
          await IntentLauncher.startActivityAsync('android.intent.action.VIEW', {
            data: externalUrl,
            packageName: target.pkg,
            className: target.cls,
          })
          return
        } catch {
          // Try next browser package
        }
      }
    }

    const supported = await Linking.canOpenURL(targetUrl)
    if (supported) {
      await Linking.openURL(targetUrl)
      return
    }

    await Linking.openURL(WEBSITE_URL)
  } catch (error) {
    console.error("Error opening website:", error)
    Alert.alert("خطأ", "لا يمكن فتح الموقع حالياً")
  }
}


