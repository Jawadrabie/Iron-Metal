import React, { useEffect, useMemo, useRef, useState } from "react"
import {
  View,
  Text,
  TextInput,
  Pressable,
  Platform,
  StyleSheet,
  ViewStyle,
  TextStyle,
} from "react-native"
import CountryFlag from "react-native-country-flag"
import { useTheme } from "../../contexts/ThemeContext"
import {
  CountryCode,
  getCountries,
  getCountryCallingCode,
  getExampleNumber,
  parsePhoneNumberFromString,
} from "libphonenumber-js"
import examples from "libphonenumber-js/examples.mobile.json"

export type PhoneNumberValue = {
  callingCode: string
  nationalNumber: string
  country?: CountryCode | null
  e164?: string | null
}

export type PhoneNumberInputProps = {
  value: PhoneNumberValue
  onChange: (value: PhoneNumberValue) => void
  onBlur?: () => void
  onValidityChange?: (valid: boolean) => void
  containerStyle?: ViewStyle
  leftInputStyle?: TextStyle
  rightInputStyle?: TextStyle
}

const ALL_COUNTRIES: CountryCode[] = getCountries()
const MAX_COUNTRY_CODE_LENGTH = 3

const normalizeDigits = (v: string) =>
  v
    .replace(/[\u0660-\u0669]/g, (digit) => String(digit.charCodeAt(0) - 0x0660))
    .replace(/[\u06F0-\u06F9]/g, (digit) => String(digit.charCodeAt(0) - 0x06f0))

const onlyDigits = (v: string) => normalizeDigits(v).replace(/\D/g, "")
const normalizeCallingCode = (v: string) => `+${onlyDigits(v)}`

function derive(callingCode: string, national: string) {
  const codeDigits = onlyDigits(callingCode)
  const nationalDigits = onlyDigits(national)

  const matches = ALL_COUNTRIES.filter(
    (c) => getCountryCallingCode(c) === codeDigits,
  )

  const hintCountry =
    matches.length === 1 ? matches[0] : null

  let hint: string | undefined
  let maxLength: number | undefined
  let expectedLength: number | undefined

  if (hintCountry) {
    try {
      const example = getExampleNumber(hintCountry, examples as any)
      if (example) {
        hint = example.formatNational().replace(/\d/g, "5")
        maxLength = example.nationalNumber.length + 1
        expectedLength = example.nationalNumber.length
      }
    } catch {
    }
  }

  if (!hint) {
    const defaultHintLength = nationalDigits.length > 0 ? nationalDigits.length : 9
    hint = "5".repeat(defaultHintLength)
  }

  if (!maxLength) {
    maxLength = 15
  }

  let isValid = false
  let e164: string | null = null
  let resolvedCountry: CountryCode | null = null

  if (codeDigits && nationalDigits) {
    const parsed = parsePhoneNumberFromString(
      `+${codeDigits}${nationalDigits}`,
    )
    if (parsed) {
      isValid = parsed.isValid()
      e164 = parsed.number
      resolvedCountry = parsed.country || null
    }

    if (!isValid) {
      const stripped = nationalDigits.replace(/^0+/, "")
      if (stripped && stripped !== nationalDigits) {
        const parsedStripped = parsePhoneNumberFromString(
          `+${codeDigits}${stripped}`,
        )
        if (parsedStripped) {
          const strippedValid = parsedStripped.isValid()
          if (strippedValid) {
            isValid = true
            e164 = parsedStripped.number
            resolvedCountry = parsedStripped.country || resolvedCountry
          }
        }
      }
    }
  }

  if (!expectedLength && resolvedCountry) {
    try {
      const exampleResolved = getExampleNumber(resolvedCountry, examples as any)
      if (exampleResolved) {
        expectedLength = exampleResolved.nationalNumber.length
        if (!hintCountry && hint) {
          hint = exampleResolved.formatNational().replace(/\d/g, "5")
        }
        if (maxLength === 15) {
          maxLength = expectedLength + 1
        }
      }
    } catch {
    }
  }

  if (expectedLength) {
    const strippedLength = nationalDigits.replace(/^0+/, "").length
    const isComplete =
      nationalDigits.length === expectedLength || strippedLength === expectedLength
    isValid = isValid && isComplete
  }

  if (!resolvedCountry && hintCountry) {
    resolvedCountry = hintCountry
  }

  return { resolvedCountry, hint, maxLength, isValid, e164 }
}

export const PhoneNumberInput: React.FC<PhoneNumberInputProps> = ({
  value,
  onChange,
  onBlur,
  onValidityChange,
  containerStyle,
  leftInputStyle,
  rightInputStyle,
}) => {
  const theme = useTheme()
  const isDark = theme.isDark

  const leftInputRef = useRef<TextInput>(null)

  const [codeDigits, setCodeDigits] = useState(
    onlyDigits(value.callingCode || ""),
  )
  const [nationalDigits, setNationalDigits] = useState(
    onlyDigits(value.nationalNumber || ""),
  )

  const derived = useMemo(
    () => derive(`+${codeDigits}`, nationalDigits),
    [codeDigits, nationalDigits],
  )

  useEffect(() => {
    onValidityChange?.(derived.isValid)
  }, [derived.isValid, onValidityChange])

  const handleCallingCodeChange = (text: string) => {
    const digits = onlyDigits(text).slice(0, MAX_COUNTRY_CODE_LENGTH)
    setCodeDigits(digits)

    const callingCode = normalizeCallingCode(digits)
    const next = derive(callingCode, nationalDigits)

    onChange({
      callingCode,
      nationalNumber: nationalDigits,
      country: next.resolvedCountry,
      e164: next.e164,
    })
  }

  const handleNationalChange = (text: string) => {
    const digits = onlyDigits(text)
    setNationalDigits(digits)

    const callingCode = normalizeCallingCode(codeDigits)
    const next = derive(callingCode, digits)

    onChange({
      callingCode,
      nationalNumber: digits,
      country: next.resolvedCountry,
      e164: next.e164,
    })
  }

  return (
    <View style={[styles.container, containerStyle]}>
      <Pressable
        style={[
          styles.leftWrapper,
          isDark
            ? {
                borderColor: theme.colors.border,
                backgroundColor: theme.colors.surface2,
              }
            : null,
        ]}
        onPress={() => leftInputRef.current?.focus()}
      >
        <TextInput
          ref={leftInputRef}
          value={codeDigits}
          onChangeText={handleCallingCodeChange}
          keyboardType="phone-pad"
          style={[
            styles.leftInput,
            isDark ? { color: theme.colors.text } : null,
            leftInputStyle,
          ]}
          maxLength={MAX_COUNTRY_CODE_LENGTH}
          textAlignVertical="center"
          allowFontScaling={false}
          multiline={Platform.OS === "android"}
          numberOfLines={1}
          scrollEnabled={false}
        />

        {/* Overlay ثابت */}
        <View style={styles.leftOverlay} pointerEvents="none">
          <View style={styles.flagSlot}>
            {derived.resolvedCountry ? (
              <CountryFlag
                isoCode={derived.resolvedCountry.toLowerCase()}
                size={16}
              />
            ) : (
              <View style={{ width: 16, height: 16 }} />
            )}
          </View>

          <Text style={[styles.plusText, isDark ? { color: theme.colors.text } : null]}>+</Text>
        </View>
      </Pressable>

      <TextInput
        value={nationalDigits}
        onChangeText={handleNationalChange}
        keyboardType="phone-pad"
        style={[
          styles.rightInput,
          isDark
            ? {
                borderColor: theme.colors.border,
                backgroundColor: theme.colors.surface2,
                color: theme.colors.text,
              }
            : null,
          rightInputStyle,
        ]}
        placeholder={derived.hint}
        placeholderTextColor={isDark ? theme.colors.textSecondary : "#9CA3AF"}
        maxLength={derived.maxLength}
        onBlur={onBlur}
        textAlignVertical="center"
        allowFontScaling={false}
        multiline={Platform.OS === "android"}
        numberOfLines={1}
        scrollEnabled={false}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
  },

  leftWrapper: {
    position: "relative",
    minWidth: 90,
    paddingHorizontal: 10,
    height: 44,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    backgroundColor: "#ffffff",
    marginRight: 8,
    justifyContent: "center",
  },

  leftOverlay: {
    position: "absolute",
    left: 10,
    top: 0,
    bottom: 0,
    flexDirection: "row",
    alignItems: "center",
  },

  flagSlot: {
    width: 22,
    alignItems: "center",
    justifyContent: "center",
  },

  plusText: {
    marginLeft: 13,
    fontSize: 14,
    fontWeight: "500",
    color: "#111827",
  },

  leftInput: {
    paddingLeft: 45,
    paddingVertical: 0,
    paddingHorizontal: 0,
    height: 44,
    includeFontPadding: false,
    fontSize: 14,
    color: "#111827",
    textAlignVertical: "center",
  },

  rightInput: {
    flex: 1,
    paddingHorizontal: 12,
    height: 44,
    paddingVertical: 0,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    backgroundColor: "#ffffff",
    fontSize: 14,
    color: "#111827",
    textAlignVertical: "center",
    includeFontPadding: false,
  },
})
