import React from "react"
import { TouchableOpacity, View } from "react-native"
import { Feather } from "@expo/vector-icons"
import { useTheme } from "../../contexts/ThemeContext"

type LoginBackButtonRowProps = {
  onPress: () => void
  styles: any
}

export function LoginBackButtonRow({ onPress, styles }: LoginBackButtonRowProps) {
  const theme = useTheme()
  const isDark = theme.isDark

  return (
    <View style={styles.backRow}>
      <TouchableOpacity onPress={onPress}>
        <Feather name="arrow-left" size={22} color={isDark ? theme.colors.textSecondary : "#6b7280"} />
      </TouchableOpacity>
    </View>
  )
}
