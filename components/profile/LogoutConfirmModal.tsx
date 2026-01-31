import React from "react"
import {
  Modal,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native"
import { Feather } from "@expo/vector-icons"
import { useI18n } from "../../contexts/I18nContext"
import { useTheme } from "../../contexts/ThemeContext"

export type LogoutConfirmModalProps = {
  visible: boolean
  onClose: () => void
  onConfirm: () => void | Promise<void>
  styles: any
}

export function LogoutConfirmModal({
  visible,
  onClose,
  onConfirm,
  styles,
}: LogoutConfirmModalProps) {
  if (!visible) return null

  const theme = useTheme()
  const isDark = theme.isDark

  const { isRTL, t } = useI18n()
  const rtlText = {
    textAlign: isRTL ? ("right" as const) : ("left" as const),
    writingDirection: isRTL ? ("rtl" as const) : ("ltr" as const),
  }
  const tt = t.profile.logoutConfirm

  return (
    <Modal
      transparent
      animationType="fade"
      visible={visible}
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View
          style={[
            styles.confirmBackdrop,
            isDark ? { backgroundColor: "rgba(0,0,0,0.55)" } : null,
          ]}
        >
          <TouchableWithoutFeedback>
            <View
              style={[
                styles.confirmCard,
                isDark
                  ? {
                      backgroundColor: theme.colors.surface,
                      borderColor: theme.colors.border,
                      borderWidth: 1,
                    }
                  : null,
              ]}
            >
              <View style={styles.confirmIconCircle}>
                <Feather name="log-out" size={20} color="#dc2626" />
              </View>
              <Text style={[styles.confirmTitle, rtlText, isDark ? { color: theme.colors.text } : null]}>{tt.title}</Text>
              <Text style={[styles.confirmSubtitle, rtlText, isDark ? { color: theme.colors.textSecondary } : null]}>{tt.subtitle}</Text>

              <View style={styles.confirmButtonsRow}>
                <TouchableOpacity
                  style={[
                    styles.confirmCancelButton,
                    isDark
                      ? {
                          backgroundColor: theme.colors.surface2,
                          borderColor: theme.colors.border,
                        }
                      : null,
                  ]}
                  activeOpacity={0.9}
                  onPress={onClose}
                >
                  <Text style={[styles.confirmCancelText, rtlText, isDark ? { color: theme.colors.text } : null]}>{tt.cancel}</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.confirmLogoutButton}
                  activeOpacity={0.9}
                  onPress={onConfirm}
                >
                  <Text style={[styles.confirmLogoutText, rtlText]}>{tt.confirm}</Text>
                </TouchableOpacity>
              </View>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  )
}
