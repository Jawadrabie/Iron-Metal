import { Ionicons } from "@expo/vector-icons"
import { memo, useEffect, useRef } from "react"
import { Animated, StyleSheet, Text, TouchableOpacity, View } from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import { useTheme } from "../../contexts/ThemeContext"

const ORANGE = "#f08c21"

export type TabKey = "home" | "calculations" | "notifications" | "account" | "more"

type TabDefinition = {
  key: TabKey
  label: string
  inactiveIcon: keyof typeof Ionicons.glyphMap
  activeIcon: keyof typeof Ionicons.glyphMap
}

type BottomTabNavigatorProps = {
  activeTab: TabKey
  onTabChange: (tab: TabKey) => void
  notificationCount?: number
  visitorCount?: number
  notificationPulse?: number
  onTabBarLayout?: (height: number) => void
}

const TAB_DEFINITIONS: TabDefinition[] = [
  { key: "home", label: "الرئيسية", inactiveIcon: "home-outline", activeIcon: "home-sharp" },
  {
    key: "notifications",
    label: "الإشعارات",
    inactiveIcon: "notifications-outline",
    activeIcon: "notifications",
  },
  { key: "account", label: "الحساب", inactiveIcon: "person-outline", activeIcon: "person" },
  { key: "more", label: "المزيد", inactiveIcon: "grid-outline", activeIcon: "grid" },
]

const CALC_TAB: TabDefinition = {
  key: "calculations",
  label: "الحاسبات",
  inactiveIcon: "calculator-outline",
  activeIcon: "calculator",
}

export const BottomTabNavigator = memo(function BottomTabNavigator({
  activeTab,
  onTabChange,
  notificationCount = 0,
  visitorCount = 0,
  onTabBarLayout,
  notificationPulse,
}: BottomTabNavigatorProps) {
  const insets = useSafeAreaInsets()
  const theme = useTheme()

  const animValuesRef = useRef<Record<TabKey, Animated.Value> | null>(null)

  if (!animValuesRef.current) {
    animValuesRef.current = {
      home: new Animated.Value(activeTab === "home" ? 1 : 0),
      calculations: new Animated.Value(activeTab === "calculations" ? 1 : 0),
      notifications: new Animated.Value(activeTab === "notifications" ? 1 : 0),
      account: new Animated.Value(activeTab === "account" ? 1 : 0),
      more: new Animated.Value(activeTab === "more" ? 1 : 0),
    }
  }

  const animValues = animValuesRef.current

  useEffect(() => {
    ;[...TAB_DEFINITIONS, CALC_TAB].forEach((tab) => {
      const value = animValues[tab.key]
      Animated.timing(value, {
        toValue: tab.key === activeTab ? 1 : 0,
        duration: 180,
        // نستخدم useNativeDriver لأننا نحرّك الـ scale/translate فقط
        useNativeDriver: true,
      }).start()
    })
  }, [activeTab, animValues])

  return (
    <View
      pointerEvents="box-none"
      style={[
        styles.wrapper,
        { paddingBottom: (insets.bottom || 0) + 6 },
      ]}
    >
      <View style={styles.row} onLayout={(event) => onTabBarLayout?.(event.nativeEvent.layout.height)}>
        <TouchableOpacity
          activeOpacity={0.9}
          style={[
            styles.calcButton,
            {
              backgroundColor: theme.colors.surface,
              borderColor: theme.colors.border,
            },
            activeTab === "calculations" ? styles.calcButtonActive : null,
          ]}
          accessibilityRole="button"
          accessibilityLabel={CALC_TAB.label}
          onPress={() => onTabChange("calculations")}
        >
          <View style={styles.pill}>
            {(() => {
              const progress = animValues.calculations
              const iconScale = progress.interpolate({
                inputRange: [0, 1],
                outputRange: [0.95, 1.25],
              })
              const iconTranslateY = progress.interpolate({
                inputRange: [0, 1],
                outputRange: [1, -1],
              })
              const isActive = activeTab === "calculations"
              const iconName = isActive ? CALC_TAB.activeIcon : CALC_TAB.inactiveIcon
              const iconColor = isActive ? theme.colors.secondary : theme.colors.textSecondary
              return (
                <Animated.View
                  style={[
                    styles.iconWrapper,
                    {
                      transform: [{ scale: iconScale }, { translateY: iconTranslateY }],
                    },
                  ]}
                >
                  <Ionicons name={iconName} size={22} color={iconColor} />
                </Animated.View>
              )
            })()}
          </View>
        </TouchableOpacity>

        <View
          style={[
            styles.tabBar,
            {
              backgroundColor: theme.colors.surface,
              borderColor: theme.colors.border,
            },
          ]}
        >
          {TAB_DEFINITIONS.map((tab) => {
            const progress = animValues[tab.key]
            const iconScale = progress.interpolate({
              inputRange: [0, 1],
              outputRange: [0.95, 1.25],
            })
            const iconTranslateY = progress.interpolate({
              inputRange: [0, 1],
              outputRange: [1, -1],
            })
            const isActive = tab.key === activeTab
            const iconName = isActive ? tab.activeIcon : tab.inactiveIcon
            const iconColor =
              tab.key === "notifications"
                ? isActive
                  ? ORANGE
                  : theme.colors.textSecondary
                : isActive
                  ? theme.colors.secondary
                  : theme.colors.textSecondary
            return (
              <TouchableOpacity
                key={tab.key}
                activeOpacity={0.9}
                style={styles.tabButton}
                accessibilityRole="button"
                accessibilityLabel={tab.label}
                onPress={() => onTabChange(tab.key)}
              >
                <View style={styles.pill}>
                  <Animated.View
                    style={[
                      styles.iconWrapper,
                      {
                        transform: [{ scale: iconScale }, { translateY: iconTranslateY }],
                      },
                    ]}
                  >
                    <Ionicons name={iconName} size={22} color={iconColor} />
                  </Animated.View>

                  {tab.key === "notifications" && notificationCount > 0 ? (
                    <View
                      style={[
                        styles.badge,
                        notificationPulse ? styles.badgePulse : null,
                      ]}
                    >
                      <Text style={styles.badgeText} numberOfLines={1}>
                        {notificationCount > 99 ? "99+" : notificationCount}
                      </Text>
                    </View>
                  ) : null}
                </View>
              </TouchableOpacity>
            )
          })}
        </View>
      </View>
    </View>
  )
})

const styles = StyleSheet.create({
  wrapper: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: "center",
    zIndex: 1000,
    elevation: 1000,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    width: "90%",
    maxWidth: 480,
  },
  tabBar: {
    flex: 1,
    backgroundColor: "#ffffff",
    borderRadius: 28,
    borderWidth: 2,
    borderColor: "#e5e7eb",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 10,
    paddingVertical: 0,
    shadowColor: "transparent",
    shadowRadius: 0,
    shadowOffset: { width: 0, height: 0 },
    elevation: 0,
  },
  calcButton: {
    width: 62,
    height: 56,
    borderRadius: 28,
    borderWidth: 2,
    marginRight: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  calcButtonActive: {
    borderColor: "rgba(240,140,33,0.40)",
    backgroundColor: "rgba(240,140,33,0.08)",
  },
  tabButton: {
    flex: 1,
    alignItems: "center",
  },
  pill: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 16,
  },
  iconWrapper: {
    width: 50,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "transparent",
    borderRadius: 6,
  },
  badge: {
    position: "absolute",
    top: 3,
    right: 10,
    backgroundColor: ORANGE,
    borderRadius: 999,
    minWidth: 18,
    height: 18,
    paddingHorizontal: 5,
    alignItems: "center",
    justifyContent: "center",
  },
  badgePulse: {
    transform: [{ scale: 1.05 }],
  },
  badgeText: {
    color: "#ffffff",
    fontSize: 11,
    fontWeight: "700",

  },
  // visitor indicator moved to AppBar
})
