import { memo, useEffect, useRef, useState } from "react"
import { Animated, TouchableOpacity, View } from "react-native"
import { Feather, MaterialIcons } from "@expo/vector-icons"

import { useTheme } from "../../contexts/ThemeContext"
import { calculatorStyles as styles } from "./styles"

type ActionButtonsRowProps = {
  onPaint: () => void
  onShare: () => void
  onDownload: () => void
  onSave: () => void
  onScientific: () => void
  onBasic: () => void
  onReport: () => void
  isGeneratingPdf?: boolean
  isFeatured?: boolean
}

type ActionKey = Exclude<keyof ActionButtonsRowProps, "isGeneratingPdf" | "isFeatured">

const DOWNLOAD_ICON_SIZE = 18

const BUTTONS: Array<{
  icon: keyof typeof Feather.glyphMap
  label: string
  actionKey: ActionKey
  danger?: boolean
}> = [
  { icon: "edit", label: "Paint", actionKey: "onPaint" },
  { icon: "share-2", label: "Share", actionKey: "onShare" },
  { icon: "download", label: "Download", actionKey: "onDownload" },
  { icon: "star", label: "Save", actionKey: "onSave" },
  { icon: "grid", label: "Sci Calc", actionKey: "onScientific" },
  { icon: "hash", label: "Calculator", actionKey: "onBasic" },
  { icon: "alert-triangle", label: "Report", actionKey: "onReport", danger: true },
]

export const ActionButtonsRow = memo(function ActionButtonsRow(props: ActionButtonsRowProps) {
  const theme = useTheme()
  const isDark = theme.isDark

  const { isGeneratingPdf = false, isFeatured = false } = props

  const downloadFill = useRef(new Animated.Value(0)).current
  const [pressedKey, setPressedKey] = useState<ActionKey | null>(null)

  useEffect(() => {
    if (isGeneratingPdf) {
      // ابدأ بجزء صغير برتقالي ليظهر اللون فور الضغط، ثم املأ الأيقونة من الأعلى للأسفل
      downloadFill.setValue(0.66)
      Animated.timing(downloadFill, {
        toValue: 1,
        duration: 1200,
        useNativeDriver: false,
      }).start()
    } else {
      // أعدها للحالة الأصلية بسرعة عند الانتهاء
      Animated.timing(downloadFill, {
        toValue: 0,
        duration: 150,
        useNativeDriver: false,
      }).start()
    }
  }, [isGeneratingPdf, downloadFill])

  const downloadFillHeight = downloadFill.interpolate({
    inputRange: [0, 1],
    outputRange: [0, DOWNLOAD_ICON_SIZE],
  })

  return (
    <View style={styles.actionsRow}>
      {BUTTONS.map(({ icon, label, actionKey, danger }) => {
        const isDownload = actionKey === "onDownload"
        const isStar = actionKey === "onSave"
        const isShare = actionKey === "onShare"
        const isPressed = pressedKey === actionKey
        const isDisabled = isDownload && isGeneratingPdf

        return (
          <View key={label} style={styles.iconButtonWrapper}>
            <TouchableOpacity
              style={[
                styles.iconCircle,
                danger && styles.iconCircleWarning,
                isDark
                  ? {
                      backgroundColor: theme.colors.surface2,
                      borderColor: theme.colors.border,
                      borderWidth: 1,
                    }
                  : null,
              ]}
              onPress={() => props[actionKey]()}
              onPressIn={() => setPressedKey(actionKey)}
              onPressOut={() => {
                setPressedKey((current) => (current === actionKey ? null : current))
              }}
              activeOpacity={0.8}
              disabled={isDisabled}
            >
              {isDownload ? (
                <View
                  style={{
                    width: DOWNLOAD_ICON_SIZE,
                    height: DOWNLOAD_ICON_SIZE,
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  {/* الأيقونة الأساسية باللون الأبيض */}
                  <View
                    style={{
                      position: "absolute",
                      left: 0,
                      right: 0,
                      top: 0,
                      bottom: 0,
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Feather name={icon} size={DOWNLOAD_ICON_SIZE} color={isDark ? theme.colors.neutral : "#ffffff"} />
                  </View>

                  {/* طبقة برتقالية تنتشر من الأعلى إلى الأسفل */}
                  <Animated.View
                    style={{
                      position: "absolute",
                      left: 0,
                      right: 0,
                      top: 0,
                      height: downloadFillHeight,
                      overflow: "hidden",
                      alignItems: "center",
                      justifyContent: "flex-start",
                    }}
                  >
                    <Feather name={icon} size={DOWNLOAD_ICON_SIZE} color="#ff9800" />
                  </Animated.View>
                </View>
              ) : isStar ? (
                <MaterialIcons
                  name={isFeatured ? "star" : "star-border"}
                  size={18}
                  color={isFeatured ? "#ff9800" : isDark ? theme.colors.neutral : "#ffffff"}
                />
              ) : (
                <Feather
                  name={icon}
                  size={18}
                  color={isShare && isPressed ? "#ff9800" : isDark ? theme.colors.neutral : "#ffffff"}
                />
              )}
            </TouchableOpacity>
          </View>
        )
      })}
    </View>
  )
})
