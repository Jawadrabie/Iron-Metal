import { useCallback, useEffect, useRef, useState } from "react"
import { StatusBar } from "expo-status-bar"
import { Alert, Linking, Platform, StyleSheet } from "react-native"
import { GestureHandlerRootView } from "react-native-gesture-handler"
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context"
import * as SplashScreen from "expo-splash-screen"
import * as Notifications from "expo-notifications"
import { Feather, MaterialIcons, FontAwesome } from "@expo/vector-icons"
import { decode as decodeBase64 } from "base64-arraybuffer"

import { RootNavigator, navigationRef, type HomeDeepLinkParams } from "./navigation"
import { I18nProvider } from "./contexts/I18nContext"
import { ThemeProvider, useTheme } from "./contexts/ThemeContext"
import { SplashOverlay } from "./components/overlay/SplashOverlay"
SplashScreen.preventAutoHideAsync().catch(() => null)

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
})

let notificationNavTimeout: ReturnType<typeof setTimeout> | null = null
let deepLinkNavTimeout: ReturnType<typeof setTimeout> | null = null

function decodeBase64UrlToUtf8(value: string): string | null {
  try {
    const normalized = value.replace(/-/g, "+").replace(/_/g, "/")
    const padLength = (4 - (normalized.length % 4)) % 4
    const padded = normalized + "=".repeat(padLength)
    const buffer = decodeBase64(padded)
    if (typeof TextDecoder === "undefined") return null
    return new TextDecoder().decode(new Uint8Array(buffer))
  } catch {
    return null
  }
}

function parseHomeDeepLinkUrl(url: string): HomeDeepLinkParams | null {
  const trimmed = url.trim()

  const isAppScheme = /^ironmetal:\/\//i.test(trimmed) || /^ironmetal:/i.test(trimmed)

  const hostMatch = trimmed.match(/^https?:\/\/([^\/?#]+)/i)
  if (hostMatch) {
    const host = hostMatch[1].toLowerCase()
    // If it's the root domain request without specific paths/params, we might want to ignore it 
    // to allow browser handling, but since we use autoVerify=true, the app catches it.
    // We return null here if we don't recognize specific params, so the app remains on current screen
    // or goes to default home.
    if (host !== "iron-metal.net" && host !== "www.iron-metal.net") return null
  } else if (!isAppScheme) {
    return null
  }

  const queryIndex = trimmed.indexOf("?")
  if (queryIndex < 0) return null

  const query = trimmed.slice(queryIndex + 1).split("#")[0]
  if (!query) return null

  const params: Record<string, string> = {}
  for (const part of query.split("&")) {
    if (!part) continue
    const eqIndex = part.indexOf("=")
    const rawKey = eqIndex >= 0 ? part.slice(0, eqIndex) : part
    const rawValue = eqIndex >= 0 ? part.slice(eqIndex + 1) : ""
    const key = decodeURIComponent(rawKey)
    const value = decodeURIComponent(rawValue)
    params[key] = value
  }

  // Engineering Calculator Params
  const cidRaw = params.cid
  let calcId: number | undefined
  let calcInputs: Record<string, string | number> | undefined

  if (cidRaw != null) {
    const cidNum = Number.parseInt(cidRaw, 10)
    if (Number.isFinite(cidNum)) {
      calcId = cidNum
    }
  }

  if (params.i) {
    try {
      calcInputs = JSON.parse(params.i)
    } catch {
      const decoded = decodeBase64UrlToUtf8(params.i)
      if (decoded) {
        try {
          calcInputs = JSON.parse(decoded)
        } catch {
          // ignore invalid json
        }
      }
    }
  }

  const sidRaw = params.sid
  let sid: number | undefined
  if (sidRaw != null) {
    const sidNum = Number.parseInt(sidRaw, 10)
    sid = Number.isFinite(sidNum) ? sidNum : undefined
  }

  const cmRaw = params.cm
  const cm = cmRaw === "1" || String(cmRaw || "").toLowerCase() === "true"

  // Must have either section ID or calculator ID
  if (sid == null && calcId == null) return null

  const type = params.type ? String(params.type) : undefined

  const viRaw = params.vi
  const viNum = viRaw != null ? Number.parseInt(viRaw, 10) : undefined
  const vi = viNum != null && Number.isFinite(viNum) ? viNum : undefined

  const svRaw = params.sv
  const svNum = svRaw != null ? Number.parseFloat(svRaw) : undefined
  const sv = svNum != null && Number.isFinite(svNum) ? svNum : undefined

  return {
    sid,
    type,
    vi,
    sv,
    calcId,
    calcInputs,
    cm,
    url: trimmed,
    nonce: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
  }
}

function navigateToHomeDeepLink(deepLink: HomeDeepLinkParams) {
  if (deepLinkNavTimeout) {
    clearTimeout(deepLinkNavTimeout)
    deepLinkNavTimeout = null
  }

  let attempts = 0
  const attemptNavigate = () => {
    if (navigationRef.isReady()) {
      if (deepLink.calcId != null) {
        navigationRef.navigate("EngineeringCalculations", {
          calcId: deepLink.calcId,
          calcInputs: deepLink.calcInputs,
        })
      } else {
        navigationRef.navigate("Home", { initialTab: "home", deepLink })
      }
      return
    }

    attempts += 1
    if (attempts > 20) return

    deepLinkNavTimeout = setTimeout(attemptNavigate, 250)
  }

  attemptNavigate()
}

function navigateToNotificationsTab() {
  if (notificationNavTimeout) {
    clearTimeout(notificationNavTimeout)
    notificationNavTimeout = null
  }
  if (navigationRef.isReady()) {
    navigationRef.navigate("Home", { initialTab: "notifications" })
  } else {
    notificationNavTimeout = setTimeout(() => {
      notificationNavTimeout = null
      if (navigationRef.isReady()) {
        navigationRef.navigate("Home", { initialTab: "notifications" })
      }
    }, 500)
  }
}

export default function App() {
  const [fontsReady, setFontsReady] = useState(false)
  const [showSplashOverlay, setShowSplashOverlay] = useState(true)
  const nativeSplashHiddenRef = useRef(false)
  const handledInitialNotificationResponseRef = useRef(false)

  useEffect(() => {
    let mounted = true

    // Check for missing env vars
    if (!process.env.EXPO_PUBLIC_SUPABASE_URL || !process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY) {
      if (Platform.OS !== 'web') {
        setTimeout(() => {
          Alert.alert(
            "تنبيه",
            "متغيرات البيئة للاتصال غير موجودة. لن يعمل تسجيل الدخول.\n(Supabase Env Vars Missing)",
            [{ text: "OK" }]
          )
        }, 1000)
      }
    }

    const load = async () => {
      try {
        await Promise.all([Feather.loadFont(), MaterialIcons.loadFont(), FontAwesome.loadFont()])
      } catch (error) {
        console.warn("Failed to load icon fonts", error)
      } finally {
        if (mounted) {
          setFontsReady(true)
        }
      }
    }

    load()
    return () => {
      mounted = false
    }
  }, [])

  useEffect(() => {
    return () => {
      if (notificationNavTimeout) {
        clearTimeout(notificationNavTimeout)
        notificationNavTimeout = null
      }

      if (deepLinkNavTimeout) {
        clearTimeout(deepLinkNavTimeout)
        deepLinkNavTimeout = null
      }
    }
  }, [])

  useEffect(() => {
    const handleIncomingUrl = (url: string) => {
      const deepLink = parseHomeDeepLinkUrl(url)
      if (!deepLink) return
      navigateToHomeDeepLink(deepLink)
    }

    Linking.getInitialURL()
      .then((url: string | null) => {
        if (url) {
          handleIncomingUrl(url)
        }
      })
      .catch(() => undefined)

    const subscription = Linking.addEventListener("url", ({ url }: { url: string }) => {
      handleIncomingUrl(url)
    })

    return () => {
      subscription.remove()
    }
  }, [])

  useEffect(() => {
    const subscription = Notifications.addNotificationResponseReceivedListener(() => {
      handledInitialNotificationResponseRef.current = true
      navigateToNotificationsTab()
      Notifications.clearLastNotificationResponseAsync().catch(() => null)
    })

    Notifications.getLastNotificationResponseAsync()
      .then((response: Notifications.NotificationResponse | null) => {
        if (handledInitialNotificationResponseRef.current) return

        if (response) {
          handledInitialNotificationResponseRef.current = true
          navigateToNotificationsTab()
          Notifications.clearLastNotificationResponseAsync().catch(() => null)
        }
      })
      .catch(() => {
        // ignore
      })

    return () => {
      subscription.remove()
    }
  }, [])

  const handleLayout = useCallback(() => {
    if (nativeSplashHiddenRef.current) return
    nativeSplashHiddenRef.current = true
    SplashScreen.hideAsync().catch(() => null)
  }, [])

  return (
    <ThemeProvider>
      <ThemedAppRoot
        fontsReady={fontsReady}
        showSplashOverlay={showSplashOverlay}
        onSplashDone={() => setShowSplashOverlay(false)}
        onLayout={handleLayout}
      />
    </ThemeProvider>
  )
}

function ThemedAppRoot({
  fontsReady,
  showSplashOverlay,
  onSplashDone,
  onLayout,
}: {
  fontsReady: boolean
  showSplashOverlay: boolean
  onSplashDone: () => void
  onLayout: () => void
}) {
  const theme = useTheme()

  return (
    <GestureHandlerRootView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      <SafeAreaProvider>
        <SafeAreaView
          style={[styles.container, { backgroundColor: theme.colors.background }]}
          edges={["top"]}
          onLayout={onLayout}
        >
          {fontsReady ? (
            <I18nProvider>
              <RootNavigator />
            </I18nProvider>
          ) : null}
          <StatusBar style={theme.isDark ? "light" : "dark"} />
        </SafeAreaView>
      </SafeAreaProvider>

      <SplashOverlay visible={showSplashOverlay} onDone={onSplashDone} />
    </GestureHandlerRootView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#ffffff",
  },
})
