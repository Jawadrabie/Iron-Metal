import React from "react"
import { ActivityIndicator, Text, TextInput, TouchableOpacity, View } from "react-native"
import { useI18n } from "../../contexts/I18nContext"
import { useTheme } from "../../contexts/ThemeContext"

type LoginCodeFormProps = {
  code: string
  isPending: boolean
  styles: any
  onChangeCode: (value: string) => void
  onSubmit: () => void
  onUseDifferentNumber: () => void
}

export function LoginCodeForm({
  code,
  isPending,
  styles,
  onChangeCode,
  onSubmit,
  onUseDifferentNumber,
}: LoginCodeFormProps) {
  const theme = useTheme()
  const isDark = theme.isDark

  const trimmed = code.trim()
  const isSubmitDisabled = trimmed.length < 4 || isPending

  const { isRTL, t } = useI18n()
  const tt = t.auth.loginCodeForm
  const label = tt.label
  const placeholder = `\u200E${tt.placeholder}`
  const buttonText = tt.buttonText
  const secondaryText = tt.secondaryText

  return (
    <View style={styles.formBox}>
      <View style={styles.fieldGroup}>
        <Text
          style={[
            styles.label,
            isRTL ? { textAlign: "right", alignSelf: "flex-end" } : null,
          ]}
        >
          {label}
        </Text>
        <TextInput
          style={[
            styles.input,
            styles.codeInput,
            !code ? { letterSpacing: 0 } : null,
          ]}
          value={code}
          onChangeText={onChangeCode}
          keyboardType="number-pad"
          maxLength={6}
          placeholder={placeholder}
          placeholderTextColor={isDark ? theme.colors.textSecondary : "#9ca3af"}
        />
      </View>

      <TouchableOpacity
        style={[
          styles.primaryButton,
          isSubmitDisabled ? styles.primaryButtonDisabled : null,
        ]}
        activeOpacity={0.9}
        onPress={onSubmit}
        disabled={isSubmitDisabled}
      >
        {isPending ? (
          <ActivityIndicator color="#ffffff" />
        ) : (
          <Text style={styles.primaryButtonText}>{buttonText}</Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity style={styles.secondaryLink} onPress={onUseDifferentNumber}>
        <Text
          style={[
            styles.secondaryLinkText,
            isRTL ? { textAlign: "right" } : null,
          ]}
        >
          {secondaryText}
        </Text>
      </TouchableOpacity>
    </View>
  )
}
