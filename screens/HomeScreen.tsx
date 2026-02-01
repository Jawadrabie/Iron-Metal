import { useEffect, useRef, useState } from "react"
import { ActivityIndicator, KeyboardAvoidingView, Linking, Platform, StyleSheet, Text, TouchableOpacity, TouchableWithoutFeedback, View, useWindowDimensions } from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import { useNavigation, useRoute, type RouteProp } from "@react-navigation/native"

import { AppBar } from "../components/layout/AppBar"
import { HomeMainContent } from "../components/home/HomeMainContent"
import { BottomTabNavigator, type TabKey } from "../components/navigation/BottomTabNavigator"
import { useTheme } from "../contexts/ThemeContext"
import { useAssetWarmup } from "../hooks/useAssetWarmup"
import { useCatalogData } from "../hooks/useCatalogData"
import { useHomeTabs } from "../hooks/useHomeTabs"
import { useSectionSelection } from "../hooks/useSectionSelection"
import { useVisitorStats } from "../hooks/useVisitorStats"
import { useNotifications, type NotificationRow } from "../hooks/useNotifications"
import { useHomeFeaturedFromRoute } from "../hooks/useHomeFeaturedFromRoute"
import { CalculatorModal } from "../components/home/CalculatorModal"
import { MoreMenuModal } from "../components/home/MoreMenuModal"
import { NotificationsScreen } from "./NotificationsScreen"
import ProfileScreen from "./ProfileScreen"
import type { HomeDeepLinkParams, RootStackParamList } from "../navigation"
import type { FeaturedSectorRow } from "../lib/featured-sectors"
import { registerForPushNotificationsAsync } from "../lib/notifications/registerPushToken"
import { useLanguage } from "../hooks/useLanguage"

const STRINGS = {
  en: {
    catalogLoadFailed: "Failed to load catalog data. Please try again later.",
    underDevTitle: "Under development",
    underDevBody: "This feature is under development.",
    ok: "OK",
  },
  ar: {
    catalogLoadFailed: "تعذر تحميل بيانات الكتالوج. جرّب لاحقاً.",
    underDevTitle: "قيد التطوير",
    underDevBody: "هذه الميزة قيد التطوير حالياً.",
    ok: "موافق",
  },
} as const

export function HomeScreen() {
  const theme = useTheme()
  const { language } = useLanguage("en")
  const t = STRINGS[language]
  const isRTL = language === "ar"
  const navigation = useNavigation()
  const { data, loading, error } = useCatalogData()
  const route = useRoute<RouteProp<RootStackParamList, "Home">>()
  const initialTabParam = route?.params?.initialTab
  const initialTabFromRoute = initialTabParam ?? "home"
  const deepLinkFromRoute = route?.params?.deepLink as HomeDeepLinkParams | undefined
  const {
    selectedSectionId,
    selectedSection,
    selectedType,
    currentVariant,
    currentVariants,
    selectedVariantIndex,
    sliderValue,
    handleSectionChange,
    handleTypeToggle,
    handleVariantSelect,
    handleSliderChange,
  } = useSectionSelection(data)

  useAssetWarmup(data)
  const { stats } = useVisitorStats()
  const {
    items: notifications,
    loading: notificationsLoading,
    error: notificationsError,
    unreadCount,
    refresh: refreshNotifications,
    markAllAsRead,
    markAsRead,
    isGuest: notificationsGuest,
  } = useNotifications()
  const previousTabRef = useRef<TabKey | null>(null)
  const insets = useSafeAreaInsets()
  const { width } = useWindowDimensions()
  const tabHorizontalMargin = width * 0.05
  const {
    activeTab,
    displayTab,
    setActiveTab,
    moreVisible,
    handleTabChange,
    handleCloseMore,
  } = useHomeTabs({ initialTab: initialTabFromRoute })
  const handleTabChangeRef = useRef(handleTabChange)
  const [calculatorVisible, setCalculatorVisible] = useState(false)
  const [tabBarHeight, setTabBarHeight] = useState(0)

  const [infoDialog, setInfoDialog] = useState<{ title: string; message: string } | null>(null)

  const [pendingDeepLink, setPendingDeepLink] = useState<HomeDeepLinkParams | null>(null)
  const [appliedDeepLinkNonce, setAppliedDeepLinkNonce] = useState<string | null>(null)

  const featuredFromRoute = route?.params?.featured as FeaturedSectorRow | undefined

  const { currentDims, featuredConfig, calculatorInstanceKey, handleCalculatorDimsChange } =
    useHomeFeaturedFromRoute({
      featuredFromRoute,
      data,
      selectedSectionId,
      onSectionChange: handleSectionChange,
      onTypeToggle: handleTypeToggle,
      onVariantSelect: handleVariantSelect,
      onSliderChange: handleSliderChange,
      onEnsureHomeTab: () => {
        handleTabChange("home")
        setCalculatorVisible(false)
      },
    })

  useEffect(() => {
    if (!deepLinkFromRoute) return
    if (appliedDeepLinkNonce === deepLinkFromRoute.nonce) return
    setPendingDeepLink(deepLinkFromRoute)
  }, [deepLinkFromRoute, appliedDeepLinkNonce])

  useEffect(() => {
    if (!pendingDeepLink) return
    if (!data || !data.length) return

    const targetSection = data.find((section) => section.id === pendingDeepLink.sid) ?? null
    if (!targetSection) {
      setAppliedDeepLinkNonce(pendingDeepLink.nonce)
      setPendingDeepLink(null)
      return
    }

    const targetType =
      pendingDeepLink.type && targetSection.types?.some((t) => t.name === pendingDeepLink.type)
        ? pendingDeepLink.type
        : undefined

    handleTabChange("home")
    setCalculatorVisible(false)

    if (selectedSectionId !== targetSection.id) {
      handleSectionChange(targetSection.id)
      return
    }

    if (targetType && selectedType !== targetType) {
      handleTypeToggle(targetType)
      return
    }

    const variantCount = currentVariants.length
    const maxIndex = Math.max(0, variantCount - 1)

    let nextIndex: number | null = null
    if (typeof pendingDeepLink.vi === "number" && Number.isFinite(pendingDeepLink.vi)) {
      nextIndex = Math.max(0, Math.min(Math.round(pendingDeepLink.vi), maxIndex))
    } else if (typeof pendingDeepLink.sv === "number" && Number.isFinite(pendingDeepLink.sv)) {
      if (variantCount > 1) {
        const clamped = Math.max(0, Math.min(pendingDeepLink.sv, 100))
        nextIndex = Math.round((clamped / 100) * (variantCount - 1))
      } else {
        nextIndex = 0
      }
    }

    if (nextIndex != null && selectedVariantIndex !== nextIndex) {
      handleVariantSelect(nextIndex, targetType)
      return
    }

    setAppliedDeepLinkNonce(pendingDeepLink.nonce)
    setPendingDeepLink(null)
  }, [
    pendingDeepLink,
    data,
    selectedSectionId,
    selectedType,
    selectedVariantIndex,
    currentVariants.length,
    handleSectionChange,
    handleTypeToggle,
    handleVariantSelect,
    setActiveTab,
  ])

  // Ensure that when we are navigated to Home with an initialTab (e.g. from push notifications),
  // we switch to that tab once, without forcing the tab back on every user change.
  useEffect(() => {
    handleTabChangeRef.current = handleTabChange
  }, [handleTabChange])

  useEffect(() => {
    if (!initialTabParam) return
    if (initialTabFromRoute === "more") return
    handleTabChangeRef.current(initialTabFromRoute)
      ; (navigation as any)?.setParams?.({ initialTab: undefined })
  }, [initialTabFromRoute, initialTabParam, navigation])

  useEffect(() => {
    registerForPushNotificationsAsync()
  }, [])

  useEffect(() => {
    const previousTab = previousTabRef.current
    previousTabRef.current = activeTab

    if (activeTab !== "notifications") return
    if (previousTab === "notifications") return
    if (notificationsGuest) return

    refreshNotifications().catch(() => undefined)
  }, [activeTab, notificationsGuest, refreshNotifications])

  const handleOpenNotification = async (item: NotificationRow) => {
    await markAsRead(item.id)

    if (item.url) {
      const baseUrl =
        process.env.EXPO_PUBLIC_SITE_URL ||
        process.env.EXPO_PUBLIC_SUPABASE_URL ||
        "https://iron-metal.net"

      const target = item.url.startsWith("http") ? item.url : `${baseUrl}${item.url}`

      try {
        await Linking.openURL(target)
      } catch (e) {
        console.warn("Failed to open notification URL", e)
      }
    }
  }

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: theme.colors.background }]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    )
  }

  if (error) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: theme.colors.background }]}>
        <Text style={[styles.errorText, { color: theme.colors.error }]}>{t.catalogLoadFailed}</Text>
      </View>
    )
  }

  return (
    <View style={[styles.root, { backgroundColor: theme.colors.background }]}>
      <KeyboardAvoidingView
        style={[styles.container, { backgroundColor: theme.colors.background }]}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={0}
      >
        <AppBar visitorCount={stats.count} visitorCountries={stats.countries} />
        <View style={styles.tabStack}>
          <View
            style={[styles.tabPane, activeTab === "home" ? styles.tabPaneActive : styles.tabPaneHidden]}
            pointerEvents={activeTab === "home" ? "auto" : "none"}
          >
            <HomeMainContent
              data={data}
              selectedSectionId={selectedSectionId}
              selectedSection={selectedSection ?? undefined}
              selectedType={selectedType}
              currentVariant={currentVariant}
              currentVariants={currentVariants}
              selectedVariantIndex={selectedVariantIndex}
              sliderValue={sliderValue}
              onSectionChange={handleSectionChange}
              onTypeToggle={handleTypeToggle}
              onVariantSelect={handleVariantSelect}
              onSliderChange={handleSliderChange}
              onCalculatorPress={() => setCalculatorVisible(true)}
              dims={currentDims}
              bottomPadding={tabBarHeight + (insets.bottom || 0) + 8}
            />
          </View>

          <View
            style={[
              styles.tabPane,
              activeTab === "notifications" ? styles.tabPaneActive : styles.tabPaneHidden,
            ]}
            pointerEvents={activeTab === "notifications" ? "auto" : "none"}
          >
            <NotificationsScreen
              items={notifications}
              loading={notificationsLoading}
              error={notificationsError}
              isGuest={notificationsGuest}
              onRefresh={refreshNotifications}
              onMarkAllAsRead={markAllAsRead}
              onOpenNotification={handleOpenNotification}
              onPressLogin={() => navigation.navigate("Login" as never)}
            />
          </View>

          <View
            style={[
              styles.tabPane,
              activeTab === "account" ? styles.tabPaneActive : styles.tabPaneHidden,
            ]}
            pointerEvents={activeTab === "account" ? "auto" : "none"}
          >
            <ProfileScreen />
          </View>
        </View>
      </KeyboardAvoidingView>

      <MoreMenuModal
        visible={moreVisible}
        onClose={handleCloseMore}
        insets={insets}
        tabHorizontalMargin={tabHorizontalMargin}
        tabBarHeight={tabBarHeight}
        onItemPress={(key) => {
          if (key === "theme") {
            theme.setMode(theme.mode === "dark" ? "light" : "dark")
            handleCloseMore()
          } else if (key === "account") {
            handleTabChange("account")
          } else if (key === "featured") {
            navigation.navigate("Featured" as never)
          } else {
            handleCloseMore()
            setInfoDialog({ title: t.underDevTitle, message: t.underDevBody })
          }
        }}
      />

      {infoDialog ? (
        <View
          pointerEvents="box-none"
          style={[
            StyleSheet.absoluteFillObject,
            {
              zIndex: 1000,
              elevation: 1000,
              alignItems: "center",
              justifyContent: "center",
              paddingHorizontal: 24,
            },
          ]}
        >
          <TouchableWithoutFeedback onPress={() => setInfoDialog(null)}>
            <View
              style={[
                StyleSheet.absoluteFillObject,
                { backgroundColor: theme.isDark ? "rgba(0,0,0,0.55)" : "rgba(0,0,0,0.25)" },
              ]}
            />
          </TouchableWithoutFeedback>

          <TouchableWithoutFeedback>
            <View
              style={[
                styles.infoDialogCard,
                {
                  backgroundColor: theme.colors.surface,
                  borderColor: theme.colors.border,
                },
              ]}
            >
              <Text
                style={[
                  styles.infoDialogTitle,
                  {
                    color: theme.colors.text,
                    writingDirection: isRTL ? "rtl" : "ltr",
                    textAlign: isRTL ? "right" : "left",
                  },
                ]}
              >
                {infoDialog.title}
              </Text>
              <Text
                style={[
                  styles.infoDialogMessage,
                  {
                    color: theme.colors.textSecondary,
                    writingDirection: isRTL ? "rtl" : "ltr",
                    textAlign: isRTL ? "right" : "left",
                  },
                ]}
              >
                {infoDialog.message}
              </Text>

              <View style={styles.infoDialogActions}>
                <TouchableOpacity activeOpacity={0.85} onPress={() => setInfoDialog(null)}>
                  <Text style={[styles.infoDialogActionText, { color: theme.colors.secondary }]}>{t.ok}</Text>
                </TouchableOpacity>
              </View>
            </View>
          </TouchableWithoutFeedback>
        </View>
      ) : null}

      <CalculatorModal
        key={calculatorInstanceKey}
        visible={calculatorVisible}
        onClose={() => setCalculatorVisible(false)}
        selectedSectionId={selectedSectionId}
        selectedType={selectedType}
        selectedVariantIndex={selectedVariantIndex}
        sliderValue={sliderValue}
        currentVariant={currentVariant}
        dims={currentDims}
        onDimsChange={handleCalculatorDimsChange}
        presetKey={featuredConfig?.id ?? null}
        initialPricePerKgInput={featuredConfig?.pricePerKgInput}
        initialRequiredInput={featuredConfig?.requiredInput}
        initialLengthInput={featuredConfig?.lengthInput}
        initialLengthUnit={featuredConfig?.lengthUnit}
      />

      <BottomTabNavigator
        activeTab={displayTab}
        onTabChange={handleTabChange}
        onOpenCalculations={() => navigation.navigate("EngineeringCalculations" as never)}
        notificationCount={unreadCount}
        visitorCount={stats.count}
        onTabBarLayout={setTabBarHeight}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#ffffff",
  },
  container: {
    flex: 1,
    backgroundColor: "#ffffff",
  },
  tabStack: {
    flex: 1,
    position: "relative",
  },
  tabPane: {
    ...StyleSheet.absoluteFillObject,
  },
  tabPaneActive: {
    opacity: 1,
    zIndex: 1,
  },
  tabPaneHidden: {
    opacity: 0,
    zIndex: 0,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  errorText: {
    color: "#dc2626",
    textAlign: "center",
    fontSize: 16,
    lineHeight: 24,
  },
  placeholder: {
    flex: 1,
    marginTop: 16,
    marginHorizontal: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    backgroundColor: "#ffffff",
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  placeholderText: {
    color: "#475569",
    textAlign: "center",
    fontSize: 16,
    lineHeight: 24,
  },
  infoDialogCard: {
    width: "100%",
    maxWidth: 420,
    borderRadius: 16,
    paddingHorizontal: 18,
    paddingVertical: 16,
    borderWidth: 1,
    shadowColor: "#000",
    shadowOpacity: 0.18,
    shadowOffset: { width: 0, height: 10 },
    shadowRadius: 20,
    elevation: 14,
  },
  infoDialogTitle: {
    fontSize: 17,
    fontWeight: "800",
    marginBottom: 8,
  },
  infoDialogMessage: {
    fontSize: 14,
    lineHeight: 20,
  },
  infoDialogActions: {
    marginTop: 14,
    alignItems: "flex-end",
  },
  infoDialogActionText: {
    fontSize: 14,
    fontWeight: "800",
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
})
