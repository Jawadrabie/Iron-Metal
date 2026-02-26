import { Feather } from "@expo/vector-icons"
import { StyleSheet, Text, TouchableOpacity, View, type StyleProp, type ViewStyle } from "react-native"

import { useI18n } from "../../contexts/I18nContext"
import { useTheme } from "../../contexts/ThemeContext"

type ErrorStateProps = {
  message?: string | null
  onRetry?: () => void
  iconName?: keyof typeof Feather.glyphMap
  style?: StyleProp<ViewStyle>
}

export function ErrorState({
  message,
  onRetry,
  iconName = "wifi-off",
  style,
}: ErrorStateProps) {
  const theme = useTheme()
  const isDark = theme.isDark
  const { isRTL, t } = useI18n()

  const fallbackMessage = t.common.errorState.defaultMessage
  const retryLabel = t.common.errorState.retry
  const displayMessage = message?.trim() || fallbackMessage

  return (
    <View style={[styles.container, style]}>
      <View
        style={[
          styles.iconWrap,
          {
            backgroundColor: isDark ? theme.colors.surface2 : "#eef2ff",
            borderColor: isDark ? theme.colors.border : "#e5e7eb",
          },
        ]}
      >
        <Feather name={iconName} size={24} color={isDark ? theme.colors.secondary : "#4f46e5"} />
      </View>

      <Text
        style={[
          styles.message,
          { color: isDark ? theme.colors.textSecondary : "#4b5563" },
          isRTL ? { writingDirection: "rtl", textAlign: "center" } : null,
        ]}
      >
        {displayMessage}
      </Text>

      {!!onRetry && (
        <TouchableOpacity
          style={[styles.retryButton, { backgroundColor: theme.colors.secondary }]}
          activeOpacity={0.9}
          onPress={onRetry}
        >
          <Feather name="refresh-cw" size={16} color="#ffffff" />
          <Text
            style={[
              styles.retryText,
              isRTL ? { writingDirection: "rtl" as const } : null,
            ]}
          >
            {retryLabel}
          </Text>
        </TouchableOpacity>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
    paddingVertical: 20,
  },
  iconWrap: {
    width: 58,
    height: 58,
    borderRadius: 29,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  message: {
    fontSize: 14,
    lineHeight: 21,
    textAlign: "center",
    marginBottom: 14,
  },
  retryButton: {
    minWidth: 144,
    height: 42,
    paddingHorizontal: 18,
    borderRadius: 999,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  retryText: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "700",
  },
})
