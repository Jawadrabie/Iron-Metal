import React from "react"
import { Text, View } from "react-native"
import { Feather } from "@expo/vector-icons"
import { useTheme } from "../../contexts/ThemeContext"

type LoginAlertsProps = {
  errorMessage: string | null
  successMessage: string | null
  styles: any
}

export function LoginAlerts({ errorMessage, successMessage, styles }: LoginAlertsProps) {
  const theme = useTheme()
  const isDark = theme.isDark

  return (
    <>
      {errorMessage && (
        <View style={styles.errorBanner}>
          <Feather name="alert-circle" size={18} color={isDark ? theme.colors.error : "#b91c1c"} />
          <Text style={styles.errorBannerText}>{errorMessage}</Text>
        </View>
      )}

      {successMessage && (
        <View style={styles.successBanner}>
          <Feather name="check-circle" size={18} color={isDark ? theme.colors.success : "#16A34A"} />
          <Text style={styles.successBannerText}>{successMessage}</Text>
        </View>
      )}
    </>
  )
}
