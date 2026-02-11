import { Alert, Linking, Platform } from "react-native"
import * as IntentLauncher from "expo-intent-launcher"

export const WEBSITE_URL = "https://iron-metal.net/"

export const openWebsite = async (url?: string) => {
  try {
    const targetUrl = url ?? WEBSITE_URL

    if (Platform.OS === "android") {
      // Prefer opening an external browser by targeting a known browser package.
      // This avoids App Links re-opening the app when the URL is https://iron-metal.net.
      // Note: expo-intent-launcher requires className to target a package.
      
      const browserTargets = [
        { pkg: "com.android.chrome", cls: "com.google.android.apps.chrome.Main" },
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

      // Fallback: if no specific browser is found, use http to force the system browser.
      if (externalUrl.includes("iron-metal.net")) {
        const httpUrl = externalUrl.replace(/^https:\/\//i, "http://")
        await Linking.openURL(httpUrl)
        return
      }
    }

    const supported = await Linking.canOpenURL(targetUrl)
    if (supported) {
      await Linking.openURL(targetUrl)
      return
    }

    // Fallback: try the WEBSITE_URL via system handler
    await Linking.openURL(WEBSITE_URL)
  } catch (error) {
    console.error("Error opening website:", error)
    Alert.alert("خطأ", "لا يمكن فتح الموقع حالياً")
  }
}


