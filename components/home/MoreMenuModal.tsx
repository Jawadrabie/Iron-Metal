import { memo, useMemo } from "react"
import type { ComponentProps } from "react"
import { Feather } from "@expo/vector-icons"
import { StyleSheet, Text, TouchableOpacity, TouchableWithoutFeedback, View } from "react-native"
import type { EdgeInsets } from "react-native-safe-area-context"
import { useTheme } from "../../contexts/ThemeContext"
import { useI18n } from "../../contexts/I18nContext"

const GAP_ABOVE_TAB = 12

const MORE_ITEMS = [
  { key: "theme", icon: "sun" },
  { key: "install", icon: "download" },
  { key: "shortcuts", icon: "command" },
  { key: "settings", icon: "settings" },
  { key: "account", icon: "user" },
  { key: "archive", icon: "archive" },
  { key: "featured", icon: "star" },
  { key: "localLink", icon: "link-2" },
  { key: "support", icon: "life-buoy" },
] as const

type MoreItemKey = (typeof MORE_ITEMS)[number]["key"]

type MoreItem = {
  key: MoreItemKey
  label: string
  icon: ComponentProps<typeof Feather>["name"]
}

type MoreMenuModalProps = {
  visible: boolean
  onClose: () => void
  insets: EdgeInsets
  tabHorizontalMargin: number
  tabBarHeight: number
  onItemPress?: (key: MoreItemKey) => void
}

export const MoreMenuModal = memo(function MoreMenuModal({ visible, onClose, insets, tabHorizontalMargin, tabBarHeight, onItemPress }: MoreMenuModalProps) {
  const theme = useTheme()
  const isDark = theme.isDark
  const { t } = useI18n()

  const items = useMemo<MoreItem[]>(() => {
    const tt = t.common.moreMenu

    const themeIcon: MoreItem["icon"] = theme.mode === "dark" ? "moon" : "sun"
    const themeLabel = theme.mode === "dark" ? tt.themeDark : tt.themeLight

    const labelByKey: Record<MoreItemKey, string> = {
      theme: themeLabel,
      install: tt.install,
      shortcuts: tt.shortcuts,
      settings: tt.settings,
      account: tt.account,
      archive: tt.archive,
      featured: tt.featured,
      localLink: tt.localLink,
      support: tt.support,
    }

    return (MORE_ITEMS as unknown as Array<{ key: MoreItemKey; icon: MoreItem["icon"] }>).map((item) => {
      return {
        key: item.key,
        icon: item.key === "theme" ? themeIcon : item.icon,
        label: labelByKey[item.key],
      }
    })
  }, [t, theme.mode])

  if (!visible) return null

  return (
    <View
      pointerEvents="box-none"
      style={[
        StyleSheet.absoluteFillObject,
        {
          bottom: (insets.bottom || 0) + tabBarHeight,
          zIndex: 100,
          elevation: 100,
        },
      ]}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View
          style={[
            styles.moreBackdrop,
            {
              paddingBottom: GAP_ABOVE_TAB,
              paddingRight: tabHorizontalMargin + 5,
            },
          ]}
        >
          <TouchableWithoutFeedback>
            <View style={[styles.moreCard, isDark ? { backgroundColor: theme.colors.background } : null]}>
              <View style={styles.moreGrid}>
                {items.map((item) => (
                  <TouchableOpacity
                    key={item.key}
                    style={styles.moreItem}
                    activeOpacity={0.8}
                    onPress={() => {
                      onItemPress?.(item.key)
                    }}
                  >
                    <View style={styles.moreIconCircle}>
                      <Feather name={item.icon} size={16} color={theme.colors.secondary} />
                    </View>
                    <Text
                      style={[
                        styles.moreItemLabel,
                        isDark ? { color: theme.colors.textSecondary } : null,
                      ]}
                    >
                      {item.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </View>
  )
})

const styles = StyleSheet.create({
  moreBackdrop: {
    flex: 1,
    backgroundColor: "transparent",
    justifyContent: "flex-end",
    alignItems: "flex-end",
  },
  moreCard: {
    width: 220,
    borderRadius: 16,
    backgroundColor: "#ffffff",
    paddingVertical: 8,
    paddingHorizontal: 8,
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 8,
    elevation: 6,
  },
  moreGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  moreItem: {
    width: "30%",
    alignItems: "center",
    marginVertical: 8,
  },
  moreIconCircle: {
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  moreItemLabel: {
    fontSize: 12,
    color: "#374151",
    textAlign: "center",
  },
})
